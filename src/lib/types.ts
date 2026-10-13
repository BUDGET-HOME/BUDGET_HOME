export type Frequency = "monthly" | "annual";

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
  expenses: Expense[];
  immo: ImmoSettings;
}

export const DEFAULT_STATE: BudgetState = {
  name1: "Raphael",
  name2: "Sarah",
  salary1: "",
  salary2: "",
  force5050: false,
  expenses: [],
  immo: {
    immoApport: 20000,
    immoRate: 3.8,
    immoInsurance: 0.34,
    immoDuration: 20,
    immoType: "ancien",
  },
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
