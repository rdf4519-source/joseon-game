// 공용 모달 + 사건 창. 사건 창은 기존 조정 UI 형식(이미지·설명·선택지)을 재사용한다 (GDD 20.4).
import { h } from './dom.js';
import { eventImg, sound } from '../assets.js';
import { resolveChoice } from '../systems/court.js';

const root = () => document.getElementById('modal');

export function openModal(...content) {
  root().replaceChildren(h('div', { class: 'modal-box' }, ...content));
  root().hidden = false;
}

export function closeModal() {
  root().hidden = true;
  root().replaceChildren();
}

export const isModalOpen = () => !root().hidden;

export function showNextEvent(game) {
  const s = game.state;
  if (s.gameOver) {
    openModal(
      h('h2', {}, '게임 오버'),
      h('p', {}, s.gameOver),
      h('button', { onclick: () => location.reload() }, '처음부터'),
    );
    return;
  }
  const ev = s.pendingEvents[0];
  if (!ev || isModalOpen()) return;
  if (ev.sound) sound.play(ev.sound);
  openModal(
    eventImg(ev.image),
    h('h2', {}, ev.title),
    h('p', {}, ev.text),
    h('div', { class: 'choices' }, ev.choices.map(c =>
      h('button', {
        onclick: () => {
          s.pendingEvents.shift();
          closeModal();
          resolveChoice(s, ev, c, game.emit);
          game.emit('change');
          showNextEvent(game);
        },
      }, c.label))),
  );
}
