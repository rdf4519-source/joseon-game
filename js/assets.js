// 이미지·소리 로더. 파일이 아직 없으면 자동으로 대체 표현을 쓴다.
// 나중에 assets/ 폴더에 파일만 넣으면 코드 수정 없이 반영된다.

const PORTRAIT_DIR = 'assets/portraits/';
const IMAGE_DIR = 'assets/images/';
const SOUND_DIR = 'assets/sounds/';

// 초상화 파일이 없을 때 쓰는 이름(끝 두 글자) SVG
function placeholderPortrait(name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
    <rect width="80" height="100" fill="#3b2f2a"/>
    <circle cx="40" cy="38" r="20" fill="#6b5a4e"/>
    <rect x="14" y="62" width="52" height="38" rx="18" fill="#6b5a4e"/>
    <text x="40" y="45" font-size="16" text-anchor="middle" fill="#f3e9d2" font-family="serif">${name.slice(-2) || '?'}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function portraitImg(file, name, className = 'portrait') {
  const img = document.createElement('img');
  img.className = className;
  img.alt = name;
  img.src = file ? PORTRAIT_DIR + file : placeholderPortrait(name);
  img.onerror = () => { img.onerror = null; img.src = placeholderPortrait(name); };
  return img;
}

// 사건 삽화: 없으면 요소 자체를 숨긴다
export function eventImg(file) {
  const img = document.createElement('img');
  img.className = 'event-image';
  if (!file) { img.hidden = true; return img; }
  img.src = IMAGE_DIR + file;
  img.onerror = () => { img.hidden = true; };
  return img;
}

// ── 소리 ──────────────────────────────────────────────
// assets/sounds/<이름>.mp3 를 재생. 없으면 짧은 합성음으로 대체.
const FALLBACK_TONES = {
  alert: [660, 0.12], alarm: [330, 0.35], battle: [140, 0.25], march: [220, 0.08], click: [880, 0.03],
};

class Sound {
  constructor() {
    this.muted = false;
    this.cache = {};   // name → HTMLAudioElement | 'missing'
    this.ctx = null;
  }

  play(name) {
    if (this.muted) return;
    const cached = this.cache[name];
    if (cached === 'missing') return this.tone(name);
    const audio = cached ?? new Audio(`${SOUND_DIR}${name}.mp3`);
    if (!cached) {
      this.cache[name] = audio;
      audio.addEventListener('error', () => { this.cache[name] = 'missing'; this.tone(name); }, { once: true });
    }
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  tone(name) {
    const t = FALLBACK_TONES[name];
    if (!t) return;
    this.ctx ??= new AudioContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = t[0];
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + t[1]);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + t[1]);
  }
}

export const sound = new Sound();
