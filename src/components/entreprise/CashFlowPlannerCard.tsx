"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { formatEUR } from "@/lib/budget";
import { useCashFlowData, type CashFlowItem, type CashFlowFrequency } from "@/hooks/useCashFlowData";
import { CASH_FLOW_AUTOSYNC_KEY } from "@/lib/entreprise-backup";
import { occursInMonth, openingBalanceWithoutFirstRevenue, projectCashFlow } from "@/lib/cash-flow";
import { arceCreditsByMonth, arceFromAre, calculateARE } from "@/lib/are";
import { useFreelanceData } from "@/hooks/useFreelanceData";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const CATEGORIES = [
  "Chiffre d'affaires",
  "Subventions",
  "Prêts",
  "Investissements",
  "Loyer",
  "Salaires",
  "Charges sociales",
  "Fournisseurs",
  "Électricité/Water",
  "Télécom",
  "Assurances",
  "Déplacements",
  "Matériel",
  "Logiciels",
  "Marketing",
  "Autres",
];

const FREQUENCIES: CashFlowFrequency[] = ["ponctuel", "mensuel", "trimestriel", "annuel"];

export default function CashFlowPlannerCard() {
  const {
    data: savedData,
    loading: dataLoading,
    error: dataError,
    saving,
    addItem,
    updateItem,
    deleteItem,
    saveField,
    saveData,
  } = useCashFlowData();

  // Get Freelance data
  const {
    data: freelanceData,
    loading: freelanceLoading,
  } = useFreelanceData();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CashFlowItem | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "gantt" | "chart">("table");
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("month");
  const [autoSync, setAutoSync] = useState(
    () => typeof window === "undefined" || localStorage.getItem(CASH_FLOW_AUTOSYNC_KEY) !== "0"
  );

  // Sync with Freelance data
  const syncFromFreelance = useCallback(async () => {
    if (!freelanceData) return;

    const tjm = freelanceData.tjm ?? 480;
    const days = freelanceData.days ?? 18;
    const startDate = new Date().toISOString().split("T")[0];

    // Calculate annual revenue
    const monthlyRevenue = tjm * days;

    // Costs from freelance data
    const costs = {
      retirement: freelanceData.costRetirement ?? 300,
      lld: freelanceData.costLld ?? 450,
      fuel: freelanceData.costFuel ?? 150,
      mutuelle: freelanceData.costMutuelle ?? 80,
      bankIns: freelanceData.costBankIns ?? 45,
      accountant: freelanceData.costAccountant ?? 150,
      meals: freelanceData.costMeals ?? 200,
      telecom: freelanceData.costTelecom ?? 50,
      tech: freelanceData.costTech ?? 50,
    };

    // Build cash flow items from freelance data
    const newItems: CashFlowItem[] = [
      {
        id: "freelance_revenue",
        label: "Revenu Freelance (CA)",
        amount: monthlyRevenue,
        type: "credit",
        frequency: "mensuel",
        startDate,
        endDate: null,
        category: "Chiffre d'affaires",
        notes: `TJM: ${tjm}€ × ${days} jours/mois`,
      },
      {
        id: "freelance_retirement",
        label: "Cotisation retraite",
        amount: costs.retirement,
        type: "debit",
        frequency: "mensuel",
        startDate,
        endDate: null,
        category: "Charges sociales",
        notes: "",
      },
      {
        id: "freelance_lld",
        label: "Location longue durée",
        amount: costs.lld,
        type: "debit",
        frequency: "mensuel",
        startDate,
        endDate: null,
        category: "Déplacements",
        notes: "",
      },
      {
        id: "freelance_fuel",
        label: "Carburant",
        amount: costs.fuel,
        type: "debit",
        frequency: "mensuel",
        startDate,
        endDate: null,
        category: "Déplacements",
        notes: "",
      },
      {
        id: "freelance_mutuelle",
        label: "Mutuelle santé",
        amount: costs.mutuelle,
        type: "debit",
        frequency: "mensuel",
        startDate,
        endDate: null,
        category: "Assurances",
        notes: "",
      },
      {
        id: "freelance_bank_ins",
        label: "Assurance banque",
        amount: costs.bankIns,
        type: "debit",
        frequency: "mensuel",
        startDate,
        endDate: null,
        category: "Assurances",
        notes: "",
      },
      {
        id: "freelance_accountant",
        label: "Expert comptable",
        amount: costs.accountant,
        type: "debit",
        frequency: "mensuel",
        startDate,
        endDate: null,
        category: "Fournisseurs",
        notes: "",
      },
      {
        id: "freelance_meals",
        label: "Repas professionnels",
        amount: costs.meals,
        type: "debit",
        frequency: "mensuel",
        startDate,
        endDate: null,
        category: "Matériel",
        notes: "",
      },
      {
        id: "freelance_telecom",
        label: "Télécommunications",
        amount: costs.telecom,
        type: "debit",
        frequency: "mensuel",
        startDate,
        endDate: null,
        category: "Télécom",
        notes: "",
      },
      {
        id: "freelance_tech",
        label: "Matériel informatique",
        amount: costs.tech,
        type: "debit",
        frequency: "mensuel",
        startDate,
        endDate: null,
        category: "Logiciels",
        notes: "",
      },
    ];

    await saveData({
      items: newItems,
      initialBalance: openingBalanceWithoutFirstRevenue(savedData?.initialBalance ?? 0, monthlyRevenue),
    });
  }, [freelanceData, saveData, savedData?.initialBalance]);

  // Auto-sync when freelance data changes. An import turns this off
  // (cashFlowAutoSync = "0") so the loaded lines are not replaced.
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(CASH_FLOW_AUTOSYNC_KEY) === "0") {
      return;
    }
    if (autoSync && freelanceData && !freelanceLoading) {
      syncFromFreelance();
    }
  }, [freelanceData, freelanceLoading, autoSync, syncFromFreelance]);

  // Form state
  const [formData, setFormData] = useState({
    label: "",
    amount: 0,
    type: "credit" as "credit" | "debit",
    frequency: "ponctuel" as CashFlowFrequency,
    startDate: "",
    endDate: "",
    category: "",
    notes: "",
  });

  // Initialize form with editing item or defaults
  useEffect(() => {
    if (editingItem) {
      setFormData({
        label: editingItem.label,
        amount: editingItem.amount,
        type: editingItem.type,
        frequency: editingItem.frequency,
        startDate: editingItem.startDate,
        endDate: editingItem.endDate || "",
        category: editingItem.category,
        notes: editingItem.notes,
      });
    } else {
      setFormData({
        label: "",
        amount: 0,
        type: "credit",
        frequency: "ponctuel",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        category: "",
        notes: "",
      });
    }
  }, [editingItem]);

  const items = savedData?.items ?? [];

  // Calculate KPIs from items
  const monthlyRevenueFromItems = useMemo(() => {
    return items
      .filter(i => i.type === "credit" && i.frequency === "mensuel")
      .reduce((sum, i) => sum + i.amount, 0);
  }, [items]);

  const monthlyExpensesFromItems = useMemo(() => {
    return items
      .filter(i => i.type === "debit" && i.frequency === "mensuel")
      .reduce((sum, i) => sum + i.amount, 0);
  }, [items]);

  const netMonthly = useMemo(() => {
    return monthlyRevenueFromItems - monthlyExpensesFromItems;
  }, [monthlyRevenueFromItems, monthlyExpensesFromItems]);
  const initialBalance = savedData?.initialBalance ?? 0;
  
  const [enableARCE, setEnableARCE] = useState(false);

  const areEstimate = useMemo(() => {
    if (!freelanceData?.areToggle) return null;
    return calculateARE(
      freelanceData.salaryGross ?? 3500,
      freelanceData.salaryBonus ?? 0,
      freelanceData.userAge ?? 35,
      freelanceData.salaryMonths ?? 12,
    );
  }, [freelanceData]);

  const arcePlan = useMemo(
    () => (enableARCE && areEstimate ? arceFromAre(areEstimate) : null),
    [enableARCE, areEstimate],
  );

  const projection = useMemo(
    () => projectCashFlow(
      items,
      initialBalance,
      new Date(),
      12,
      arcePlan ? arceCreditsByMonth(arcePlan) : [],
    ),
    [items, initialBalance, arcePlan],
  );
  const months = projection.map((row) => row.label);
  const monthlyBalances = projection.map((row) => row.balance);
  const totalCredit = projection.reduce((sum, row) => sum + row.credits, 0);
  const totalDebit = projection.reduce((sum, row) => sum + row.debits, 0);
  const finalBalance = projection.length > 0 ? projection[projection.length - 1].balance : initialBalance;

  const handleInputChange = useCallback((field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newItem: Omit<CashFlowItem, 'id'> = {
      label: formData.label,
      amount: formData.amount,
      type: formData.type,
      frequency: formData.frequency,
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      category: formData.category,
      notes: formData.notes,
    };

    if (editingItem) {
      await updateItem(editingItem.id, newItem);
    } else {
      await addItem(newItem);
    }

    setShowForm(false);
    setEditingItem(null);
  }, [formData, editingItem, addItem, updateItem]);

  const handleEdit = useCallback((item: CashFlowItem) => {
    setEditingItem(item);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
      await deleteItem(id);
    }
  }, [deleteItem]);

  const handleUpdateInitialBalance = useCallback(async (value: number) => {
    await saveField("initialBalance", value);
  }, [saveField]);

  const handleToggleARCE = useCallback((enabled: boolean) => {
    setEnableARCE(enabled);
  }, []);

  // Chart data
  const chartData = useMemo(() => ({
    labels: months,
    datasets: [
      {
        label: "Solde mensuel",
        data: monthlyBalances,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
        type: "line" as const,
        yAxisID: "y",
      },
      {
        label: "Crédits",
        data: projection.map((row) => row.credits),
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        yAxisID: "y",
      },
      {
        label: "Débits",
        data: projection.map((row) => row.debits),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        yAxisID: "y",
      },
    ],
  }), [monthlyBalances, months, projection]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Évolution de la trésorerie" },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: { display: true, text: "Montant (€)" },
      },
    },
  }), []);

  if (dataLoading) {
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

  if (dataError) {
    return (
      <section className="budget-card">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {dataError}
        </div>
      </section>
    );
  }

  return (
    <section className="budget-card">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold border-b-2 border-slate-100 pb-2">
          Planning prévisionnel de trésorerie
        </h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => syncFromFreelance()}
            disabled={!freelanceData}
            className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Synchroniser avec le simulateur Freelance"
          >
            🔄 Sync Freelance
          </button>
          <button
            onClick={() => {
              const next = !autoSync;
              setAutoSync(next);
              localStorage.setItem(CASH_FLOW_AUTOSYNC_KEY, next ? "1" : "0");
            }}
            className={`px-3 py-1 rounded text-sm font-medium ${autoSync ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
            title={autoSync ? "Synchronisation automatique activée" : "Synchronisation automatique désactivée"}
          >
            {autoSync ? "Auto ✓" : "Auto ✗"}
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 rounded text-sm font-medium ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
          >
            Tableau
          </button>
          <button
            onClick={() => setViewMode("gantt")}
            className={`px-3 py-1 rounded text-sm font-medium ${viewMode === "gantt" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
          >
            Gantt
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`px-3 py-1 rounded text-sm font-medium ${viewMode === "chart" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
          >
            Graphique
          </button>
        </div>
      </div>

      {/* ARCE Toggle */}
      <div className="bg-purple-50 rounded-lg border border-purple-200 p-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableARCE}
                onChange={(e) => handleToggleARCE(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
            <div>
              <h3 className="text-lg font-bold text-purple-900">Simulateur ARCE (France Travail)</h3>
              <p className="text-sm text-purple-700">
                Aide à la Reprise ou Création d'Entreprise (45% des droits ARE restants)
              </p>
            </div>
          </div>
        </div>

        {enableARCE && !areEstimate && (
          <p className="mt-3 text-sm text-purple-800">
            Activez « Bénéficiaire Chômage (ARE) » dans le simulateur freelance, partie Paramètres Sociaux & Famille, et renseignez le salaire, les primes et l&apos;âge.
          </p>
        )}

        {enableARCE && areEstimate && arcePlan && (
          <div className="mt-4 pt-4 border-t border-purple-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-900">
            <div>
              <div className="font-semibold text-purple-800">Allocation journalière</div>
              <div className="text-lg font-bold">{formatEUR(areEstimate.daily)}</div>
              <p className="text-purple-700">Durée estimée : {areEstimate.durationMonths} mois</p>
            </div>
            <div>
              <div className="font-semibold text-purple-800">ARCE totale (45 % des droits)</div>
              <div className="text-lg font-bold">{formatEUR(arcePlan.total)}</div>
            </div>
            <div>
              <div className="font-semibold text-purple-800">Deux versements de 50 %</div>
              <p>{formatEUR(arcePlan.first)} à la fin du mois 1</p>
              <p>{formatEUR(arcePlan.second)} six mois plus tard</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <div className="bg-emerald-50 rounded-lg border border-emerald-100 p-4 text-center">
          <div className="text-sm font-semibold text-emerald-800 mb-1">Solde initial</div>
          <div className="text-lg font-bold text-emerald-700">{formatEUR(initialBalance)}</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 text-center">
          <div className="text-sm font-semibold text-blue-800 mb-1">Crédits sur 12 mois</div>
          <div className="text-2xl font-bold text-blue-700">{formatEUR(totalCredit)}</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-100 p-4 text-center">
          <div className="text-sm font-semibold text-red-800 mb-1">Débits sur 12 mois</div>
          <div className="text-2xl font-bold text-red-700">{formatEUR(totalDebit)}</div>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-100 p-4 text-center">
          <div className="text-sm font-semibold text-purple-800 mb-1">Solde final</div>
          <div className="text-2xl font-bold text-purple-700">
            {formatEUR(finalBalance)}
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingItem) && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-5">
          <h3 className="text-lg font-bold mb-4">{editingItem ? "Modifier" : "Ajouter"} un flux de trésorerie</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1">Libellé *</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleInputChange("label", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1">Montant (€) *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                required
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value as "credit" | "debit")}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                required
              >
                <option value="credit">Crédit (entrée)</option>
                <option value="debit">Débit (sortie)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1">Fréquence *</label>
              <select
                value={formData.frequency}
                onChange={(e) => handleInputChange("frequency", e.target.value as CashFlowFrequency)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                required
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq} value={freq}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1">Date de début *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1">Date de fin (optionnelle)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1">Catégorie</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="">-- Sélectionner --</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-500 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                rows={2}
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                {editingItem ? "Modifier" : "Ajouter"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Initial Balance */}
      <div className="bg-amber-50 rounded-lg border border-amber-100 p-4 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-semibold text-amber-800 mb-1">
              Solde initial de trésorerie
            </label>
            <p className="text-xs text-amber-600">
              Trésorerie déjà disponible. Le premier mois de chiffre d&apos;affaires n&apos;y entre pas : les clients ne paient pas en début de mois.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={initialBalance}
              onChange={(e) => handleUpdateInitialBalance(parseFloat(e.target.value) || 0)}
              className="rounded-md border border-amber-300 px-3 py-2 text-right font-bold"
              step="0.01"
            />
            <span className="text-lg font-bold text-amber-800">€</span>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="overflow-x-auto mb-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Liste des flux de trésorerie</h3>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              + Ajouter un flux
            </button>
          </div>
          
          {items.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
              <p>Aucun flux de trésorerie enregistré</p>
              <p className="text-sm mt-2">Cliquez sur "Ajouter un flux" pour commencer</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 px-2">Libellé</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Montant</th>
                  <th className="py-2 px-2">Fréquence</th>
                  <th className="py-2 px-2">Date début</th>
                  <th className="py-2 px-2">Date fin</th>
                  <th className="py-2 px-2">Catégorie</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-100 ${item.type === "credit" ? "bg-emerald-50" : "bg-red-50"}`}
                  >
                    <td className="py-2 px-2 font-semibold">{item.label}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.type === "credit" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>
                        {item.type === "credit" ? "Crédit" : "Débit"}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-bold">{formatEUR(item.amount)}</td>
                    <td className="py-2 px-2 text-xs">{item.frequency}</td>
                    <td className="py-2 px-2 text-xs">{new Date(item.startDate).toLocaleDateString("fr-FR")}</td>
                    <td className="py-2 px-2 text-xs">
                      {item.endDate ? new Date(item.endDate).toLocaleDateString("fr-FR") : "--"}
                    </td>
                    <td className="py-2 px-2 text-xs">{item.category}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Gantt View */}
      {viewMode === "gantt" && (
        <div className="mb-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Vue Gantt des flux de trésorerie</h3>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              + Ajouter un flux
            </button>
          </div>
          
          {items.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
              <p>Aucun flux de trésorerie à afficher</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-12 gap-px bg-slate-200">
                {/* Header */}
                <div className="col-span-4 bg-slate-100 p-2 font-semibold text-sm">Flux</div>
                {months.map((month, index) => (
                  <div key={index} className="bg-slate-100 p-2 font-semibold text-xs text-center">
                    {month}
                  </div>
                ))}
                
                {/* Rows */}
                {items.map((item) => {
                  const now = new Date();
                  return (
                    <div key={item.id} className="contents">
                      <div className="col-span-4 bg-white p-2 text-sm border-r border-slate-200">
                        <div className="font-semibold">{item.label}</div>
                        <div className="text-xs text-slate-500">
                          {formatEUR(item.amount)} - {item.frequency}
                        </div>
                      </div>
                      {Array.from({ length: 12 }).map((_, colIndex) => {
                        const month = new Date(now.getFullYear(), now.getMonth() + colIndex, 1);
                        const active = occursInMonth(item, month);
                        return (
                          <div
                            key={colIndex}
                            className={`p-1 text-center text-xs ${
                              active
                                ? item.type === "credit"
                                  ? "bg-emerald-200 text-emerald-800"
                                  : "bg-red-200 text-red-800"
                                : "bg-white"
                            }`}
                          >
                            {active ? formatEUR(item.amount) : ""}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart View */}
      {viewMode === "chart" && (
        <div className="mb-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Évolution de la trésorerie (Graphique)</h3>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              + Ajouter un flux
            </button>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="h-96">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Sauvegarde en cours...
        </div>
      )}
    </section>
  );
}
