import type { LoanSettings } from "./loan";
export type { LoanSettings };

export type Frequency = "monthly" | "annual";

export type BudgetMode = "separe" | "commun";

export interface Expense {
  id: number;
  desc: string;
  amount: number;
  freq: Frequency;
  category: string;
  payer: "1" | "2";
}

export interface ImmoSettings {
  immoApport: number;
  immoRate: number;
  immoInsurance: number;
  immoDuration: number;
  immoType: "ancien" | "neuf";
}

export interface BudgetState {
  name1: string;
  name2: string;
  salary1: string;
  salary2: string;
  force5050: boolean;
  mode: BudgetMode;
  expenses: Expense[];
  immo: ImmoSettings;
  loan: LoanSettings;
}

export const DEFAULT_STATE: BudgetState = {
  name1: "Personne 1",
  name2: "Personne 2",
  salary1: "",
  salary2: "",
  force5050: false,
  mode: "separe",
  expenses: [],
  immo: {
    immoApport: 0,
    immoRate: 0,
    immoInsurance: 0,
    immoDuration: 20,
    immoType: "ancien",
  },
  loan: {
    capital: 0,
    rate: 0,
    durationMonths: 0,
    monthlyPayment: 0,
    offeredTaeg: 0,
    startDate: "",
    insuranceMode: "remaining",
    insuranceRate: 0,
    insuranceAvgMonthly: 0,
    guaranteeFees: 0,
    brokerFees: 0,
    fileFees: 0,
    loanPayer: "shared",
  } satisfies LoanSettings,
};

export const CATEGORIES = [
  "🏠 Logement",
  "⚡ Énergie",
  "🛒 Courses",
  "👶 Enfants & Bébé",
  "📱 Mobile & Internet",
  "📺 TV & Streaming",
  "🚗 Transport",
  "🗡️ Assurances",
  "💊 Santé",
  "🍽️ Resto & Sorties",
  "✈️ Vacances",
  "🐾 Animaux",
  "🎁 Cadeaux",
  "📦 Autre",
] as const;

export const RENT_CATEGORY = "🏠 Logement";

export const LOAN_CATEGORY = "🏦 Crédit Maison";
