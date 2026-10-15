// 월간 정산: 지역 경제, 세금, 군사 유지비, 재정 적자 판정 (GDD 8·9·12절)
import { CONFIG } from '../config.js';
import { BUILDINGS } from '../../data/buildings.js';
import { playerRegions, addAnnal } from '../state.js';

function buildingEffect(r, key) {
  return r.buildings.reduce((sum, b) => sum + (BUILDINGS[b].effect[key] ?? 0), 0);
}

export function effectiveTaxRate(state, r) {
  return r.taxRate ?? CONFIG.taxLevels[state.nation.taxLevel].rate;
}

// 민심에 따른 징수 효율: 민심 50 → 100%, 0 → 50%, 100 → 110%
const collectionEfficiency = morale => Math.min(1.1, 0.5 + morale / 100);

// 한 지역의 월간 예상치. UI 미리보기와 실제 정산이 같은 공식을 쓴다.
export function regionForecast(state, r) {
  const n = state.nation;
  const moraleFactor = 0.8 + r.morale / 250; // 민심이 생산에 주는 영향
  const brillianceFactor = 1 + (n.brilliance - 50) / 500;

  const income = r.pop * CONFIG.moneyPerPop * (1 + buildingEffect(r, 'moneyMult')) * moraleFactor * brillianceFactor;
  const upkeep = r.pop * CONFIG.moneyUpkeepPerPop
    + r.buildings.reduce((s, b) => s + BUILDINGS[b].upkeep, 0);
  const grainProd = r.grainProd * (1 + buildingEffect(r, 'grainMult')) * moraleFactor;
  const grainUse = r.pop * CONFIG.grainConsumptionPerPop;

  const rate = effectiveTaxRate(state, r);
  const eff = collectionEfficiency(r.morale);
  // 부과액과 실제 세수 구분 (GDD 12.1)
  const moneyTax = income * rate * eff;
  const grainTax = grainProd * rate * eff;

  return {
    income, upkeep, grainProd, grainUse, moneyTax, grainTax, rate,
    moneyDelta: income - upkeep - moneyTax,
    grainDelta: grainProd - grainUse - grainTax,
  };
}

export function nationForecast(state) {
  const n = state.nation;
  let moneyIn = 0, grainIn = 0;
  for (const r of playerRegions(state)) {
    const f = regionForecast(state, r);
    moneyIn += f.moneyTax;
    grainIn += f.grainTax;
  }
  const milMoney = n.military * CONFIG.militaryUpkeepMoney;
  const milGrain = n.military * CONFIG.militaryUpkeepGrain;
  const trade = n.tradeIncome ?? 0;
  return {
    moneyIn, grainIn, milMoney, milGrain, trade,
    treasuryDelta: moneyIn + trade - milMoney,
    grainDelta: grainIn - milGrain,
  };
}

export function gdp(state) {
  return playerRegions(state).reduce((s, r) => s + regionForecast(state, r).income, 0) * 12;
}

export function moraleSummary(state) {
  const rs = playerRegions(state);
  const avg = rs.reduce((s, r) => s + r.morale, 0) / Math.max(1, rs.length);
  const danger = rs.filter(r => r.morale < CONFIG.moraleThreat).length;
  return { avg, danger };
}

export function settleMonth(state, emit) {
  const n = state.nation;
  const nf = nationForecast(state);
  const taxMorale = CONFIG.taxLevels[n.taxLevel].morale;

  for (const r of playerRegions(state)) {
    const f = regionForecast(state, r);
    r.money = Math.max(0, r.money + f.moneyDelta);
    r.grain = Math.max(0, r.grain + f.grainDelta);
    r.lastMoneyDelta = f.moneyDelta;
    r.lastGrainDelta = f.grainDelta;

    const growth = r.grain > 0 ? CONFIG.popGrowthRate * (1 + buildingEffect(r, 'popGrowthMult')) : -0.004;
    r.pop = Math.round(r.pop * (1 + growth));

    // 민심: 세금 단계 + 개별 세율 + 굶주림 + 건물. 50을 향해 천천히 회귀.
    const localTax = r.taxRate == null ? 0 : (CONFIG.taxLevels[n.taxLevel].rate - r.taxRate) * 20;
    r.morale += taxMorale + localTax + buildingEffect(r, 'morale') + (r.grain <= 0 ? -3 : 0) + (50 - r.morale) * 0.01;
    r.morale = Math.max(0, Math.min(100, r.morale));
    n.brilliance += buildingEffect(r, 'brilliance');
  }

  n.treasury += nf.treasuryDelta;
  n.grainReserve += nf.grainDelta;
  n.lastTreasuryDelta = nf.treasuryDelta;
  n.lastGrainDelta = nf.grainDelta;

  // 연속 적자 판정 (GDD 9절): 보유량이 아니라 순변화량 기준
  n.deficitMonths.treasury = nf.treasuryDelta < 0 ? n.deficitMonths.treasury + 1 : 0;
  n.deficitMonths.grain = nf.grainDelta < 0 ? n.deficitMonths.grain + 1 : 0;
  for (const [key, label] of [['treasury', '국고'], ['grain', '비축 곡식']]) {
    const m = n.deficitMonths[key];
    if (m >= CONFIG.maxDeficitMonths) {
      state.gameOver = `${label} 적자가 ${m}개월 연속 이어져 국가 재정이 붕괴했습니다.`;
    } else if (m >= CONFIG.maxDeficitMonths - 2) {
      emit('toast', `⚠ ${label} 적자 ${m}개월째 (${CONFIG.maxDeficitMonths}개월 연속 시 붕괴)`);
    }
  }
  if (n.treasury < 0 && !state.gameOver) addAnnal(state, 'alt', '국고가 바닥나 관리들의 녹봉이 밀리다.');
}
