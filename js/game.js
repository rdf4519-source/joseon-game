// 게임 루프: 실시간 + 일시정지 + 1·2·3배속 (GDD 11.1)
// 하루마다 군대 이동, 매월 1일에 정산("턴"). 플레이어 판단이 필요한 사건이 생기면 자동 일시정지 (GDD 11.2).
import { CONFIG } from './config.js';
import { settleMonth } from './systems/economy.js';
import { tickArmies, monthlyGarrison, enemyAI } from './systems/war.js';
import { monthlyCourt } from './systems/court.js';

export class Game {
  constructor(state) {
    this.state = state;
    this.listeners = {};
    this.acc = 0;
    this.last = performance.now();
    this.emit = this.emit.bind(this);
    requestAnimationFrame(this.frame.bind(this));
  }

  on(type, fn) { (this.listeners[type] ??= []).push(fn); }
  emit(type, payload) { for (const fn of this.listeners[type] ?? []) fn(payload); }

  setState(state) { this.state = state; this.emit('change'); }

  togglePause(force) {
    const s = this.state;
    if (s.gameOver) return;
    s.paused = force ?? !s.paused;
    if (!s.paused && s.pendingEvents.length) s.paused = true; // 사건 처리 전에는 재개 불가
    this.emit('change');
  }

  setSpeed(v) { this.state.speed = v; this.emit('change'); }

  frame(now) {
    const dt = now - this.last;
    this.last = now;
    const s = this.state;
    if (!s.paused && !s.gameOver) {
      this.acc += dt;
      const msPerDay = CONFIG.msPerDayBySpeed[s.speed];
      let advanced = false;
      this.monthPassed = false;
      while (this.acc >= msPerDay && !s.paused) {
        this.acc -= msPerDay;
        this.advanceDay();
        advanced = true;
      }
      // 'tick' = 매일 가벼운 갱신(날짜·지표·군대 위치), 'change' = 화면 전체 다시 그리기
      if (this.monthPassed || s.paused) this.emit('change');
      else if (advanced) this.emit('tick');
    } else {
      this.acc = 0;
    }
    requestAnimationFrame(this.frame.bind(this));
  }

  advanceDay() {
    const s = this.state;
    tickArmies(s, this.emit);
    s.date.day++;
    if (s.date.day > CONFIG.daysPerMonth) {
      s.date.day = 1;
      s.date.month++;
      if (s.date.month > 12) { s.date.month = 1; s.date.year++; }
      this.advanceMonth();
    }
    if (s.pendingEvents.length || s.gameOver) {
      s.paused = true;
      this.emit('event');
    }
  }

  advanceMonth() {
    const s = this.state;
    this.monthPassed = true;
    s.nation.monthCount++;
    settleMonth(s, this.emit);
    monthlyGarrison(s);
    monthlyCourt(s);
    enemyAI(s, this.emit);
  }
}
