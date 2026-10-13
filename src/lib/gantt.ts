export interface GanttTask {
  id: string;
  name: string;
  startMonth: number;
  durationMonths: number;
  category: "admin" | "finance" | "produit" | "commercial" | "rh";
  done: boolean;
}

export const DEFAULT_TASKS: GanttTask[] = [
  { id: "statuts", name: "Choix du statut & rédaction des statuts", startMonth: 1, durationMonths: 1, category: "admin", done: false },
  { id: "immat", name: "Immatriculation (registre national des entreprises)", startMonth: 1, durationMonths: 1, category: "admin", done: false },
  { id: "compte", name: "Ouverture compte bancaire pro", startMonth: 2, durationMonths: 1, category: "finance", done: false },
  { id: "acre", name: "Demande ACRE / aides région", startMonth: 2, durationMonths: 1, category: "finance", done: false },
  { id: "assurances", name: "Assurances (RC pro, prévoyance)", startMonth: 2, durationMonths: 1, category: "admin", done: false },
  { id: "offres", name: "Création des offres / prix", startMonth: 2, durationMonths: 2, category: "produit", done: false },
  { id: "site", name: "Site web & identité visuelle", startMonth: 3, durationMonths: 2, category: "commercial", done: false },
  { id: "compta", name: "Mise en place comptabilité / facturation", startMonth: 3, durationMonths: 1, category: "finance", done: false },
  { id: "reseau", name: "Réseaux & partenariats", startMonth: 4, durationMonths: 3, category: "commercial", done: false },
  { id: "premiers-clients", name: "Signature des premiers clients", startMonth: 5, durationMonths: 3, category: "commercial", done: false },
  { id: "embauche", name: "Étude première embauche", startMonth: 12, durationMonths: 2, category: "rh", done: false },
  { id: "bilan1", name: "Bilan année 1 & ajustement prix", startMonth: 12, durationMonths: 1, category: "finance", done: false },
  { id: "developpement", name: "Développement de l'activité", startMonth: 13, durationMonths: 12, category: "commercial", done: false },
  { id: "bilan2", name: "Bilan année 2 & projection", startMonth: 24, durationMonths: 1, category: "finance", done: false },
];

export const CATEGORY_COLORS: Record<GanttTask["category"], string> = {
  admin: "bg-slate-400",
  finance: "bg-blue-500",
  produit: "bg-purple-500",
  commercial: "bg-emerald-500",
  rh: "bg-amber-500",
};
