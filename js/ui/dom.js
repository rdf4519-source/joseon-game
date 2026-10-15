// 작은 DOM 헬퍼: h('div', { class: 'x', onclick }, '텍스트', child)
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

export const fmt = n => Math.round(n).toLocaleString('ko-KR');

// "1,000 +100" 형식 (GDD 6·8절: 현재 값 + 턴당 변화량)
export function withDelta(value, delta) {
  const d = Math.round(delta);
  return h('span', {},
    fmt(value), ' ',
    h('span', { class: d >= 0 ? 'delta pos' : 'delta neg' }, `${d >= 0 ? '+' : ''}${fmt(d)}`));
}
