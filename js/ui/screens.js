// 조정 · 실록 · 가족 · 외교 화면 (UI GDD 1.1)
import { h, fmt } from './dom.js';
import { portraitImg } from '../assets.js';
import { POLICIES } from '../../data/policies.js';
import { CONFIG } from '../config.js';
import { proposePolicy, canAfford } from '../systems/court.js';
import { moraleSummary } from '../systems/economy.js';
import { formatDate } from '../state.js';
import { showNextEvent } from './modal.js';

// ── 조정 ───────────────────────────────────────────────
export function renderCourt(root, game) {
  const s = game.state;
  const n = s.nation;
  const m = moraleSummary(s);
  const pending = new Set(s.agendas.map(a => a.policyId));

  root.replaceChildren(
    h('section', { class: 'panel' },
      h('h2', {}, '조정 현황'),
      h('p', {}, `조정 지지 ${fmt(n.courtSupport)} · 전국 평균 민심 ${fmt(m.avg)} · 위험 지역 ${m.danger}곳`),
      h('p', { class: 'note' }, '조정 지지가 낮으면 강행한 안건이 상소로 지연되고, 아주 낮으면 암살 위험이 생깁니다.'),
      h('h3', {}, '국가 공통 세금'),
      h('div', { class: 'choices row' }, CONFIG.taxLevels.map((t, i) =>
        h('button', {
          class: n.taxLevel === i ? 'on' : '',
          onclick: () => { n.taxLevel = i; game.emit('change'); },
        }, `${t.name} (${Math.round(t.rate * 100)}%)`))),
    ),
    h('section', { class: 'panel' },
      h('h2', {}, '정사 — 안건 상정'),
      h('div', { class: 'policy-list' }, Object.entries(POLICIES).map(([id, p]) =>
        h('div', { class: 'policy' },
          h('b', {}, p.name),
          h('span', {}, p.desc),
          h('small', {}, `조정 반대 성향 ${Math.round(p.opposition * 100)}%${p.diplomacy ? ` · ${s.countries[p.diplomacy].name}의 수락 필요` : ''}`),
          h('button', {
            disabled: pending.has(id) || !canAfford(s, p.cost),
            onclick: () => { proposePolicy(s, id); game.emit('change'); showNextEvent(game); },
          }, pending.has(id) ? '논의 중' : '상정')))),
    ),
    h('section', { class: 'panel' },
      h('h2', {}, '보류된 안건'),
      s.agendas.length
        ? h('ul', {}, s.agendas.map(a => h('li', {}, `${POLICIES[a.policyId].name} — ${a.status === 'delayed' ? `${a.monthsLeft}개월 후 재상정` : '논의 중'}`)))
        : h('p', { class: 'note' }, '없음'),
    ),
  );
}

// ── 실록 ───────────────────────────────────────────────
const KIND_LABEL = { history: '역사 기록', variant: '변형 사건', alt: '대체 역사' };

export function renderAnnals(root, game) {
  root.replaceChildren(h('section', { class: 'panel annals' },
    h('h2', {}, '실록'),
    h('p', { class: 'note' }, '실제 역사 기록과 이번 플레이에서 생긴 대체 역사를 구분해 기록합니다.'),
    h('ul', {}, game.state.annals.slice(0, 200).map(a =>
      h('li', { class: `annal ${a.kind}` },
        h('span', { class: 'tag' }, KIND_LABEL[a.kind]),
        h('span', { class: 'when' }, formatDate(a.date)),
        a.text))),
  ));
}

// ── 가족 ───────────────────────────────────────────────
export function renderFamily(root, game) {
  const s = game.state;
  root.replaceChildren(h('section', { class: 'panel' },
    h('h2', {}, '왕실'),
    h('div', { class: 'family' }, s.family.map(f =>
      h('div', { class: `person${f.isRuler ? ' ruler' : ''}${f.alive === false ? ' dead' : ''}` },
        portraitImg(f.portrait, f.name),
        h('b', {}, f.name),
        h('span', {}, f.title),
        h('small', {}, f.alive === false ? '사망' : `${s.date.year - f.born}세`),
        h('table', { class: 'info' },
          h('tr', {}, h('th', {}, '애정'), h('td', {}, f.isRuler ? '—' : f.affection)),
          h('tr', {}, h('th', {}, '야망'), h('td', {}, f.ambition)),
          h('tr', {}, h('th', {}, '지식'), h('td', {}, f.knowledge)),
          h('tr', {}, h('th', {}, '지지'), h('td', {}, f.support))),
      ))),
  ));
}

// ── 외교 ───────────────────────────────────────────────
export function renderDiplomacy(root, game) {
  const s = game.state;
  const relLabel = v => (v >= 50 ? '우호' : v >= 0 ? '보통' : v >= -40 ? '경계' : '적대');
  root.replaceChildren(h('section', { class: 'panel' },
    h('h2', {}, '외교'),
    h('p', { class: 'note' }, '협정은 먼저 조정에서 논의한 뒤 상대국에 제안됩니다. (조정 화면의 외교 안건)'),
    h('div', { class: 'countries' }, Object.entries(s.countries).filter(([id]) => id !== s.player).map(([id, c]) =>
      h('div', { class: 'country', style: `border-color:${c.color}` },
        h('b', {}, c.name),
        h('span', {}, `관계 ${fmt(c.relation)} (${relLabel(c.relation)})`),
        h('small', {}, `보유 지역: ${Object.values(s.regions).filter(r => r.controller === id).map(r => r.name).join(', ') || '없음'}`),
        h('small', {}, c.relation <= 0 ? '관계가 0 이하이면 국경을 침공할 수 있습니다.' : ''),
      ))),
  ));
}
