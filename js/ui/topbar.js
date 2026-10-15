// 상단 국가 지표 고정 영역 (UI GDD 1.2) — 모든 화면에서 항상 표시
import { h, fmt, withDelta } from './dom.js';
import { formatDate, playerRegions } from '../state.js';
import { nationForecast, gdp, moraleSummary } from '../systems/economy.js';
import { availableMilitary } from '../systems/war.js';
import { CONFIG } from '../config.js';

export function renderTopbar(root, game, onlyStats = false) {
  const s = game.state;
  const n = s.nation;
  const f = nationForecast(s);
  const m = moraleSummary(s);
  const pop = playerRegions(s).reduce((sum, r) => sum + r.pop, 0);
  const deficit = Math.max(n.deficitMonths.treasury, n.deficitMonths.grain);

  const stat = (label, value, title, warn) =>
    h('div', { class: `stat${warn ? ' warn' : ''}`, title }, h('label', {}, label), h('b', {}, value));

  const statsEl = h('div', { class: 'stats' },
    stat('국고', withDelta(n.treasury, f.treasuryDelta), `세입 ${fmt(f.moneyIn)} + 무역 ${fmt(f.trade)} − 군 유지비 ${fmt(f.milMoney)} (월)`, f.treasuryDelta < 0),
    stat('비축 곡식', withDelta(n.grainReserve, f.grainDelta), `곡물 세입 ${fmt(f.grainIn)} − 군량 ${fmt(f.milGrain)} (월)`, f.grainDelta < 0),
    stat('총인구', fmt(pop)),
    stat('GDP', fmt(gdp(s)), '연간 경제 규모 (임시 공식)'),
    stat('군사력', `${fmt(n.military)} / 가용 ${fmt(availableMilitary(s))}`, '현재 군사력 / 출격 가능 군사력'),
    stat('민심', `${fmt(m.avg)} · 위험 ${m.danger}`, '전국 평균 민심 · 위험 지역 수', m.danger > 0),
    stat('조정 지지', fmt(n.courtSupport), '낮으면 안건이 지연되고 암살·정란 위험', n.courtSupport < 25),
    stat('총명함', n.brilliance.toFixed(1)),
    deficit > 0 && stat('연속 적자', `${deficit} / ${CONFIG.maxDeficitMonths}개월`, '5개월 연속이면 국가 붕괴', true),
  );
  const old = root.querySelector('.stats');
  if (old) old.replaceWith(statsEl); else root.prepend(statsEl);

  // 시간 조작 버튼은 클릭이 씹히지 않도록 'change'에서만 다시 만든다
  let time = root.querySelector('.time');
  if (!onlyStats || !time) {
    const fresh = h('div', { class: 'time' },
      h('span', { class: 'date' }),
      h('button', { class: s.paused ? 'play' : 'pause', onclick: () => game.togglePause(), title: '스페이스바' }, s.paused ? '▶' : '❚❚'),
      [1, 2, 3].map(v => h('button', { class: s.speed === v ? 'on' : '', onclick: () => game.setSpeed(v) }, `${v}x`)),
      h('button', { onclick: () => game.emit('save'), title: '브라우저에 저장' }, '저장'),
      h('button', { onclick: () => game.emit('load') }, '불러오기'),
      h('button', { onclick: () => game.emit('mute'), title: '소리 켜기/끄기' }, '♪'),
    );
    if (time) time.replaceWith(fresh); else root.append(fresh);
    time = fresh;
  }
  time.querySelector('.date').textContent = formatDate(s.date);
}
