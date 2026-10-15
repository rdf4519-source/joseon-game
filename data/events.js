// 무작위 사건 (GDD 1절 "사건"). weight는 매월 발생 시 선택 가중치.
// 선택지 effect는 policies.js와 같은 키를 쓴다. regionMorale/regionGrain은 대상 지역에 적용.
// image/sound는 선택 사항 — 파일이 있으면 사건 창에 표시·재생된다.
export const EVENTS = [
  {
    id: 'famine', weight: 3, kind: 'alt', targetsRegion: true,
    title: '흉년', image: 'events/famine.png', sound: 'alert',
    text: '{region}에 가뭄이 들어 수확이 크게 줄었다는 장계가 올라왔습니다.',
    immediate: { regionGrain: -0.4 },
    choices: [
      { label: '구휼미를 내려라 (비축 곡식 -800, 지역 민심 +12)', effect: { grainReserve: -800, regionMorale: 12 } },
      { label: '지방에서 알아서 하게 하라 (지역 민심 -10)', effect: { regionMorale: -10 } },
    ],
  },
  {
    id: 'ming_envoy', weight: 2, kind: 'variant',
    title: '명 사신 도착', image: 'events/envoy.png', sound: 'alert',
    text: '명나라 사신이 한성에 도착하여 예물을 요구하고 있습니다.',
    choices: [
      { label: '후하게 대접하라 (국고 -500, 명 관계 +15)', effect: { treasury: -500, relation: { ming: 15 } } },
      { label: '예법대로만 하라 (명 관계 -10)', effect: { relation: { ming: -10 } } },
    ],
  },
  {
    id: 'memorial', weight: 2, kind: 'alt',
    title: '대간의 상소', sound: 'alert',
    text: '사간원이 왕실의 사치를 비판하는 상소를 올렸습니다.',
    choices: [
      { label: '받아들여 근검하겠다 (국고 +200, 조정 지지 +4)', effect: { treasury: 200, courtSupport: 4 } },
      { label: '상소를 물리쳐라 (조정 지지 -5)', effect: { courtSupport: -5 } },
    ],
  },
  {
    id: 'good_harvest', weight: 2, kind: 'alt', targetsRegion: true,
    title: '풍년', sound: 'alert',
    text: '{region}에 풍년이 들어 곡식이 넘쳐납니다.',
    immediate: { regionGrain: 0.5, regionMorale: 5 },
    choices: [{ label: '하늘의 은혜로다', effect: {} }],
  },
];
