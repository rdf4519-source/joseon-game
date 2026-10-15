// 지도 화면: 지역 선택, 지역 정보, 건설, 세율, 출병 (GDD 8·10·17·18절)
// 현재는 지역을 점으로 그리는 추상 지도. 나중에 assets/images/map.png 같은 실제 지도 위에
// 같은 좌표계로 올리거나, 지역 경계 SVG path로 교체하면 된다.
import { h, fmt, withDelta } from './dom.js';
import { openModal, closeModal } from './modal.js';
import { regionForecast, effectiveTaxRate } from '../systems/economy.js';
import { planDispatch, dispatch, availableMilitary, regionDefense, recall } from '../systems/war.js';
import { BUILDINGS } from '../../data/buildings.js';
import { CONFIG } from '../config.js';
import { sound } from '../assets.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

let selected = 'hanseong';

export function selectRegion(id) { selected = id; }

export function renderMap(root, game) {
  const s = game.state;
  let mapEl = root.querySelector('.map');
  let panel = root.querySelector('.region-panel');
  if (!mapEl) {
    mapEl = svg('svg', { class: 'map', viewBox: '0 80 1000 1000' });
    panel = h('aside', { class: 'region-panel' });
    root.replaceChildren(h('div', { class: 'map-wrap' }, mapEl), panel);
  }
  drawMap(mapEl, game);
  // 입력 중에는 패널을 다시 그리지 않는다 (포커스 유지)
  if (!panel.contains(document.activeElement)) renderPanel(panel, game);
}

// 매일 호출: 군대 위치만 갱신
export function tickMap(root, game) {
  const layer = root.querySelector('.armies');
  if (layer) drawArmies(layer, game.state);
}

function colorOf(s, r) {
  if (r.controller === 'rebel') return '#444';
  return s.countries[r.controller]?.color ?? '#888';
}

function drawMap(el, game) {
  const s = game.state;
  el.replaceChildren();
  for (const [a, b] of s.adjacency) {
    const ra = s.regions[a], rb = s.regions[b];
    el.append(svg('line', { x1: ra.x, y1: ra.y, x2: rb.x, y2: rb.y, class: 'edge' }));
  }
  for (const r of Object.values(s.regions)) {
    const g = svg('g', { class: `region${r.id === selected ? ' selected' : ''}`, transform: `translate(${r.x},${r.y})` });
    const radius = 22 + Math.sqrt(r.pop) / 40;
    g.append(svg('circle', { r: radius, fill: colorOf(s, r) }));
    if (r.controller === 'rebel') g.append(svg('circle', { r: radius, class: 'rebel-ring' }));
    if (r.capital) g.append(Object.assign(svg('text', { y: 6, class: 'icon' }), { textContent: '★' }));
    else if (r.buildings.includes('barracks')) g.append(Object.assign(svg('text', { y: 6, class: 'icon' }), { textContent: '⚑' }));
    const label = svg('text', { y: radius + 22, class: 'label' });
    label.textContent = r.name;
    g.append(label);
    if (r.controller === s.player && r.morale < CONFIG.moraleThreat) {
      g.append(Object.assign(svg('text', { x: radius - 4, y: -radius + 6, class: 'warn-icon' }), { textContent: '!' }));
    }
    g.addEventListener('click', () => { selected = r.id; sound.play('click'); game.emit('change'); });
    el.append(g);
  }
  const layer = svg('g', { class: 'armies' });
  el.append(layer);
  drawArmies(layer, s);
}

function drawArmies(layer, s) {
  layer.replaceChildren(...s.armies.map(a => {
    const g = svg('g', { class: `army ${a.status}`, transform: `translate(${a.x},${a.y})` });
    g.append(svg('rect', { x: -20, y: -11, width: 40, height: 22, rx: 4, fill: s.countries[a.owner]?.color ?? '#999' }));
    g.append(Object.assign(svg('text', { y: 5 }), { textContent: fmt(a.strength) }));
    return g;
  }));
}

function renderPanel(panel, game) {
  const s = game.state;
  const r = s.regions[selected];
  const owner = s.countries[r.owner];
  const mine = r.controller === s.player;
  const children = [
    h('h2', {}, r.name, ' ', h('small', {}, r.controller === 'rebel' ? '(변란 — 봉기 세력 장악)' : owner.name)),
  ];

  if (mine) {
    const f = regionForecast(s, r);
    children.push(h('table', { class: 'info' },
      row('돈', withDelta(r.money, f.moneyDelta)),
      row('곡식', withDelta(r.grain, f.grainDelta)),
      row('인구', fmt(r.pop)),
      row('민심', fmt(r.morale)),
      row('세율', `${Math.round(effectiveTaxRate(s, r) * 100)}%${r.taxRate == null ? ' (국가 공통)' : ' (지역 조정)'}`),
      row('월 세수', `돈 ${fmt(f.moneyTax)} · 곡식 ${fmt(f.grainTax)}`),
      row('방어력', fmt(regionDefense(s, r))),
      row('건물', r.buildings.map(b => BUILDINGS[b].name).join(', ') || '없음'),
    ));
    children.push(taxControl(game, r));
    children.push(h('button', { onclick: () => openDispatch(game, r) }, '방어 병력 파견'));
    if (!r.capital) children.push(h('button', { onclick: () => openBuild(game, r) }, '건설'));
    else children.push(h('p', { class: 'note' }, '수도에는 일반 건물을 지을 수 없습니다.'));
  } else {
    children.push(h('table', { class: 'info' },
      row('인구', fmt(r.pop)),
      row('방어력', fmt(regionDefense(s, r))),
      r.controller !== 'rebel' && row('관계', fmt(owner.relation)),
    ));
    children.push(h('button', { class: 'danger', onclick: () => openDispatch(game, r) },
      r.controller === 'rebel' ? '진압 출병' : '전쟁 (출병)'));
  }

  const garrisons = s.armies.filter(a => a.owner === s.player && a.status === 'garrison' && a.at === r.id);
  for (const a of garrisons) {
    children.push(h('div', { class: 'garrison' },
      `주둔군 ${fmt(a.strength)} · ${a.garrisonLeft}개월 후 자동 회수 `,
      h('button', { onclick: () => { recall(s, a); game.emit('change'); } }, '지금 회수')));
  }
  panel.replaceChildren(...children);
}

const row = (k, v) => h('tr', {}, h('th', {}, k), h('td', {}, v));

function taxControl(game, r) {
  const options = [['', '국가 공통'], ['0.02', '2%'], ['0.05', '5%'], ['0.1', '10%'], ['0.18', '18%'], ['0.25', '25%']];
  const sel = h('select', {
    onchange: e => { r.taxRate = e.target.value === '' ? null : Number(e.target.value); e.target.blur(); game.emit('change'); },
  }, options.map(([v, label]) => h('option', { value: v, selected: String(r.taxRate ?? '') === v }, label)));
  return h('label', { class: 'tax' }, '지역 세율 ', sel);
}

function openBuild(game, r) {
  const s = game.state;
  const list = Object.entries(BUILDINGS).filter(([id]) => !r.buildings.includes(id));
  openModal(
    h('h2', {}, `${r.name} — 건설`),
    h('p', { class: 'note' }, '한 번에 하나씩 건설합니다. 건설비는 국고에서, 유지비는 지역 자금에서 나갑니다.'),
    h('div', { class: 'build-list' }, list.map(([id, b]) =>
      h('button', {
        disabled: s.nation.treasury < b.cost,
        onclick: () => {
          s.nation.treasury -= b.cost;
          r.buildings.push(id);
          closeModal();
          game.emit('change');
        },
      }, h('b', {}, b.name), h('span', {}, b.desc), h('small', {}, `건설 ${fmt(b.cost)} · 유지 ${b.upkeep}/월`)))),
    h('button', { onclick: closeModal }, '닫기'),
  );
}

function openDispatch(game, target) {
  const s = game.state;
  const plan = planDispatch(s, s.player, target.id);
  if (!plan) {
    openModal(h('h2', {}, '출병 불가'), h('p', {}, '아군 영토를 통해 닿을 수 있는 경로가 없습니다.'), h('button', { onclick: closeModal }, '닫기'));
    return;
  }
  const avail = availableMilitary(s);
  const friendly = target.controller === s.player;
  const defense = friendly ? 0 : regionDefense(s, target);
  const amount = h('input', { type: 'number', min: 0, max: avail, value: friendly ? Math.floor(avail / 4) : Math.min(avail, Math.ceil(defense * 1.3)) });
  const pct = h('input', { type: 'range', min: 0, max: 100, value: Math.round(amount.value / Math.max(1, avail) * 100) });
  const verdict = h('p', {});
  const update = () => {
    const v = Number(amount.value);
    if (friendly) { verdict.textContent = `도착 후 ${CONFIG.garrisonMonths}개월간 주둔하며 방어에 참여합니다.`; return; }
    verdict.textContent = v > defense ? `예상: 승리 (잔여 ${fmt(v - defense)})` : `예상: 패배 (방어 측 잔여 ${fmt(defense - v)})`;
    verdict.className = v > defense ? 'delta pos' : 'delta neg';
  };
  pct.addEventListener('input', () => { amount.value = Math.floor(avail * pct.value / 100); update(); });
  amount.addEventListener('input', () => { pct.value = Math.round(amount.value / Math.max(1, avail) * 100); update(); });
  update();

  openModal(
    h('h2', {}, `${target.name} ${friendly ? '방어 파견' : '출병'}`),
    h('table', { class: 'info' },
      row('출발 군영', plan.base.name),
      row('경로', plan.path.map(id => s.regions[id].name).join(' → ')),
      row('소요 시간', `약 ${plan.days}일`),
      !friendly && row('상대 방어력', fmt(defense)),
      row('출격 가능', fmt(avail)),
    ),
    h('label', {}, '비율 ', pct),
    h('label', {}, '수량 ', amount),
    verdict,
    h('div', { class: 'choices' },
      h('button', {
        class: 'danger',
        onclick: () => {
          const v = Math.min(avail, Math.max(0, Math.floor(Number(amount.value))));
          if (v <= 0) return;
          dispatch(s, s.player, target.id, v, game.emit);
          closeModal();
          game.emit('change');
        },
      }, '출격'),
      h('button', { onclick: closeModal }, '취소')),
  );
}
