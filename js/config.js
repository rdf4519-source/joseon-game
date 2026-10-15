// 밸런스 수치 모음. GDD에서 "추후 결정"으로 남은 값은 전부 여기 임시값으로 둔다.
// 숫자를 바꿀 때는 이 파일만 고치면 된다.
export const CONFIG = {
  // 시간: 1일 단위로 흐르고, 매월 1일에 정산한다. GDD의 "턴" = 1개월.
  msPerDayBySpeed: { 1: 400, 2: 200, 3: 80 },
  daysPerMonth: 30,

  // 세금 3단계 (GDD 8절) — 단계별 기본 세율과 민심 변화(월)
  taxLevels: [
    { name: '경감', rate: 0.05, morale: +0.6 },
    { name: '보통', rate: 0.10, morale: 0 },
    { name: '중과', rate: 0.18, morale: -1.2 },
  ],

  // 지역 경제 (월)
  moneyPerPop: 0.003,         // 인구 1명당 기본 수입
  moneyUpkeepPerPop: 0.0018,  // 인구 1명당 소비
  grainConsumptionPerPop: 0.009,
  popGrowthRate: 0.002,       // 곡식이 남을 때 월 인구 증가율

  // 군사 (GDD 9·10·18절)
  militaryUpkeepMoney: 0.1,   // 군사력 1당 월 국고 유지비
  militaryUpkeepGrain: 0.6,   // 군사력 1당 월 비축 곡식 소모
  recruitPopCost: 200,        // 군사 증강 1회 인구 투입
  recruitGain: 150,           // 군사 증강 1회 군사력 증가
  recruitMoneyCost: 300,
  armySpeed: 1.6,             // 지도 좌표 / 일
  garrisonMonths: 3,

  // 재정 붕괴 (GDD 9절) — 연속 적자 허용 턴
  maxDeficitMonths: 5,

  // 민심·변란 (GDD 12절)
  moraleThreat: 30,
  moraleRevolt: 15,
  revoltAdjacentHit: -8,
  revoltNationalHit: -3,

  // 조정 (GDD 13·20절)
  delayBaseChance: 0.6,       // 지지 0일 때 안건 지연 확률
  delayMonths: 2,
  forceSupportCost: 8,
  assassinationEvery: 5,      // 5턴마다 판정
  assassinationThreshold: 15,
  assassinationChance: 0.05,
};
