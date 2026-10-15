// 진입점: 상태 생성 → 게임 루프 → 화면 연결
import { createState, save, load } from './state.js';
import { Game } from './game.js';
import { sound } from './assets.js';
import { h } from './ui/dom.js';
import { renderTopbar } from './ui/topbar.js';
import { renderMap, tickMap, selectRegion } from './ui/map.js';
import { renderCourt, renderAnnals, renderFamily, renderDiplomacy } from './ui/screens.js';
import { showNextEvent, isModalOpen } from './ui/modal.js';

const SCREENS = {
  map: { label: '지도', render: renderMap },
  court: { label: '조정', render: renderCourt },
  annals: { label: '실록', render: renderAnnals },
  family: { label: '가족', render: renderFamily },
  diplomacy: { label: '외교', render: renderDiplomacy },
};

const game = new Game(createState());
window.game = game; // 디버깅용: 개발자 도구에서 game.state 확인

let current = 'map';
const topbar = document.getElementById('topbar');
const nav = document.getElementById('nav');
const main = document.getElementById('main');

function renderNav() {
  nav.replaceChildren(...Object.entries(SCREENS).map(([id, sc]) =>
    h('button', { class: id === current ? 'on' : '', onclick: () => switchTo(id) }, sc.label)));
}

function switchTo(id) {
  current = id;
  main.replaceChildren();
  sound.play('click');
  renderAll();
}

function renderAll() {
  renderTopbar(topbar, game);
  renderNav();
  SCREENS[current].render(main, game);
}

function toast(text) {
  const box = document.getElementById('toasts');
  const el = h('div', { class: 'toast' }, text);
  box.prepend(el);
  setTimeout(() => el.remove(), 5000);
}

game.on('change', renderAll);
game.on('tick', () => {
  renderTopbar(topbar, game, true);
  if (current === 'map') tickMap(main, game);
});
game.on('event', () => showNextEvent(game));
game.on('toast', toast);
game.on('sound', name => sound.play(name));
game.on('focusRegion', id => { selectRegion(id); switchTo('map'); });
game.on('save', () => { save(game.state); toast('저장했습니다.'); });
game.on('load', () => {
  const s = load();
  if (!s) return toast('저장된 게임이 없습니다.');
  s.paused = true;
  main.replaceChildren();
  game.setState(s);
  toast('불러왔습니다.');
});
game.on('mute', () => { sound.muted = !sound.muted; toast(sound.muted ? '소리 끔' : '소리 켬'); });

document.addEventListener('keydown', e => {
  if (e.code !== 'Space' || e.target.matches('input, select, textarea') || isModalOpen()) return;
  e.preventDefault();
  game.togglePause();
});

renderAll();
toast('스페이스바로 시간을 흐르게 하거나 멈출 수 있습니다.');
