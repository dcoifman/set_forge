/**
 * Adjusts next-set load using % velocity loss (VLoss) or target mean velocity.
 *
 * Consensus review (Hirsch et al., 2025) recommends terminating a set when
 * VLoss ≥ 20 % for strength-power work.  [oai_citation:6‡PubMed](https://pubmed.ncbi.nlm.nih.gov/39977021/?utm_source=chatgpt.com) [oai_citation:7‡MDPI](https://www.mdpi.com/2411-5142/10/2/106?utm_source=chatgpt.com)
 *
 * @param {Object} params
 * @param {number} params.meanVelocity – m/s of last rep
 * @param {number} params.initialVelocity – m/s first rep (or load-velocity model)
 * @param {number} params.currentLoadKg
 * @returns {number} newLoadKg
 */
export default function vbtAdjust({ meanVelocity, initialVelocity, currentLoadKg }) {
    const vLoss = 1 - (meanVelocity / initialVelocity);
  
    // If velocity loss > 20 %, drop 5 % load; if <10 %, add 2.5 %.
    const delta =
      (vLoss > 0.20) ? -0.05 :
      (vLoss < 0.10) ?  0.025 :
      0;
  
    return Math.round(currentLoadKg * (1 + delta));
  }