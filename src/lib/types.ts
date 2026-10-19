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
  name1: "Raphael",
  name2: "Sarah",
  salary1: "",
  salary2: "",
  force5050: false,
  mode: "separe",
  expenses: [],
  immo: {
    immoApport: 20000,
    immoRate: 3.8,
    immoInsurance: 0.34,
    immoDuration: 20,
    immoType: "ancien",
  },
  loan: {
    capital: 266000,
    rate: 3.4,
    durationMonths: 300,
    monthlyPayment: 1518.88,
    offeredTaeg: 4.2,
    startDate: "",
    insuranceMode: "remaining",
    insuranceRate: 1.3267,
    insuranceAvgMonthly: 0,
    guaranteeFees: 3192,
    brokerFees: 2500,
    fileFees: 1300,
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
