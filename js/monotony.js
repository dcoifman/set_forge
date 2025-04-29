/**
 * Training Monotony = mean(daily load) ÷ SD(daily load) over 7 days.
 * Training Strain   = Monotony × total 7-day load.
 *
 * Foster (1998) thresholds: Monotony > 2 or Strain > 4500 ⇒ ↑ illness risk.  [oai_citation:2‡PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8200417/?utm_source=chatgpt.com) [oai_citation:3‡Fellrnr.com, Running tips](https://fellrnr.com/wiki/Training_Monotony?utm_source=chatgpt.com)
 *
 * @param {number[]} sessionLoads – last 7 daily loads (sRPE × duration).
 * @returns {{monotony:number, strain:number, flag:'ok'|'watch'|'high'}}
 */
export default function monotony(sessionLoads) {
    if (sessionLoads.length !== 7) throw new Error('Pass exactly 7 days');
  
    const mean = sessionLoads.reduce((a, b) => a + b, 0) / 7;
    const sd   = Math.sqrt(sessionLoads
                  .map(x => (x - mean) ** 2)
                  .reduce((a, b) => a + b) / 7);
  
    const mono  = +(mean / sd).toFixed(2);
    const strain = +(mono * sessionLoads.reduce((a, b) => a + b, 0)).toFixed(0);
  
    const flag = (mono > 2 || strain > 4500) ? 'high'
               : (mono > 1.7 || strain > 3500) ? 'watch'
               : 'ok';
  
    return { monotony: mono, strain, flag };
  }