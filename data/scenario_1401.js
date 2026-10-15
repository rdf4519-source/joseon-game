// 시작 시나리오 데이터. 수치는 모두 임시값이며 역사 고증 전이다.
// 지도 좌표(x, y)는 0~1000 x 0~1200 SVG 공간 기준의 대략적 위치.
// portrait/sound 필드는 파일이 없어도 동작한다 (assets/README.md 참고).

export const SCENARIO = {
  id: '1401_taejong',
  title: '태종 원년',
  startDate: { year: 1401, month: 1, day: 1 },
  playerCountry: 'joseon',

  countries: {
    joseon: { name: '조선', color: '#c0392b', relation: 100 },
    ming:   { name: '명',   color: '#d4a017', relation: 40 },
    jurchen:{ name: '여진', color: '#5d8a3a', relation: -10 },
    japan:  { name: '일본', color: '#5b6ea8', relation: 0 },
  },

  // 지역 = 행정·경제 단위 (GDD: 국가 > 지역 > 구). 구 단위는 이후 확장.
  regions: [
    { id: 'hanseong',  name: '한성',   owner: 'joseon', x: 490, y: 545, pop: 100000, money: 3000, grain: 4000, grainProd: 900,  morale: 70, baseDefense: 1500, capital: true },
    { id: 'gyeonggi',  name: '경기',   owner: 'joseon', x: 400, y: 625, pop: 300000, money: 1500, grain: 5000, grainProd: 3600, morale: 60, baseDefense: 600 },
    { id: 'chungcheong', name: '충청', owner: 'joseon', x: 450, y: 720, pop: 350000, money: 1200, grain: 5500, grainProd: 4100, morale: 60, baseDefense: 500 },
    { id: 'jeolla',    name: '전라',   owner: 'joseon', x: 420, y: 880, pop: 450000, money: 1300, grain: 7000, grainProd: 5600, morale: 55, baseDefense: 500 },
    { id: 'gyeongsang',name: '경상',   owner: 'joseon', x: 600, y: 820, pop: 500000, money: 1600, grain: 6500, grainProd: 5400, morale: 55, baseDefense: 600 },
    { id: 'gangwon',   name: '강원',   owner: 'joseon', x: 600, y: 560, pop: 150000, money: 600,  grain: 2000, grainProd: 1500, morale: 60, baseDefense: 400 },
    { id: 'hwanghae',  name: '황해',   owner: 'joseon', x: 340, y: 520, pop: 220000, money: 800,  grain: 3000, grainProd: 2500, morale: 60, baseDefense: 400 },
    { id: 'pyeongan',  name: '평안',   owner: 'joseon', x: 310, y: 380, pop: 250000, money: 700,  grain: 2800, grainProd: 2400, morale: 55, baseDefense: 700, barracks: true },
    { id: 'hamgyeong', name: '함경',   owner: 'joseon', x: 580, y: 300, pop: 200000, money: 600,  grain: 2200, grainProd: 1900, morale: 50, baseDefense: 700, barracks: true },
    { id: 'yodong',    name: '요동',   owner: 'ming',    x: 170, y: 250, pop: 300000, money: 2000, grain: 4000, grainProd: 3000, morale: 60, baseDefense: 5000 },
    { id: 'geonju',    name: '건주',   owner: 'jurchen', x: 400, y: 160, pop: 80000,  money: 400,  grain: 1200, grainProd: 800,  morale: 60, baseDefense: 900 },
    { id: 'tsushima',  name: '대마도', owner: 'japan',   x: 760, y: 960, pop: 30000,  money: 500,  grain: 500,  grainProd: 300,  morale: 60, baseDefense: 800 },
  ],

  // 육상 인접 관계 (도로·출병 경로 계산에 사용)
  adjacency: [
    ['hanseong', 'gyeonggi'], ['gyeonggi', 'hwanghae'], ['gyeonggi', 'chungcheong'], ['gyeonggi', 'gangwon'],
    ['chungcheong', 'jeolla'], ['chungcheong', 'gyeongsang'], ['chungcheong', 'gangwon'], ['jeolla', 'gyeongsang'],
    ['gangwon', 'gyeongsang'], ['gangwon', 'hamgyeong'], ['hwanghae', 'pyeongan'], ['pyeongan', 'hamgyeong'],
    ['pyeongan', 'yodong'], ['pyeongan', 'geonju'], ['hamgyeong', 'geonju'], ['gyeongsang', 'tsushima'],
  ],

  nation: {
    treasury: 5000,
    grainReserve: 8000,
    military: 4000,
    courtSupport: 55,
    brilliance: 50,   // 총명함 (GDD 15절)
    taxLevel: 1,
  },

  // 왕실 인물 (GDD 14절). portrait: assets/portraits/<파일>
  family: [
    { id: 'taejong', name: '이방원', title: '국왕(태종)', born: 1367, isRuler: true, affection: 100, ambition: 90, knowledge: 75, support: 60, portrait: 'taejong.png' },
    { id: 'wongyeong', name: '민씨', title: '왕비(원경왕후)', born: 1365, affection: 55, ambition: 70, knowledge: 60, support: 50, portrait: 'wongyeong.png' },
    { id: 'jeongjong', name: '이방과', title: '상왕(정종)', born: 1357, affection: 60, ambition: 20, knowledge: 55, support: 30, portrait: 'jeongjong.png' },
    { id: 'taejo', name: '이성계', title: '태상왕(태조)', born: 1335, affection: 15, ambition: 50, knowledge: 65, support: 40, portrait: 'taejo.png' },
    { id: 'yangnyeong', name: '이제', title: '원자(양녕)', born: 1394, affection: 70, ambition: 40, knowledge: 40, support: 30, portrait: 'yangnyeong.png' },
    { id: 'hyoryeong', name: '이보', title: '왕자(효령)', born: 1396, affection: 70, ambition: 20, knowledge: 55, support: 20, portrait: 'hyoryeong.png' },
    { id: 'chungnyeong', name: '이도', title: '왕자(충녕)', born: 1397, affection: 75, ambition: 35, knowledge: 80, support: 20, portrait: 'chungnyeong.png' },
  ],

  // 실록 시작 기록. kind: history(역사적 기록) / variant(변형) / alt(대체 역사)
  annals: [
    { kind: 'history', text: '태종이 즉위하여 국정을 맡다. (시나리오 시작 — 실제 기록·출처 연결 예정)' },
  ],
};
