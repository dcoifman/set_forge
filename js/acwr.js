/**
 * Acute-to-Chronic Workload Ratio (ACWR)
 * -----------------------------------------------------------------------------
 * Calculates rolling acute (7 d) and chronic (28 d EWMA) workloads and returns
 * the ratio plus a qualitative flag (“green”, “amber”, “red”).
 *
 * Ref: Gabbett (2016) & later systematic reviews suggest safest band is 0.8-1.3.  [oai_citation:0‡PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7047972/?utm_source=chatgpt.com) [oai_citation:1‡PubMed](https://pubmed.ncbi.nlm.nih.gov/32572824/?utm_source=chatgpt.com)
 *
 * @param {number[]} sessionLoads – array of daily sRPE × duration values,
 *                                   newest value last.
 *                                   Must contain ≥ 28 entries.
 * @returns {{ratio:number, flag:'green'|'amber'|'red', acute:number, chronic:number}}
 */
export default function acwr(sessionLoads) {
    if (sessionLoads.length < 28) throw new Error('Need ≥ 28 daily loads');
  
    // --- helper: exponentially-weighted moving average ------------------------
    const ewma = (window, alpha) =>
      sessionLoads
        .slice(-window)
        .reduceRight((prev, cur) => alpha * cur + (1 - alpha) * prev);
  
    const acute   = ewma(7, 0.5);   // higher alpha = heavier recent weight
    const chronic = ewma(28, 0.1);
  
    const ratio = +(acute / chronic).toFixed(2);
  
    let flag = 'green';
    if (ratio < 0.8 || ratio > 1.5) flag = 'red';
    else if (ratio < 0.9 || ratio > 1.3) flag = 'amber';
  
    return { ratio, flag, acute, chronic };
  }