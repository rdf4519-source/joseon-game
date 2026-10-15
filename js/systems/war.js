// 출병·이동·전투·주둔·회수 (GDD 10·18·22절)
// 국가 전투력은 단일 수치. 출격한 만큼 deployed에 묶이고 회수되면 풀린다.
import { CONFIG } from '../config.js';
import { BUILDINGS } from '../../data/buildings.js';
import { neighbors, uid, addAnnal } from '../state.js';

export const availableMilitary = state => state.nation.military - state.nation.deployed;

export function regionDefense(state, r) {
  const fromBuildings = r.buildings.reduce((s, b) => s + (BUILDINGS[b].effect.defense ?? 0), 0);
  const garrison = state.armies
    .filter(a => a.status === 'garrison' && a.at === r.id && a.owner === r.controller)
    .reduce((s, a) => s + a.strength, 0);
  return r.baseDefense + fromBuildings + garrison;
}

// BFS 최단 경로 (지역 id 배열). 통과 가능 조건은 passable로 판정.
function findPath(state, from, to, passable) {
  const prev = { [from]: null };
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === to) break;
    for (const nb of neighbors(state, cur)) {
      if (nb in prev || !(nb === to || passable(state.regions[nb]))) continue;
      prev[nb] = cur;
      queue.push(nb);
    }
  }
  if (!(to in prev)) return null;
  const path = [];
  for (let c = to; c; c = prev[c]) path.unshift(c);
  return path;
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function pathLength(state, path) {
  let len = 0;
  for (let i = 1; i < path.length; i++) len += dist(state.regions[path[i - 1]], state.regions[path[i]]);
  return len;
}

// 가장 가까운 유효한 군영을 자동 선택 (GDD 17.4). 군영이 없으면 수도에서 출발.
export function planDispatch(state, owner, targetId) {
  const own = r => r.controller === owner;
  const owned = Object.values(state.regions).filter(own);
  const withBase = owned.filter(r => r.buildings.includes('barracks') || r.capital);
  const bases = withBase.length ? withBase : owned;
  let best = null;
  for (const base of bases) {
    const path = findPath(state, base.id, targetId, own);
    if (!path) continue;
    const len = pathLength(state, path);
    if (!best || len < best.len) best = { base, path, len };
  }
  if (!best) return null;
  return { ...best, days: Math.ceil(best.len / CONFIG.armySpeed) };
}

export function dispatch(state, owner, targetId, strength, emit) {
  const plan = planDispatch(state, owner, targetId);
  if (!plan) return false;
  const start = plan.base;
  state.armies.push({
    id: uid(state), owner, strength, target: targetId, path: plan.path, leg: Math.min(1, plan.path.length - 1),
    x: start.x, y: start.y, status: 'moving', garrisonLeft: 0, at: null,
  });
  if (owner === state.player) {
    state.nation.deployed += strength;
    const enemy = state.countries[state.regions[targetId].controller];
    if (enemy) enemy.relation = Math.max(-100, enemy.relation - 30); // 선전포고 (임시 규칙)
  }
  emit('sound', 'march');
  return true;
}

export function recall(state, army) {
  if (army.owner === state.player) state.nation.deployed -= army.strength;
  state.armies = state.armies.filter(a => a !== army);
}

// 공격 측과 방어 측의 차이의 절댓값이 승자에게 남는다 (GDD 10절). 동률은 방어 측 승리(임시).
function resolveSiege(state, army, emit) {
  const r = state.regions[army.target];
  const defense = regionDefense(state, r);
  const isPlayer = army.owner === state.player;
  const isRevolt = r.controller === 'rebel';
  const ownerName = state.countries[army.owner]?.name ?? '반란군';
  const defenderName = state.countries[r.controller]?.name ?? '반란군';
  const loss = Math.min(army.strength, defense);

  // 방어 측 주둔군도 손실을 입는다
  for (const g of state.armies.filter(a => a.status === 'garrison' && a.at === r.id && a.owner === r.controller)) {
    const gl = Math.min(g.strength, loss);
    g.strength -= gl;
    if (g.owner === state.player) { state.nation.military -= gl; state.nation.deployed -= gl; }
  }
  state.armies = state.armies.filter(a => a.strength > 0);
  if (army.owner === state.player) { state.nation.military -= loss; state.nation.deployed -= loss; }

  if (army.strength > defense) {
    army.strength -= defense;
    r.controller = army.owner;
    if (!isRevolt) r.owner = army.owner;
    r.morale = Math.max(10, r.morale - 15);
    army.status = 'garrison';
    army.at = r.id;
    army.garrisonLeft = CONFIG.garrisonMonths;
    addAnnal(state, 'alt', `${ownerName} 군이 ${r.name}을(를) ${isRevolt ? '수복' : '점령'}하다.`);
    emit('toast', `⚔ ${ownerName}, ${r.name} ${isRevolt ? '수복' : '점령'} (잔여 ${Math.round(army.strength)})`);
  } else {
    addAnnal(state, 'alt', `${ownerName} 군이 ${r.name} 공략에 실패하다. (${defenderName} 방어)`);
    emit('toast', `🛡 ${r.name}: ${ownerName}의 공격 실패`);
    state.armies = state.armies.filter(a => a !== army);
    if (isPlayer && isRevolt) state.nation.courtSupport -= 10; // 진압 실패 (GDD 12.5)
  }
  emit('sound', 'battle');
  checkPlayerAlive(state);
}

function checkPlayerAlive(state) {
  if (!Object.values(state.regions).some(r => r.controller === state.player)) {
    state.gameOver = '조선의 모든 지역을 잃었습니다.';
  }
}

// 매일 호출: 이동
export function tickArmies(state, emit) {
  for (const a of [...state.armies]) {
    if (a.status !== 'moving') continue;
    const next = state.regions[a.path[a.leg]];
    const d = dist(a, next);
    if (d > CONFIG.armySpeed) {
      a.x += (next.x - a.x) / d * CONFIG.armySpeed;
      a.y += (next.y - a.y) / d * CONFIG.armySpeed;
      continue;
    }
    a.x = next.x; a.y = next.y;
    if (a.leg < a.path.length - 1) { a.leg++; continue; }
    const r = state.regions[a.target];
    if (r.controller === a.owner) {
      // 아군 지역에 도착: 방어 주둔
      a.status = 'garrison';
      a.at = r.id;
      a.garrisonLeft = CONFIG.garrisonMonths;
    } else {
      resolveSiege(state, a, emit);
    }
  }
}

// 매월 호출: 주둔 기간 감소 → 3턴 후 자동 회수 (GDD 18.4)
export function monthlyGarrison(state) {
  for (const a of [...state.armies]) {
    if (a.status !== 'garrison') continue;
    if (--a.garrisonLeft <= 0) recall(state, a);
  }
}

// 간단한 적국 AI: 관계가 나쁜 이웃이 가끔 국경 지역을 노린다.
export function enemyAI(state, emit) {
  for (const [cid, c] of Object.entries(state.countries)) {
    if (cid === state.player || c.relation > 0 || Math.random() > 0.04) continue;
    const borders = Object.values(state.regions).filter(r =>
      r.controller === state.player && neighbors(state, r.id).some(n => state.regions[n].controller === cid));
    if (!borders.length) continue;
    const target = borders[Math.floor(Math.random() * borders.length)];
    const strength = Math.round(regionDefense(state, target) * (0.6 + Math.random() * 0.9));
    if (dispatch(state, cid, target.id, strength, emit)) {
      state.pendingEvents.push({
        type: 'invasion',
        title: `${c.name}의 침공`,
        text: `${c.name} 군 약 ${strength}이(가) ${target.name}을(를) 향해 진군하고 있습니다. 현재 방어력 ${Math.round(regionDefense(state, target))}.`,
        choices: [{ label: '대비하라 (지도에서 증원 파병)', effect: {} }],
      });
    }
  }
}
