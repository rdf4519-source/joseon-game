// 건물 정의 (GDD 17절). 이름은 임시 명칭, 수치는 임시값.
// effect는 매월 정산 시 지역에 적용된다.
export const BUILDINGS = {
  market:   { name: '시전(임시)',   desc: '지역 수입 +20%',          cost: 800,  upkeep: 15, effect: { moneyMult: 0.2 } },
  granary:  { name: '둔전(임시)',   desc: '곡식 생산 +20%',          cost: 700,  upkeep: 12, effect: { grainMult: 0.2 } },
  clinic:   { name: '혜민서(임시)', desc: '인구 증가율 +50%',        cost: 600,  upkeep: 10, effect: { popGrowthMult: 0.5 } },
  shrine:   { name: '향교(임시)',   desc: '지역 민심 월 +0.5',       cost: 500,  upkeep: 8,  effect: { morale: 0.5 } },
  academy:  { name: '서원(임시)',   desc: '총명함 월 +0.1',          cost: 1200, upkeep: 25, effect: { brilliance: 0.1 } },
  barracks: { name: '군영(임시)',   desc: '출병 거점, 지역 방어 +400', cost: 1000, upkeep: 20, effect: { defense: 400 } },
};
