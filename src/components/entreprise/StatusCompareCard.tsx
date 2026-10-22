"use client";

import { useState, useEffect, useCallback } from "react";
import { activityMonthStart, addCalendarMonths, formatActivityMonth } from "@/lib/activity-calendar";
import { bestStatus, plafonds, simulateYear } from "@/lib/business";
import { formatEUR } from "@/lib/budget";
import { useFreelanceData, type FreelanceSimulatorData } from "@/hooks/useFreelanceData";

export default function StatusCompareCard() {
  const {
    data: freelanceData,
    loading: freelanceLoading,
    error: freelanceError,
  } = useFreelanceData();

  // Calculate revenue and expenses from freelance data
  // Revenue = TJM * days worked per month * 12 months
  // Business expenses = sum of all monthly costs from freelance
  const tjm = freelanceData?.tjm ?? 480;
  const days = freelanceData?.days ?? 18;
  const costRetirement = freelanceData?.costRetirement ?? 300;
  const costLld = freelanceData?.costLld ?? 450;
  const costFuel = freelanceData?.costFuel ?? 150;
  const costMutuelle = freelanceData?.costMutuelle ?? 80;
  const costBankIns = freelanceData?.costBankIns ?? 45;
  const costAccountant = freelanceData?.costAccountant ?? 150;
  const costMeals = freelanceData?.costMeals ?? 200;
  const costTelecom = freelanceData?.costTelecom ?? 50;
  const costTech = freelanceData?.costTech ?? 50;

  // Calculate annual revenue: TJM * days * 12
  const annualRevenue = tjm * days * 12;
  
  // Calculate total monthly business expenses
  const totalMonthlyExpenses = costRetirement + costLld + costFuel + costMutuelle + 
                               costBankIns + costAccountant + costMeals + costTelecom + costTech;

  // Local state for inputs (override from freelance data)
  const [localRevenue, setLocalRevenue] = useState<number>(annualRevenue);
  const [localExpense, setLocalExpense] = useState<number>(totalMonthlyExpenses);

  // Sync local state with freelance data when it changes
  useEffect(() => {
    if (freelanceData) {
      const newRevenue = (freelanceData.tjm ?? 480) * (freelanceData.days ?? 18) * 12;
      const newExpenses = (freelanceData.costRetirement ?? 300) +
                          (freelanceData.costLld ?? 450) +
                          (freelanceData.costFuel ?? 150) +
                          (freelanceData.costMutuelle ?? 80) +
                          (freelanceData.costBankIns ?? 45) +
                          (freelanceData.costAccountant ?? 150) +
                          (freelanceData.costMeals ?? 200) +
                          (freelanceData.costTelecom ?? 50) +
                          (freelanceData.costTech ?? 50);
      setLocalRevenue(newRevenue);
      setLocalExpense(newExpenses);
    }
  }, [freelanceData]);

  // Change handlers for local state
  const handleRevenueChange = useCallback((value: number) => {
    setLocalRevenue(value);
  }, []);

  const handleExpenseChange = useCallback((value: number) => {
    setLocalExpense(value);
  }, []);

  const results = simulateYear({
    status: "micro",
    services: [],
    annualRevenue: localRevenue,
    monthlyBusinessExpense: localExpense,
  });
  const { best } = bestStatus(results);

  if (freelanceLoading) {
    return (
      <section className="budget-card">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-slate-500">Chargement des données...</p>
          </div>
        </div>
      </section>
    );
  }

  if (freelanceError) {
    return (
      <section className="budget-card">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {freelanceError}
        </div>
      </section>
    );
  }

  // Get EURL and SASU results for comparison
  const activityOrigin = activityMonthStart(freelanceData?.activityStartDate ?? "");
  const activityEnd = addCalendarMonths(activityOrigin, 11);
  const eurlResult = results.find(r => r.status === "eurl");
  const sasuResult = results.find(r => r.status === "sasu");

  return (
    <section className="budget-card">
      <h2 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-2">
        Choix du statut
      </h2>
      <p className="text-sm text-slate-600 mb-5">
        {freelanceData?.activityStartDate
          ? `Comparaison de l'année 1, de ${formatActivityMonth(activityOrigin)} à ${formatActivityMonth(activityEnd)}.`
          : "Début d'activité non renseigné : la comparaison porte sur une année type à partir du mois en cours."}
      </p>

      <div className="grid grid-cols-2 items-start gap-3">
      <div className="min-w-0">
      <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 mb-5">
        <h3 className="text-lg font-bold text-blue-900 mb-3">Données récupérées du simulateur Freelance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1">
              Revenu annuel calculé (€)
            </label>
            <div className="bg-white rounded-md border border-slate-300 px-3 py-2 text-lg font-bold text-blue-800">
              {formatEUR(localRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Basé sur : TJM {formatEUR(tjm)} × {days} jours/mois × 12 mois
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1">
              Charges mensuelles totales (€)
            </label>
            <div className="bg-white rounded-md border border-slate-300 px-3 py-2 text-lg font-bold text-blue-800">
              {formatEUR(localExpense)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total des coûts déclarés dans le simulateur Freelance
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-emerald-600 bg-emerald-50 p-4 mb-5">
        <div className="text-sm font-bold text-emerald-900">Recommandation</div>
        <div className="text-xl font-bold text-emerald-800">
          {(best.status === "eurl" || best.status === "sasu") ? "EURL / SASU" : best.label}
        </div>
        <div className="text-sm text-emerald-700">
          Revenu net annuel estimé : {formatEUR(best.totalTakeHome)} — taux
          effectif {(best.effectiveRate * 100).toFixed(1)} %
        </div>
      </div>

      {/* Frais de création d'entreprise */}
      <div className="bg-amber-50 rounded-lg border border-amber-100 p-4 mb-5">
        <h3 className="text-lg font-bold text-amber-900 mb-3">Frais liés à la création de l'entreprise</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-amber-200 text-center">
            <div className="font-bold text-amber-800 mb-1">Micro-entreprise</div>
            <div className="text-2xl font-bold text-amber-700">0-50 €</div>
            <div className="text-xs text-amber-600 mt-1">Gratuit en ligne (INPI)</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-amber-200 text-center">
            <div className="font-bold text-amber-800 mb-1">EI</div>
            <div className="text-2xl font-bold text-amber-700">0-100 €</div>
            <div className="text-xs text-amber-600 mt-1">Déclaration en ligne</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-amber-200 text-center">
            <div className="font-bold text-amber-800 mb-1">EURL</div>
            <div className="text-2xl font-bold text-amber-700">200-300 €</div>
            <div className="text-xs text-amber-600 mt-1">Frais greffe + publication</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-amber-200 text-center">
            <div className="font-bold text-amber-800 mb-1">SASU</div>
            <div className="text-2xl font-bold text-amber-700">200-500 €</div>
            <div className="text-xs text-amber-600 mt-1">Frais greffe + publication</div>
          </div>
        </div>
        <p className="text-xs text-amber-700 mt-3">
          Ces frais incluent les coûts de dépôt des statuts, d'immatriculation et de publication légale. 
          Des frais supplémentaires peuvent s'appliquer (expert-comptable, domiciliation, etc.).
        </p>
      </div>

      <h3 className="font-bold text-sm mb-2">Plafonds de revenu à connaître</h3>
      <ul className="text-sm space-y-1">
        {plafonds().map((p) => (
          <li key={p.label} className="flex gap-2">
            <span className="font-semibold min-w-56">{p.label}</span>
            <span>
              {p.limit === Infinity ? "illimité" : formatEUR(p.limit)} — {" "}
              <span className="text-slate-500">{p.note}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500 mt-4">
        Estimations simplifiées (taux 2025, barème indicatif) — validez avec un
        expert-comptable avant de choisir votre statut.
      </p>
      </div>
      <div className="min-w-0">

      {/* EURL vs SASU Comparison Section */}
      {eurlResult && sasuResult && (best.status === "eurl" || best.status === "sasu") && (
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 mb-5">
          <h3 className="text-lg font-bold text-blue-900 mb-4">EURL vs SASU : Comment choisir ?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* EURL Column */}
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                <span className="text-blue-600">🏢</span> EURL
              </h4>
              <p className="text-sm text-slate-600 mb-3">
                <strong>Pour qui ?</strong> Entrepreneur seul qui veut limiter sa responsabilité.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Régime <strong>TNS</strong> (Travailleur Non Salarié)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Cotisations sociales ~<strong>45%</strong> sur la rémunération</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Pas de cotisations sociales sur les dividendes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">ℹ️</span>
                  <span>Impôt sur le revenu sur la rémunération + dividendes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">ℹ️</span>
                  <span>Responsabilité limitée aux apports</span>
                </li>
              </ul>
              <div className="mt-3 pt-2 border-t border-blue-100">
                <div className="text-xs text-slate-500">Net estimé : {formatEUR(eurlResult.totalTakeHome)}</div>
                <div className="text-xs text-slate-500">Taux effectif : {(eurlResult.effectiveRate * 100).toFixed(1)}%</div>
              </div>
            </div>
            
            {/* SASU Column */}
            <div className="bg-white rounded-lg p-3 border border-indigo-200">
              <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                <span className="text-indigo-600">🏢</span> SASU
              </h4>
              <p className="text-sm text-slate-600 mb-3">
                <strong>Pour qui ?</strong> Entrepreneur seul qui veut optimiser sa protection sociale.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Régime <strong>Salarié</strong> (meilleure protection sociale)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Cotisations sociales ~<strong>82%</strong> sur la rémunération</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Cotisations sociales sur les dividendes (~17%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">ℹ️</span>
                  <span>Impôt sur le revenu sur la rémunération + flat tax 30% sur dividendes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">ℹ️</span>
                  <span>Responsabilité limitée aux apports</span>
                </li>
              </ul>
              <div className="mt-3 pt-2 border-t border-indigo-100">
                <div className="text-xs text-slate-500">Net estimé : {formatEUR(sasuResult.totalTakeHome)}</div>
                <div className="text-xs text-slate-500">Taux effectif : {(sasuResult.effectiveRate * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Decision Guide */}
          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
              <span className="text-amber-600">⚖️</span> Quand choisir quoi ?
            </h4>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">→</span>
                <span><strong>Choisissez EURL si :</strong> vous voulez payer moins de charges sociales et que la protection sociale TNS vous suffit.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">→</span>
                <span><strong>Choisissez SASU si :</strong> vous préférez la protection sociale des salariés (chômage, retraite) et acceptez des charges plus élevées.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">ℹ️</span>
                <span><strong>À savoir :</strong> La SASU permet de mieux préparer sa retraite grâce aux cotisations plus élevées.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">ℹ️</span>
                <span><strong>Fiscalement :</strong> Les deux permettent la déduction des frais réels. La différence majeure est le régime social.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm mb-5">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-2 px-2">Statut</th>
              <th className="py-2 px-2">Cotisations</th>
              <th className="py-2 px-2">Impôts</th>
              <th className="py-2 px-2">Net annuel</th>
              <th className="py-2 px-2">Taux effectif</th>
              <th className="py-2 px-2">Éligible</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr
                key={r.status}
                className={`border-b border-slate-100 ${
                  r.status === best.status ? "bg-emerald-50 font-semibold" : ""
                } ${!r.eligible ? "line-through text-red-400 opacity-60" : ""}`}
              >
                <td className="py-2 px-2">{r.label}</td>
                <td className="py-2 px-2">{formatEUR(r.socialContributions)}</td>
                <td className="py-2 px-2">{formatEUR(r.tax)}</td>
                <td className="py-2 px-2">{formatEUR(r.totalTakeHome)}</td>
                <td className="py-2 px-2">{(r.effectiveRate * 100).toFixed(1)} %</td>
                <td className="py-2 px-2">
                  {r.eligible ? (
                    <span className="text-green-600">Oui</span>
                  ) : (
                    <span className="text-red-500" title={r.eligibilityNote}>
                      Non
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      </div>

    </section>
  );
}
