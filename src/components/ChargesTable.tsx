"use client";

import { useState } from "react";
import { CATEGORIES, type BudgetState, type Frequency } from "@/lib/types";
import { computeLoanSummary } from "@/lib/loan";
import { formatEUR, loanPeriodAmount } from "@/lib/budget";

interface Props {
  state: BudgetState;
  update: (fn: (prev: BudgetState) => BudgetState) => void;
}

export default function ChargesTable({ state, update }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState({
    desc: "",
    amount: "",
    freq: "monthly" as Frequency,
    category: "",
    payer: "1" as "1" | "2",
  });
  const [error, setError] = useState<string | null>(null);

  const sorted = [...state.expenses].sort((a, b) =>
    a.category.localeCompare(b.category)
  );

  const reset = () => {
    if (confirm("Tout effacer ?")) {
      update((p) => ({ ...p, expenses: [] }));
    }
  };

  const startEdit = (id: number) => {
    const exp = state.expenses.find((e) => e.id === id);
    if (!exp) return;
    setDraft({
      desc: exp.desc,
      amount: String(exp.amount),
      freq: exp.freq,
      category: exp.category,
      payer: exp.payer,
    });
    setEditingId(id);
    setError(null);
  };

  const saveEdit = (id: number) => {
    const amount = parseFloat(draft.amount);
    if (!draft.desc.trim() || isNaN(amount) || amount <= 0) {
      setError("Description et montant valide requis.");
      return;
    }
    update((p) => ({
      ...p,
      expenses: p.expenses.map((e) =>
        e.id === id
          ? {
              ...e,
              desc: draft.desc.trim(),
              amount,
              freq: draft.freq,
              category: draft.category,
              payer: draft.payer,
            }
          : e
      ),
    }));
    setEditingId(null);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const loanSummary = computeLoanSummary(state.loan);
  const loanActive =
    state.loan.capital > 0 && loanSummary.remainingMonths > 0;
  const loanMonthly = loanPeriodAmount(state.loan, "monthly");
  const loanPayerLabel =
    state.loan.loanPayer === "1"
      ? state.name1
      : state.loan.loanPayer === "2"
        ? state.name2
        : "Commun";
  const expensesMonthly = state.expenses.reduce(
    (a, e) => a + (e.freq === "monthly" ? e.amount : e.amount / 12),
    0
  );
  const totalMonthly = expensesMonthly + loanMonthly;

  return (
    <section className="budget-card">
      <div className="flex justify-between items-center border-b-2 border-slate-100 pb-2 mb-5">
        <h2 className="text-xl font-bold">Détail des charges</h2>
        <button
          onClick={reset}
          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 no-print"
        >
          🗑️ Reset
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="charges-fit overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-3 px-3">Cat</th>
              <th className="py-3 px-3">Quoi</th>
              <th className="py-3 px-3">Prix</th>
              <th className="py-3 px-3">Freq</th>
              <th className="py-3 px-3">Qui</th>
              <th className="py-3 px-3 no-print" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && !loanActive && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  Aucune dépense enregistrée.
                </td>
              </tr>
            )}
            {loanActive && (
              <tr className="border-b border-slate-100 bg-purple-50/60">
                <td className="py-3 px-3">🏦</td>
                <td className="py-3 px-3 font-semibold">
                  Crédit maison
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    ({loanSummary.remainingMonths} mois restants, fin{" "}
                    {loanSummary.endDate})
                  </span>
                </td>
                <td className="py-3 px-3 font-semibold">
                  {loanMonthly.toFixed(2)} €
                </td>
                <td className="py-3 px-3">Mois</td>
                <td className="py-3 px-3">
                  <span className="rounded-md bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white">
                    {loanPayerLabel}
                  </span>
                </td>
                <td className="py-3 px-3 text-right no-print">
                  <span className="text-xs text-slate-400" title="Montant calculé depuis la carte crédit maison">
                    auto
                  </span>
                </td>
              </tr>
            )}
            {sorted.map((exp) =>
              editingId === exp.id ? (
                <tr key={exp.id} className="border-b border-slate-100 bg-blue-50/50">
                  <td className="py-2 px-3">
                    <select
                      value={draft.category}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, category: e.target.value }))
                      }
                      className="rounded-md border border-slate-300 px-2 py-1 w-full"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={draft.desc}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, desc: e.target.value }))
                      }
                      className="rounded-md border border-slate-300 px-2 py-1 w-full"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="0.01"
                      value={draft.amount}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, amount: e.target.value }))
                      }
                      className="rounded-md border border-slate-300 px-2 py-1 w-24"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={draft.freq}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          freq: e.target.value as Frequency,
                        }))
                      }
                      className="rounded-md border border-slate-300 px-2 py-1"
                    >
                      <option value="monthly">Mois</option>
                      <option value="annual">An</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    {state.mode === "commun" ? (
                      <span className="rounded-md bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white">
                        Commun
                      </span>
                    ) : (
                      <select
                        value={draft.payer}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            payer: e.target.value as "1" | "2",
                          }))
                        }
                        className="rounded-md border border-slate-300 px-2 py-1"
                      >
                        <option value="1">{state.name1}</option>
                        <option value="2">{state.name2}</option>
                      </select>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right no-print whitespace-nowrap">
                    <button
                      onClick={() => saveEdit(exp.id)}
                      className="rounded bg-green-100 text-green-700 px-2 py-1 hover:bg-green-200 font-semibold"
                      title="Enregistrer"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded bg-slate-100 text-slate-600 px-2 py-1 hover:bg-slate-200 ml-1"
                      title="Annuler"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={exp.id} className="border-b border-slate-100">
                  <td className="py-3 px-3">{exp.category.split(" ")[0]}</td>
                  <td className="py-3 px-3 font-semibold">{exp.desc}</td>
                  <td className="py-3 px-3">{exp.amount} €</td>
                  <td className="py-3 px-3">
                    {exp.freq === "monthly" ? "Mois" : "An"}
                  </td>
                  <td className="py-3 px-3">
                    {state.mode === "commun" ? (
                      <span className="rounded-md bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white">
                        Commun
                      </span>
                    ) : (
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold text-white ${
                          exp.payer === "1" ? "bg-blue-600" : "bg-pink-600"
                        }`}
                      >
                        {(exp.payer === "1" ? state.name1 : state.name2).substring(0, 3)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right no-print whitespace-nowrap">
                    <button
                      onClick={() => startEdit(exp.id)}
                      className="rounded bg-blue-100 text-blue-600 px-2 py-1 hover:bg-blue-200"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() =>
                        update((p) => ({
                          ...p,
                          expenses: p.expenses.filter((e) => e.id !== exp.id),
                        }))
                      }
                      className="rounded bg-red-100 text-red-500 px-2 py-1 hover:bg-red-200 ml-1"
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              )
            )}

            {loanActive && (
              <tr className="border-t-2 border-slate-300 bg-slate-100 font-semibold">
                <td className="py-3 px-3" />
                <td className="py-3 px-3">Total mensuel (dépenses + crédit)</td>
                <td className="py-3 px-3">{formatEUR(totalMonthly)} /mois</td>
                <td colSpan={3} />
              </tr>
            )}
          </tbody>        </table>
      </div>
    </section>
  );
}
