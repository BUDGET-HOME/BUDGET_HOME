/** Seuils 2026 de la franchise en base pour les prestations de services. */
export const TVA_FRANCHISE_BASE = 37500;
export const TVA_FRANCHISE_MAJOR = 41250;

export interface VatEstimate {
  monthly: number;
  annual: number;
  monthlyTtc: number;
  annualTtc: number;
  notice: string;
}

export function estimateVat(monthlyHt: number, ratePercent: number): VatEstimate {
  const annualHt = monthlyHt * 12;
  const rate = ratePercent > 0 ? ratePercent : 0;
  const monthly = monthlyHt * rate / 100;
  const annual = monthly * 12;
  let notice = "Franchise en base : aucune TVA n'est facturée, et la TVA sur les achats n'est pas déductible.";
  if (rate > 0) {
    notice = "TVA collectée pour l'État. Elle n'entre pas dans le reste à vivre.";
  } else if (annualHt > TVA_FRANCHISE_MAJOR) {
    notice = "Le CA dépasse 41 250 € : la franchise cesse le jour du dépassement.";
  } else if (annualHt > TVA_FRANCHISE_BASE) {
    notice = "Le CA dépasse 37 500 € : la franchise tient jusqu'au 31 décembre, puis la TVA s'applique au 1er janvier.";
  }
  return {
    monthly,
    annual,
    monthlyTtc: monthlyHt + monthly,
    annualTtc: annualHt + annual,
    notice,
  };
}
