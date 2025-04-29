/**
 * Combines HRV, sleep hours, morning RPE & previous ACWR into a 0-100 score.
 * Weightings draw from meta-analysis on HRV-guided training efficacy (2024).
 *
 * HRV (lnRMSSD) ↑, Sleep ↑, Morning soreness ↓, ACWR mid-band ⇒ higher score.
 */

import acwr from './acwr.js';

export default function readiness({
  hrv,               // lnRMSSD deviation from baseline (%)
  sleepHours,
  morningSoreness,   // 1-10 (10 = extreme soreness)
  dailyLoadsPast,
}) {
  const hrvScore   = Math.max(0, Math.min(50, hrv * 1.2));          // ±40 → 0-50
  const sleepScore = Math.max(0, Math.min(20, (sleepHours - 5) * 4));
  const soreScore  = Math.max(0, 20 - morningSoreness * 2);         // invert
  const acwrBand   = acwr(dailyLoadsPast).ratio;
  const acwrScore  = (acwrBand >= 0.8 && acwrBand <= 1.3) ? 10 : 0;

  return Math.round(hrvScore + sleepScore + soreScore + acwrScore);
}