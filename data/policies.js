// 정사 안건 (GDD 1·13·20절). opposition: 조정이 반대할 기본 확률(0~1).
// effect 키: treasury, grainReserve, military, courtSupport, brilliance, moraleAll,
//            pop(수도 인구), relation:{국가:값}, tradeIncome(월 국고 수입 증가)
// diplomacy: 조정 통과 후 상대국에 제안 → 관계에 따라 수락/거절
export const POLICIES = {
  relief: {
    name: '구휼 시행', desc: '비축 곡식을 풀어 백성을 구제한다.',
    opposition: 0.1, cost: { grainReserve: 1500 },
    effect: { grainReserve: -1500, moraleAll: 8 },
  },
  conscript: {
    name: '군비 확충', desc: '장정을 징발하고 군기를 갖춘다. (인구 → 군사력)',
    opposition: 0.35, cost: { treasury: 900 },
    effect: { treasury: -900, pop: -600, military: 450, moraleAll: -2 },
  },
  examination: {
    name: '과거 시행', desc: '인재를 등용해 국정 운영의 효율을 높인다.',
    opposition: 0.2, cost: { treasury: 600 },
    effect: { treasury: -600, brilliance: 3, courtSupport: 3 },
  },
  ming_trade: {
    name: '명과 무역 협정', desc: '사행 무역을 확대한다. 월 국고 수입 증가.',
    opposition: 0.4, cost: { treasury: 500 },
    diplomacy: 'ming',
    effect: { treasury: -500, tradeIncome: 150, relation: { ming: 15 } },
  },
  jurchen_peace: {
    name: '여진과 화친', desc: '곡식을 주고 변경을 안정시킨다.',
    opposition: 0.55, cost: { grainReserve: 1000 },
    diplomacy: 'jurchen',
    effect: { grainReserve: -1000, relation: { jurchen: 40 } },
  },
  japan_port: {
    name: '왜에 포구 개방', desc: '통제된 교역을 허락해 왜구를 달랜다.',
    opposition: 0.5, cost: {},
    diplomacy: 'japan',
    effect: { tradeIncome: 80, relation: { japan: 25 }, courtSupport: -3 },
  },
};
