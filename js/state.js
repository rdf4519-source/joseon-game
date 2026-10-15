// 게임 상태 생성·저장·불러오기. 상태는 순수 데이터(JSON 직렬화 가능)로만 유지한다.
import { SCENARIO } from '../data/scenario_1401.js';

const SAVE_KEY = 'joseon-game-save-v1';

export function createState(scenario = SCENARIO) {
  const s = structuredClone(scenario);
  return {
    scenarioId: s.id,
    date: { ...s.startDate },
    paused: true,
    speed: 1,
    gameOver: null,
    player: s.playerCountry,
    countries: s.countries,
    regions: Object.fromEntries(s.regions.map(r => [r.id, {
      taxRate: null, controller: r.owner, threatWarned: false,
      lastMoneyDelta: 0, lastGrainDelta: 0, capital: false,
      ...r,
      buildings: r.barracks ? ['barracks'] : [],
    }])),
    adjacency: s.adjacency,
    nation: {
      ...s.nation,
      deployed: 0,
      lastTreasuryDelta: 0,
      lastGrainDelta: 0,
      deficitMonths: { treasury: 0, grain: 0 },
      monthCount: 0,
    },
    family: s.family,
    armies: [],       // 이동·주둔 중인 군대
    agendas: [],      // 조정 안건 (보류 포함)
    pendingEvents: [],// 플레이어 판단이 필요한 사건 큐
    annals: s.annals.map(a => ({ ...a, date: { ...s.startDate } })),
    nextId: 1,
  };
}

export const save = state => localStorage.setItem(SAVE_KEY, JSON.stringify(state));

export function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export const uid = state => state.nextId++;

export function neighbors(state, id) {
  return state.adjacency.filter(p => p.includes(id)).map(p => (p[0] === id ? p[1] : p[0]));
}

export const playerRegions = state =>
  Object.values(state.regions).filter(r => r.controller === state.player);

export function formatDate(d) {
  return `${d.year}년 ${d.month}월 ${d.day}일`;
}

export function addAnnal(state, kind, text) {
  state.annals.unshift({ kind, text, date: { ...state.date } });
}
