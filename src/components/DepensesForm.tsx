"use client";

import { useState } from "react";
import { CATEGORIES, type BudgetState, type Frequency } from "@/lib/types";

interface Props {
  state: BudgetState;
  update: (fn: (prev: BudgetState) => BudgetState) => void;
}

export default function DepensesForm({ state, update }: Props) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[13]);
  const [freq, setFreq] = useState<Frequency>("monthly");
  const [payer, setPayer] = useState<"1" | "2">("1");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const value = parseFloat(amount);
    if (!desc || isNaN(value) || value <= 0) {
      setError("Description et montant valide requis.");
      return;
    }
    update((p) => ({
      ...p,
      expenses: [
        ...p.expenses,
        { id: Date.now(), desc, amount: value, freq, category, payer },
      ],
    }));
    setDesc("");
    setAmount("");
    setError(null);
  };

  return (
    <section className="budget-card no-print">
      <h2 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-5">
        2. Ajouter une dépense
      </h2>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-semibold text-slate-500 mb-1">Description</label>
          <input
            type="text"
            value={desc}
            placeholder="Ex: Loyer, Netflix…"
            onChange={(e) => setDesc(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">Montant (€)</label>
          <input
            type="number"
            value={amount}
            placeholder="0.00"
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">Catégorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1">Fréquence</label>
          <select
            value={freq}
            onChange={(e) => setFreq(e.target.value as Frequency)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="monthly">Mensuel (x12)</option>
            <option value="annual">Annuel (x1)</option>
          </select>
        </div>
        {state.mode === "separe" && (
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1">
              Qui paye cette facture ?
            </label>
            <div className="flex rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setPayer("1")}
                className={`flex-1 rounded-md py-2 text-sm font-semibold ${
                  payer === "1" ? "bg-white text-blue-600 shadow" : "text-slate-500"
                }`}
              >
                {state.name1}
              </button>
              <button
                type="button"
                onClick={() => setPayer("2")}
                className={`flex-1 rounded-md py-2 text-sm font-semibold ${
                  payer === "2" ? "bg-white text-pink-600 shadow" : "text-slate-500"
                }`}
              >
                {state.name2}
              </button>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={submit}
        className="w-full rounded-md bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700"
      >
        + Ajouter
      </button>
    </section>
  );
}
