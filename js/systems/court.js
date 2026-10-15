// 조정: 정사 안건, 반대·강행·지연, 사건, 민심·변란, 암살 (GDD 12·13·20절)
import { CONFIG } from '../config.js';
import { POLICIES } from '../../data/policies.js';
import { EVENTS } from '../../data/events.js';
import { uid, neighbors, playerRegions, addAnnal } from '../state.js';

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export function applyEffect(state, effect = {}, regionId = null) {
  const n = state.nation;
  if (effect.treasury) n.treasury += effect.treasury;
  if (effect.grainReserve) n.grainReserve += effect.grainReserve;
  if (effect.military) n.military += effect.military;
  if (effect.courtSupport) n.courtSupport = clamp(n.courtSupport + effect.courtSupport);
  if (effect.brilliance) n.brilliance += effect.brilliance;
  if (effect.tradeIncome) n.tradeIncome = (n.tradeIncome ?? 0) + effect.tradeIncome;
  if (effect.pop) {
    // 인구 투입은 인구가 가장 많은 지역부터
    const r = playerRegions(state).sort((a, b) => b.pop - a.pop)[0];
    if (r) r.pop = Math.max(0, r.pop + effect.pop);
  }
  if (effect.moraleAll) for (const r of playerRegions(state)) r.morale = clamp(r.morale + effect.moraleAll);
  for (const [cid, v] of Object.entries(effect.relation ?? {})) {
    state.countries[cid].relation = clamp(state.countries[cid].relation + v, -100, 100);
  }
  const r = regionId && state.regions[regionId];
  if (r) {
    if (effect.regionMorale) r.morale = clamp(r.morale + effect.regionMorale);
    if (effect.regionGrain) r.grain = Math.max(0, r.grain * (1 + effect.regionGrain));
  }
}

export function canAfford(state, cost = {}) {
  return (cost.treasury ?? 0) <= state.nation.treasury && (cost.grainReserve ?? 0) <= state.nation.grainReserve;
}

// ── 정사 안건 ────────────────────────────────────────────

export function proposePolicy(state, policyId) {
  const p = POLICIES[policyId];
  const agenda = { id: uid(state), policyId, status: 'debate', monthsLeft: 0 };
  // 조정 지지가 높을수록 반대 확률이 줄어든다
  const opposeChance = p.opposition * (1.5 - state.nation.courtSupport / 100);
  if (Math.random() < opposeChance) {
    state.pendingEvents.push({
      title: `조정의 반대 — ${p.name}`,
      text: `대신들이 "${p.name}"에 반대하며 "통촉하여 주시옵소서"라고 아룁니다.`,
      choices: [
        { label: '뜻을 거두겠다', action: 'withdraw', params: { agendaId: agenda.id } },
        { label: `그래도 강행하라 (조정 지지 -${CONFIG.forceSupportCost}, 지연될 수 있음)`, action: 'force', params: { agendaId: agenda.id } },
      ],
    });
    state.agendas.push(agenda);
    return;
  }
  state.agendas.push(agenda);
  tryExecute(state, agenda);
}

// 강행·재상정 시 지지도에 따라 지연될 수 있다 (GDD 13.2 A안)
function tryExecute(state, agenda) {
  const p = POLICIES[agenda.policyId];
  const delayChance = CONFIG.delayBaseChance * (1 - state.nation.courtSupport / 100);
  if (agenda.status === 'forced' && Math.random() < delayChance) {
    agenda.status = 'delayed';
    agenda.monthsLeft = CONFIG.delayMonths;
    addAnnal(state, 'alt', `대신들의 상소가 이어져 "${p.name}" 시행이 보류되다.`);
    return;
  }
  if (!canAfford(state, p.cost)) {
    addAnnal(state, 'alt', `재원이 부족하여 "${p.name}"을(를) 시행하지 못하다.`);
    removeAgenda(state, agenda);
    return;
  }
  if (p.diplomacy) {
    // 조정 통과 → 상대국에 제안. 관계가 좋을수록 수락.
    const c = state.countries[p.diplomacy];
    const accept = Math.random() < 0.35 + c.relation / 150;
    if (!accept) {
      addAnnal(state, 'alt', `${c.name}이(가) "${p.name}" 제안을 거절하다.`);
      applyEffect(state, { relation: { [p.diplomacy]: -3 } });
      removeAgenda(state, agenda);
      return;
    }
    addAnnal(state, 'alt', `${c.name}이(가) "${p.name}"을(를) 받아들이다.`);
  } else {
    addAnnal(state, 'alt', `"${p.name}"을(를) 시행하다.`);
  }
  applyEffect(state, p.effect);
  removeAgenda(state, agenda);
}

function removeAgenda(state, agenda) {
  state.agendas = state.agendas.filter(a => a.id !== agenda.id);
}

// ── 사건 선택 처리 ───────────────────────────────────────

export function resolveChoice(state, event, choice, emit) {
  applyEffect(state, choice.effect, event.regionId);
  const agenda = state.agendas.find(a => a.id === choice.params?.agendaId);
  const r = event.regionId && state.regions[event.regionId];
  switch (choice.action) {
    case 'withdraw':
      removeAgenda(state, agenda);
      break;
    case 'force':
      state.nation.courtSupport = clamp(state.nation.courtSupport - CONFIG.forceSupportCost);
      agenda.status = 'forced';
      tryExecute(state, agenda);
      break;
    case 'tax_relief':
      r.taxRate = 0.02;
      break;
    case 'negotiate':
      if (Math.random() < choice.params.chance) {
        r.controller = state.player;
        r.morale = clamp(r.morale + 15);
        addAnnal(state, 'alt', `${r.name}의 봉기 세력과 협상이 타결되다.`);
        emit('toast', `🤝 ${r.name} 협상 성공`);
      } else {
        state.nation.courtSupport = clamp(state.nation.courtSupport - 3);
        addAnnal(state, 'alt', `${r.name}의 봉기 세력이 협상을 거부하다.`);
        emit('toast', `✖ ${r.name} 협상 실패 — 군사 진압을 고려하십시오`);
      }
      break;
    case 'suppress':
      emit('focusRegion', r.id);
      break;
  }
  if (event.kind) addAnnal(state, event.kind, `${event.title}: ${choice.label}`);
}

// ── 월간 처리 ────────────────────────────────────────────

export function monthlyCourt(state) {
  const n = state.nation;
  for (const a of state.agendas.filter(a => a.status === 'delayed')) {
    if (--a.monthsLeft <= 0) {
      a.status = 'forced';
      tryExecute(state, a);
    }
  }

  checkUnrest(state);

  if (Math.random() < 0.18) spawnRandomEvent(state);

  // 암살 판정: 5턴마다, 조정 지지가 매우 낮을 때만 (GDD 13.3)
  if (n.monthCount % CONFIG.assassinationEvery === 0 && n.courtSupport < CONFIG.assassinationThreshold
      && Math.random() < CONFIG.assassinationChance) {
    assassination(state);
  }
}

function spawnRandomEvent(state) {
  const total = EVENTS.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  const def = EVENTS.find(e => (roll -= e.weight) < 0);
  const region = def.targetsRegion ? pick(playerRegions(state)) : null;
  if (def.targetsRegion && !region) return;
  applyEffect(state, def.immediate, region?.id);
  state.pendingEvents.push({
    ...structuredClone(def),
    regionId: region?.id ?? null,
    text: def.text.replace('{region}', region?.name ?? ''),
  });
}

function checkUnrest(state) {
  for (const r of playerRegions(state)) {
    if (r.morale >= CONFIG.moraleThreat) { r.threatWarned = false; continue; }
    if (r.morale < CONFIG.moraleRevolt) { startRevolt(state, r); continue; }
    if (!r.threatWarned) {
      r.threatWarned = true;
      state.pendingEvents.push({
        title: `${r.name} 민심 흉흉`, kind: 'alt', regionId: r.id, sound: 'alert',
        text: `${r.name}의 민심이 크게 악화되었습니다 (${Math.round(r.morale)}). 이대로 두면 변란이 일어날 수 있습니다.`,
        choices: [
          { label: '이 지역의 세금을 감면하라 (세율 2%)', action: 'tax_relief' },
          { label: '지켜보겠다', effect: {} },
        ],
      });
    }
  }
  // 변란이 지속되면 전국 민심이 계속 하락
  const revolts = Object.values(state.regions).filter(r => r.controller === 'rebel' && r.owner === state.player);
  if (revolts.length) applyEffect(state, { moraleAll: -0.5 * revolts.length });
}

function startRevolt(state, r) {
  r.controller = 'rebel';
  for (const nb of neighbors(state, r.id)) {
    const x = state.regions[nb];
    if (x.controller === state.player) x.morale = clamp(x.morale + CONFIG.revoltAdjacentHit);
  }
  applyEffect(state, { moraleAll: CONFIG.revoltNationalHit });
  addAnnal(state, 'alt', `${r.name}에서 변란이 일어나 봉기 세력이 지역을 장악하다.`);
  state.pendingEvents.push({
    title: `${r.name} 변란`, regionId: r.id, image: 'events/revolt.png', sound: 'alarm',
    text: `${r.name}의 백성들이 봉기하여 관아를 장악했습니다. 이 지역의 자원은 더 이상 조정에 들어오지 않습니다.`,
    choices: [
      { label: '군사로 진압하라 (지도에서 출병)', action: 'suppress' },
      { label: '요구를 들어주어라 (국고 -1000, 성공 확률 높음)', action: 'negotiate', params: { chance: 0.7 }, effect: { treasury: -1000 } },
      { label: '설득해 보라 (비용 없음, 성공 확률 낮음)', action: 'negotiate', params: { chance: 0.3 } },
    ],
  });
}

function assassination(state) {
  const targets = state.family.filter(f => f.alive !== false && (f.isRuler || f.title.includes('원자')));
  const victim = pick(targets);
  if (!victim) return;
  victim.alive = false;
  addAnnal(state, 'alt', `${victim.title} ${victim.name}이(가) 자객에게 시해되다.`);
  let text = `${victim.title} ${victim.name}이(가) 암살당했습니다.`;
  if (victim.isRuler) {
    victim.isRuler = false;
    const heir = state.family
      .filter(f => f.alive !== false && (f.title.includes('원자') || f.title.includes('왕자')))
      .sort((a, b) => a.born - b.born)[0];
    if (!heir) { state.gameOver = '왕이 시해되고 뒤를 이을 왕족이 없습니다.'; return; }
    heir.isRuler = true;
    heir.title = '국왕';
    text += ` ${heir.name}이(가) 왕위를 잇습니다.`;
  }
  state.pendingEvents.push({ title: '암살', text, sound: 'alarm', choices: [{ label: '…', effect: {} }] });
}
