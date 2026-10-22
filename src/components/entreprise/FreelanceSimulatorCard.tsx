"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEUR } from "@/lib/budget";
import { useFreelanceData, type FreelanceSimulatorData } from "@/hooks/useFreelanceData";
import { acreDirectorExemption, acreDirectorWindowOpen, describeMicroAcre } from "@/lib/acre";
import { arceFromAre, areInputFromFreelance, estimateAre } from "@/lib/are";

function FieldTip({ label, tip, children }: { label: string; tip: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
        <label className="block text-base text-gray-600">{label}</label>
        <svg className="w-3 h-3 text-gray-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="tooltip-content">{tip}</div>
      </div>
      {children}
    </div>
  );
}

const fieldClass = "w-full p-2 text-base border border-gray-200 rounded text-right bg-white";

function KpiTip({ lines }: { lines: { label: string; amount: string }[] }) {
  return (
    <div className="tooltip-content kpi-tip">
      {lines.map((line) => (
        <div key={line.label} className="flex justify-between gap-3 py-0.5">
          <span>{line.label}</span>
          {line.amount && <span className="font-semibold whitespace-nowrap">{line.amount}</span>}
        </div>
      ))}
    </div>
  );
}

function SocialCheck({
  label,
  tip,
  checked,
  onToggle,
}: {
  label: string;
  tip: string;
  checked: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 bg-white border border-blue-100 rounded px-2 py-1 cursor-pointer">
      <span className="text-base text-slate-700 tooltip-trigger relative">
        {label}
        <span className="tooltip-content">{tip}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onToggle(event.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}

type StatusType = "auto" | "eurl" | "sasu" | "portage";

const PLAFOND_MICRO_BNC = 77700;
const CFE_LISSEE = 50;

interface SimulationResult {
  net: number;
  taxes: number;
  ir: number;
  deductible: number;
  nonDeductible: number;
}

interface PodiumResult {
  id: string;
  val: number;
  code: StatusType;
  penalty: boolean;
}

export default function FreelanceSimulatorCard() {
  const {
    data: savedData,
    loading: dataLoading,
    error: dataError,
    saving,
    saveField,
    saveData,
  } = useFreelanceData();

  // Use saved data or defaults
  const status = savedData?.status ?? "auto";
  const tjm = savedData?.tjm ?? 480;
  const days = savedData?.days ?? 18;
  const costRetirement = savedData?.costRetirement ?? 300;
  const costLld = savedData?.costLld ?? 450;
  const costFuel = savedData?.costFuel ?? 150;
  const costMutuelle = savedData?.costMutuelle ?? 80;
  const costBankIns = savedData?.costBankIns ?? 45;
  const costAccountant = savedData?.costAccountant ?? 150;
  const pctPortage = savedData?.pctPortage ?? 7;
  const costMeals = savedData?.costMeals ?? 200;
  const costTelecom = savedData?.costTelecom ?? 50;
  const costTech = savedData?.costTech ?? 50;
  const acre = savedData?.acre ?? true;
  const fiscalParts = savedData?.fiscalParts ?? 1;
  const areToggle = savedData?.areToggle ?? false;
  const salaryGross = savedData?.salaryGross ?? 3500;
  const salaryBonus = savedData?.salaryBonus ?? 0;
  const salaryMonths = savedData?.salaryMonths ?? 12;
  const userAge = savedData?.userAge ?? 35;
  const useSpouseMutuelle = savedData?.useSpouseMutuelle ?? false;
  const activityStartDate = savedData?.activityStartDate ?? "";
  const contractEndDate = savedData?.contractEndDate ?? "";
  const areWorkedDays = savedData?.areWorkedDays ?? 730;
  const areInactivityDays = savedData?.areInactivityDays ?? 0;
  const areExcludedDays = savedData?.areExcludedDays ?? 0;
  const arePartTime = savedData?.arePartTime ?? 100;
  const arePaidLeave = savedData?.arePaidLeave ?? 0;
  const areSeverance = savedData?.areSeverance ?? 0;
  const areRightsUsed = savedData?.areRightsUsed ?? 0;
  const areOverseas = savedData?.areOverseas ?? false;
  const areIndividualAgreement = savedData?.areIndividualAgreement ?? false;
  const areReducedMinimum = savedData?.areReducedMinimum ?? false;
  const areEconomicLayoff = savedData?.areEconomicLayoff ?? false;
  const areWaitingServed = savedData?.areWaitingServed ?? false;
  const arceSecondPayment = savedData?.arceSecondPayment ?? true;

  // Local state for inputs (not auto-saved)
  const [localStatus, setLocalStatus] = useState<StatusType>(status as StatusType);
  const [localTjm, setLocalTjm] = useState<number>(tjm);
  const [localDays, setLocalDays] = useState<number>(days);
  const [localCostRetirement, setLocalCostRetirement] = useState<number>(costRetirement);
  const [localCostLld, setLocalCostLld] = useState<number>(costLld);
  const [localCostFuel, setLocalCostFuel] = useState<number>(costFuel);
  const [localCostMutuelle, setLocalCostMutuelle] = useState<number>(costMutuelle);
  const [localCostBankIns, setLocalCostBankIns] = useState<number>(costBankIns);
  const [localCostAccountant, setLocalCostAccountant] = useState<number>(costAccountant);
  const [localPctPortage, setLocalPctPortage] = useState<number>(pctPortage);
  const [localCostMeals, setLocalCostMeals] = useState<number>(costMeals);
  const [localCostTelecom, setLocalCostTelecom] = useState<number>(costTelecom);
  const [localCostTech, setLocalCostTech] = useState<number>(costTech);
  const [localAcre, setLocalAcre] = useState<boolean>(acre);
  const [localFiscalParts, setLocalFiscalParts] = useState<number>(fiscalParts);
  const [localAreToggle, setLocalAreToggle] = useState<boolean>(areToggle);
  const [localSalaryGross, setLocalSalaryGross] = useState<number>(salaryGross);
  const [localSalaryBonus, setLocalSalaryBonus] = useState<number>(salaryBonus);
  const [localSalaryMonths, setLocalSalaryMonths] = useState<number>(salaryMonths);
  const [localUserAge, setLocalUserAge] = useState<number>(userAge);
  const [localUseSpouseMutuelle, setLocalUseSpouseMutuelle] = useState<boolean>(useSpouseMutuelle);
  const [localActivityStart, setLocalActivityStart] = useState<string>(activityStartDate);
  const [localContractEnd, setLocalContractEnd] = useState<string>(contractEndDate);
  const [localAreWorkedDays, setLocalAreWorkedDays] = useState<number>(areWorkedDays);
  const [localAreInactivityDays, setLocalAreInactivityDays] = useState<number>(areInactivityDays);
  const [localAreExcludedDays, setLocalAreExcludedDays] = useState<number>(areExcludedDays);
  const [localArePartTime, setLocalArePartTime] = useState<number>(arePartTime);
  const [localArePaidLeave, setLocalArePaidLeave] = useState<number>(arePaidLeave);
  const [localAreSeverance, setLocalAreSeverance] = useState<number>(areSeverance);
  const [localAreRightsUsed, setLocalAreRightsUsed] = useState<number>(areRightsUsed);
  const [localAreOverseas, setLocalAreOverseas] = useState<boolean>(areOverseas);
  const [localAreIndividualAgreement, setLocalAreIndividualAgreement] = useState<boolean>(areIndividualAgreement);
  const [localAreReducedMinimum, setLocalAreReducedMinimum] = useState<boolean>(areReducedMinimum);
  const [localAreEconomicLayoff, setLocalAreEconomicLayoff] = useState<boolean>(areEconomicLayoff);
  const [localAreWaitingServed, setLocalAreWaitingServed] = useState<boolean>(areWaitingServed);
  const [localArceSecondPayment, setLocalArceSecondPayment] = useState<boolean>(arceSecondPayment);

  // Sync local state with saved data when it changes
  useEffect(() => {
    if (savedData) {
      setLocalStatus((savedData.status as StatusType) || "auto");
      setLocalTjm(savedData.tjm ?? 480);
      setLocalDays(savedData.days ?? 18);
      setLocalCostRetirement(savedData.costRetirement ?? 300);
      setLocalCostLld(savedData.costLld ?? 450);
      setLocalCostFuel(savedData.costFuel ?? 150);
      setLocalCostMutuelle(savedData.costMutuelle ?? 80);
      setLocalCostBankIns(savedData.costBankIns ?? 45);
      setLocalCostAccountant(savedData.costAccountant ?? 150);
      setLocalPctPortage(savedData.pctPortage ?? 7);
      setLocalCostMeals(savedData.costMeals ?? 200);
      setLocalCostTelecom(savedData.costTelecom ?? 50);
      setLocalCostTech(savedData.costTech ?? 50);
      setLocalAcre(savedData.acre ?? true);
      setLocalFiscalParts(savedData.fiscalParts ?? 1);
      setLocalAreToggle(savedData.areToggle ?? false);
      setLocalSalaryGross(savedData.salaryGross ?? 3500);
      setLocalSalaryBonus(savedData.salaryBonus ?? 0);
      setLocalSalaryMonths(savedData.salaryMonths ?? 12);
      setLocalUserAge(savedData.userAge ?? 35);
      setLocalUseSpouseMutuelle(savedData.useSpouseMutuelle ?? false);
      setLocalActivityStart(savedData.activityStartDate ?? "");
      setLocalContractEnd(savedData.contractEndDate ?? "");
      setLocalAreWorkedDays(savedData.areWorkedDays ?? 730);
      setLocalAreInactivityDays(savedData.areInactivityDays ?? 0);
      setLocalAreExcludedDays(savedData.areExcludedDays ?? 0);
      setLocalArePartTime(savedData.arePartTime ?? 100);
      setLocalArePaidLeave(savedData.arePaidLeave ?? 0);
      setLocalAreSeverance(savedData.areSeverance ?? 0);
      setLocalAreRightsUsed(savedData.areRightsUsed ?? 0);
      setLocalAreOverseas(savedData.areOverseas ?? false);
      setLocalAreIndividualAgreement(savedData.areIndividualAgreement ?? false);
      setLocalAreReducedMinimum(savedData.areReducedMinimum ?? false);
      setLocalAreEconomicLayoff(savedData.areEconomicLayoff ?? false);
      setLocalAreWaitingServed(savedData.areWaitingServed ?? false);
      setLocalArceSecondPayment(savedData.arceSecondPayment ?? true);
    }
  }, [savedData]);

  // Helper functions
  const money = (val: number): string => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  const estimateIR = (taxableAnnual: number, parts: number): number => {
    const base = taxableAnnual * 0.9;
    const quotient = base / parts;
    let tax = 0;
    if (quotient > 11294) { tax += (Math.min(quotient, 28797) - 11294) * 0.11; }
    if (quotient > 28797) { tax += (Math.min(quotient, 82341) - 28797) * 0.30; }
    if (quotient > 82341) { tax += (Math.min(quotient, 177106) - 82341) * 0.41; }
    if (quotient > 177106) { tax += (quotient - 177106) * 0.45; }
    return tax * parts;
  };

  const directorNet = (marge: number, chargeOnNet: number, isAcre: boolean, activityStart: string) => {
    if (marge <= 0) return { netAvantIR: marge, exemption: 0 };
    const annualWithout = marge / (1 + chargeOnNet) * 12;
    const exemption = acreDirectorExemption(isAcre, annualWithout, activityStart);
    const netAvantIR = marge / (1 + chargeOnNet * (1 - exemption));
    return { netAvantIR, exemption };
  };

  const simulateStatus = (status: StatusType, params: {
    caMois: number;
    costs: { ret: number; lld: number; fuel: number; mutuelle: number; bank: number; acct: number; meals: number; tel: number; tech: number };
    pctPortage: number;
    isAcre: boolean;
    parts: number;
    activityStart: string;
  }): SimulationResult => {
    const caMois = params.caMois;
    const parts = params.parts;
    const commonCosts = params.costs.lld + params.costs.fuel + params.costs.mutuelle + params.costs.bank + params.costs.meals + params.costs.tel + params.costs.tech + params.costs.ret;
    let deductible = 0;
    let nonDeductible = 0;
    let taxes = 0;
    let ir = 0;
    let net = 0;

    if (status === 'auto') {
      const micro = describeMicroAcre(params.isAcre, params.activityStart);
      taxes = caMois * (micro.rate / 100);
      const baseImposable = (caMois * 12) * 0.66;
      ir = estimateIR(baseImposable, parts) / 12;
      deductible = 0;
      nonDeductible = commonCosts + CFE_LISSEE;
      net = caMois - taxes - ir - nonDeductible;
    } else if (status === 'eurl') {
      deductible = commonCosts + params.costs.acct + CFE_LISSEE;
      nonDeductible = 0;
      const marge = caMois - deductible;
      const { netAvantIR } = directorNet(marge, 0.45, params.isAcre, params.activityStart);
      taxes = marge - netAvantIR;
      ir = estimateIR(netAvantIR * 12, parts) / 12;
      net = netAvantIR - ir;
    } else if (status === 'sasu') {
      deductible = commonCosts + params.costs.acct + CFE_LISSEE;
      nonDeductible = 0;
      const marge = caMois - deductible;
      const { netAvantIR } = directorNet(marge, 0.82, params.isAcre, params.activityStart);
      taxes = marge - netAvantIR;
      ir = estimateIR(netAvantIR * 12, parts) / 12;
      net = netAvantIR - ir;
    } else if (status === 'portage') {
      const gestion = caMois * (params.pctPortage / 100);
      deductible = commonCosts + gestion;
      nonDeductible = 0;
      const dispo = caMois - deductible;
      const netAvantIR = dispo * 0.51;
      taxes = dispo - netAvantIR;
      ir = estimateIR(netAvantIR * 12, parts) / 12;
      net = netAvantIR - ir;
    }

    return { net, taxes, ir, deductible, nonDeductible };
  };

  // Handler for field changes with manual save on blur/enter
  const handleChange = useCallback((field: keyof Omit<FreelanceSimulatorData, 'updatedAt' | 'userId'>, value: FreelanceSimulatorData[typeof field]) => {
    // Update local state immediately for UI responsiveness
    switch (field) {
      case 'status': setLocalStatus(value as StatusType); break;
      case 'tjm': setLocalTjm(value as number); break;
      case 'days': setLocalDays(value as number); break;
      case 'costRetirement': setLocalCostRetirement(value as number); break;
      case 'costLld': setLocalCostLld(value as number); break;
      case 'costFuel': setLocalCostFuel(value as number); break;
      case 'costMutuelle': setLocalCostMutuelle(value as number); break;
      case 'costBankIns': setLocalCostBankIns(value as number); break;
      case 'costAccountant': setLocalCostAccountant(value as number); break;
      case 'pctPortage': setLocalPctPortage(value as number); break;
      case 'costMeals': setLocalCostMeals(value as number); break;
      case 'costTelecom': setLocalCostTelecom(value as number); break;
      case 'costTech': setLocalCostTech(value as number); break;
      case 'acre': setLocalAcre(value as boolean); break;
      case 'fiscalParts': setLocalFiscalParts(value as number); break;
      case 'areToggle': setLocalAreToggle(value as boolean); break;
      case 'salaryGross': setLocalSalaryGross(value as number); break;
      case 'salaryBonus': setLocalSalaryBonus(value as number); break;
      case 'salaryMonths': setLocalSalaryMonths(value as number); break;
      case 'userAge': setLocalUserAge(value as number); break;
      case 'useSpouseMutuelle': setLocalUseSpouseMutuelle(value as boolean); break;
      case 'activityStartDate': setLocalActivityStart(value as string); break;
      case 'contractEndDate': setLocalContractEnd(value as string); break;
      case 'areWorkedDays': setLocalAreWorkedDays(value as number); break;
      case 'areInactivityDays': setLocalAreInactivityDays(value as number); break;
      case 'areExcludedDays': setLocalAreExcludedDays(value as number); break;
      case 'arePartTime': setLocalArePartTime(value as number); break;
      case 'arePaidLeave': setLocalArePaidLeave(value as number); break;
      case 'areSeverance': setLocalAreSeverance(value as number); break;
      case 'areRightsUsed': setLocalAreRightsUsed(value as number); break;
      case 'areOverseas': setLocalAreOverseas(value as boolean); break;
      case 'areIndividualAgreement': setLocalAreIndividualAgreement(value as boolean); break;
      case 'areReducedMinimum': setLocalAreReducedMinimum(value as boolean); break;
      case 'areEconomicLayoff': setLocalAreEconomicLayoff(value as boolean); break;
      case 'areWaitingServed': setLocalAreWaitingServed(value as boolean); break;
      case 'arceSecondPayment': setLocalArceSecondPayment(value as boolean); break;
    }
  }, []);

  const handleSave = useCallback((field: keyof Omit<FreelanceSimulatorData, 'updatedAt' | 'userId'>, value: FreelanceSimulatorData[typeof field]) => {
    saveField(field, value);
  }, [saveField]);

  const handleBlur = useCallback((field: keyof Omit<FreelanceSimulatorData, 'updatedAt' | 'userId'>, value: FreelanceSimulatorData[typeof field]) => {
    handleSave(field, value);
  }, [handleSave]);

  const handleKeyDown = useCallback((field: keyof Omit<FreelanceSimulatorData, 'updatedAt' | 'userId'>, value: FreelanceSimulatorData[typeof field], e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave(field, value);
    }
  }, [handleSave]);

  // State for outputs (calculated values)
  const [headerCA, setHeaderCA] = useState<string>("0 €");
  const [caMensuel, setCaMensuel] = useState<string>("0 €");
  const [tvaBadge, setTvaBadge] = useState<{ text: string; className: string }>({
    text: "Franchise TVA",
    className: "mt-1 inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium bg-green-100 text-green-800",
  });
  const [displayTaxes, setDisplayTaxes] = useState<string>("0 €");
  const [displayFrais, setDisplayFrais] = useState<string>("0 €");
  const [superNet, setSuperNet] = useState<string>("0 €");
  const [marginPct, setMarginPct] = useState<string>("0%");
  const [totalChargesInput, setTotalChargesInput] = useState<string>("0 €");
  const [appliedRateLabel, setAppliedRateLabel] = useState<string>("--");
  const [retirementNote, setRetirementNote] = useState<string>("En Auto, payé \"de votre poche\".");
  const [areMonthly, setAreMonthly] = useState<string>("0 €");
  const [areDaily, setAreDaily] = useState<string>("0 €");
  const [areDuration, setAreDuration] = useState<string>("Durée : 18 mois");
  const [areBreakdown, setAreBreakdown] = useState<string>("");
  const [arceBreakdown, setArceBreakdown] = useState<string>("");
  const [caDetail, setCaDetail] = useState<{ label: string; amount: string }[]>([]);
  const [taxDetail, setTaxDetail] = useState<{ label: string; amount: string }[]>([]);
  const [chargeDetail, setChargeDetail] = useState<{ label: string; amount: string }[]>([]);
  const [verdictTitle, setVerdictTitle] = useState<string>("Analyse en cours...");
  const [verdictText, setVerdictText] = useState<string>("Analyse en cours...");

  const [showDeductible, setShowDeductible] = useState<boolean>(false);
  const [showNonDeductible, setShowNonDeductible] = useState<boolean>(true);
  const [barDeductibleWidth, setBarDeductibleWidth] = useState<number>(0);
  const [barTaxesWidth, setBarTaxesWidth] = useState<number>(0);
  const [barNonDeductibleWidth, setBarNonDeductibleWidth] = useState<number>(0);
  const [valDeductible, setValDeductible] = useState<string>("0 €");
  const [valTaxes, setValTaxes] = useState<string>("0 €");
  const [valNonDeductible, setValNonDeductible] = useState<string>("0 €");
  const [labelTaxes, setLabelTaxes] = useState<string>("2. Charges Sociales & Impôts");
  const [chartMode, setChartMode] = useState<string>("Auto-Ent");

  const [podium1, setPodium1] = useState<{ name: string; val: string; penalty: boolean }>({ name: "Auto-Ent", val: "0€", penalty: false });
  const [podium2, setPodium2] = useState<{ name: string; val: string }>({ name: "EURL", val: "0€" });
  const [podium3, setPodium3] = useState<{ name: string; val: string }>({ name: "SASU", val: "0€" });
  const [podium1Height, setPodium1Height] = useState<number>(90);
  const [podium2Height, setPodium2Height] = useState<number>(60);
  const [podium3Height, setPodium3Height] = useState<number>(40);

  const calculate = useCallback(() => {
    const caMois = localTjm * localDays;
    const caAnnuel = caMois * 12;
    const parts = localFiscalParts;
    const costs = {
      ret: localCostRetirement,
      lld: localCostLld,
      fuel: localCostFuel,
      mutuelle: localUseSpouseMutuelle ? 0 : localCostMutuelle,
      bank: localCostBankIns,
      acct: localCostAccountant,
      meals: localCostMeals,
      tel: localCostTelecom,
      tech: localCostTech
    };
    const pctPortageVal = localPctPortage;
    const isAcreVal = localAcre;

    if (localAreToggle) {
      const areData = estimateAre(areInputFromFreelance({
        salaryGross: localSalaryGross,
        salaryBonus: localSalaryBonus,
        salaryMonths: localSalaryMonths,
        userAge: localUserAge,
        areWorkedDays: localAreWorkedDays,
        areInactivityDays: localAreInactivityDays,
        areExcludedDays: localAreExcludedDays,
        arePartTime: localArePartTime,
        areOverseas: localAreOverseas,
        areIndividualAgreement: localAreIndividualAgreement,
        areReducedMinimum: localAreReducedMinimum,
        arePaidLeave: localArePaidLeave,
        areSeverance: localAreSeverance,
        areEconomicLayoff: localAreEconomicLayoff,
        areWaitingServed: localAreWaitingServed,
        areRightsUsed: localAreRightsUsed,
      }));
      const plan = arceFromAre(areData, {
        contractEndDate: localContractEnd,
        secondPayment: localArceSecondPayment,
        microWithoutAcre: localStatus === "auto" && !localAcre,
      });
      setAreMonthly(money(areData.monthly));
      setAreDaily(money(areData.daily));
      setAreDuration(areData.eligible
        ? `${areData.durationDays} jours (${areData.durationMonths} mois)`
        : areData.reason);
      setAreBreakdown(areData.eligible
        ? `SJR ${money(areData.sjr)} · brute ${money(areData.dailyGross)} · nette ${money(areData.daily)} · ${areData.remainingDays} j restants`
        : "");
      const deferDays = Math.round(areData.deferSeveranceDays + areData.deferLeaveDays + areData.waitingDays);
      setArceBreakdown(plan.blockedReason
        ? plan.blockedReason
        : `ARCE ${Math.round(plan.rate * 100)} % : ${money(plan.capital)} (${money(plan.first)} fin de mois 1${plan.second > 0 ? `, ${money(plan.second)} à +6 mois` : ", second versement non retenu"}). Départ de l'ARE repoussé de ${deferDays} j.`);
    } else {
      setAreBreakdown("");
      setArceBreakdown("");
    }

    const params = { caMois, costs, pctPortage: pctPortageVal, isAcre: isAcreVal, parts, activityStart: localActivityStart };

    const currentSim = simulateStatus(localStatus, params);

    setHeaderCA(money(caAnnuel));
    setCaMensuel(money(caMois));
    setTotalChargesInput(money(Object.values(costs).reduce((a, b) => a + b, 0) + CFE_LISSEE));
    const micro = describeMicroAcre(isAcreVal, localActivityStart);
    const chargeOnNet = localStatus === "eurl" ? 0.45 : localStatus === "sasu" ? 0.82 : 0;
    const included = (amount: number) => amount > 0;
    const chargeLines = [
      included(costs.lld) ? { label: "Loyer véhicule", amount: money(costs.lld) } : null,
      included(costs.fuel) ? { label: "Carburant / entretien", amount: money(costs.fuel) } : null,
      localUseSpouseMutuelle
        ? { label: "Mutuelle prise en charge par le conjoint", amount: "" }
        : included(costs.mutuelle) ? { label: "Mutuelle", amount: money(costs.mutuelle) } : null,
      included(costs.bank) ? { label: "RC Pro & banque", amount: money(costs.bank) } : null,
      included(costs.meals) ? { label: "Repas", amount: money(costs.meals) } : null,
      included(costs.tel) ? { label: "Télécom", amount: money(costs.tel) } : null,
      included(costs.tech) ? { label: "Matériel / logiciels", amount: money(costs.tech) } : null,
      included(costs.ret) ? { label: "Épargne retraite", amount: money(costs.ret) } : null,
    ].filter((line): line is { label: string; amount: string } => line !== null);
    setCaDetail([
      { label: `${money(localTjm)} × ${localDays} jours`, amount: money(caMois) },
      { label: "Soit sur 12 mois", amount: money(caAnnuel) },
    ]);
    if (localStatus === "auto") {
      setTaxDetail([
        { label: `Cotisations ${micro.label}`, amount: money(currentSim.taxes) },
        { label: `Impôt (${localFiscalParts} part${localFiscalParts > 1 ? "s" : ""}, base 66 % du CA)`, amount: money(currentSim.ir) },
        { label: "Total", amount: money(currentSim.taxes + currentSim.ir) },
      ]);
      setChargeDetail([
        ...chargeLines,
        { label: "CFE lissée", amount: money(CFE_LISSEE) },
        { label: "Total (comptable non repris en micro)", amount: money(currentSim.nonDeductible) },
      ]);
    } else if (localStatus === "eurl" || localStatus === "sasu") {
      const marge = caMois - currentSim.deductible;
      const exemption = marge > 0
        ? acreDirectorExemption(isAcreVal, marge / (1 + chargeOnNet) * 12, localActivityStart)
        : 0;
      setTaxDetail([
        {
          label: localStatus === "eurl"
            ? `Cotisations TNS${exemption > 0 ? `, ACRE −${Math.round(exemption * 100)} %` : ""}`
            : `Cotisations salarié${exemption > 0 ? `, ACRE −${Math.round(exemption * 100)} %` : ""}`,
          amount: money(currentSim.taxes),
        },
        { label: `Impôt sur le revenu (${localFiscalParts} part${localFiscalParts > 1 ? "s" : ""})`, amount: money(currentSim.ir) },
        { label: "Total", amount: money(currentSim.taxes + currentSim.ir) },
      ]);
      setChargeDetail([
        ...chargeLines,
        included(costs.acct) ? { label: "Expert-comptable", amount: money(costs.acct) } : { label: "Expert-comptable", amount: money(0) },
        { label: "CFE lissée", amount: money(CFE_LISSEE) },
        { label: "Total déductible", amount: money(currentSim.deductible) },
      ]);
    } else {
      setTaxDetail([
        { label: `Charges salariales et patronales (49 % du disponible)`, amount: money(currentSim.taxes) },
        { label: `Impôt sur le revenu (${localFiscalParts} part${localFiscalParts > 1 ? "s" : ""})`, amount: money(currentSim.ir) },
        { label: "Total", amount: money(currentSim.taxes + currentSim.ir) },
      ]);
      setChargeDetail([
        ...chargeLines,
        { label: `Commission de portage ${localPctPortage} %`, amount: money(caMois * localPctPortage / 100) },
        { label: "Total déductible", amount: money(currentSim.deductible) },
      ]);
    }
    setDisplayTaxes(`- ${money(currentSim.taxes + currentSim.ir)}`);
    setDisplayFrais(`- ${money(currentSim.deductible + currentSim.nonDeductible)}`);
    setSuperNet(money(currentSim.net));
    setMarginPct(`${((currentSim.net / caMois) * 100).toFixed(0)}%`);

    setValDeductible(money(currentSim.deductible));
    setValTaxes(money(currentSim.taxes + currentSim.ir));
    setValNonDeductible(money(currentSim.nonDeductible));

    const maxVal = caMois || 1;
    setBarDeductibleWidth((currentSim.deductible / maxVal * 100));
    setBarTaxesWidth(((currentSim.taxes + currentSim.ir) / maxVal * 100));
    setBarNonDeductibleWidth((currentSim.nonDeductible / maxVal * 100));

    setShowDeductible(currentSim.deductible > 0);
    setShowNonDeductible(currentSim.nonDeductible > 0);
    setChartMode(localStatus.toUpperCase());

    if (localStatus === 'auto') {
      setRetirementNote("Payé de votre poche (après impôts et charges)");
      setAppliedRateLabel(describeMicroAcre(isAcreVal, localActivityStart).label);
    } else if (localStatus === 'eurl' || localStatus === 'sasu') {
      setRetirementNote("Déductible - Réduit vos charges");
      const chargeOnNet = localStatus === "eurl" ? 0.45 : 0.82;
      const deductiblePreview = Object.values(costs).reduce((sum, value) => sum + value, 0) + CFE_LISSEE;
      const annualWithout = Math.max(0, caMois - deductiblePreview) / (1 + chargeOnNet) * 12;
      const exemption = caMois > deductiblePreview
        ? acreDirectorExemption(isAcreVal, annualWithout, localActivityStart)
        : 0;
      const base = localStatus === "eurl" ? "~45 % sur le net (TNS)" : "~82 % sur le net (salarié)";
      if (exemption > 0) {
        setAppliedRateLabel(`${base}, ACRE −${Math.round(exemption * 100)} %`);
      } else if (isAcreVal && !acreDirectorWindowOpen(localActivityStart, new Date())) {
        setAppliedRateLabel(`ACRE terminée — ${base}`);
      } else {
        setAppliedRateLabel(base);
      }
    } else if (localStatus === 'portage') {
      setRetirementNote("Déductible - Réduit vos charges");
      setAppliedRateLabel("Charges Salariales + Patronales");
    }

    if (caAnnuel > 39100) {
      setTvaBadge({
        text: "Assujetti TVA (20%)",
        className: "mt-1 inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium bg-blue-100 text-blue-800"
      });
    } else {
      setTvaBadge({
        text: "Franchise TVA (si Auto)",
        className: "mt-1 inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium bg-green-100 text-green-800"
      });
    }

    // COMPARATIVE LOGIC
    const resAuto = simulateStatus('auto', params);
    const resEurl = simulateStatus('eurl', params);
    const resSasu = simulateStatus('sasu', params);
    const resPortage = simulateStatus('portage', params);

    let results: PodiumResult[] = [
      { id: 'Auto-Ent', val: resAuto.net, code: 'auto', penalty: false },
      { id: 'EURL', val: resEurl.net, code: 'eurl', penalty: false },
      { id: 'SASU', val: resSasu.net, code: 'sasu', penalty: false },
      { id: 'Portage', val: resPortage.net, code: 'portage', penalty: false }
    ];

    if (caAnnuel > PLAFOND_MICRO_BNC) {
      results.find(r => r.code === 'auto')!.penalty = true;
    }
    const fraisReelsAuto = resAuto.nonDeductible;
    const ratioFrais = fraisReelsAuto / caMois;

    results.sort((a, b) => b.val - a.val);

    setPodium1({ name: results[0].id, val: money(results[0].val), penalty: results[0].penalty });
    setPodium2({ name: results[1].id, val: money(results[1].val) });
    setPodium3({ name: results[2].id, val: money(results[2].val) });

    const maxNet = Math.max(resAuto.net, resEurl.net, resSasu.net, resPortage.net) || 1;
    setPodium1Height((results[0].val / maxNet) * 100);
    setPodium2Height((results[1].val / maxNet) * 100);
    setPodium3Height((results[2].val / maxNet) * 100);

    const financialWinner = results[0];
    const runnerUp = results[1];
    const gap = financialWinner.val - runnerUp.val;
    let verdictTitle = "";
    let verdictBody = "";

    if (financialWinner.code === 'auto') {
      if (financialWinner.penalty) {
        const realWinner = results.find(r => r.code !== 'auto');
        verdictTitle = `🚨 Attention : Plafond Dépassé !`;
        verdictBody = `L'<strong>Auto-Entreprise</strong> affiche le meilleur net (${money(financialWinner.val)}), mais votre CA (${money(caAnnuel)}) dépasse le plafond légal. <br>👉 <strong>Orientez-vous vers l'${realWinner?.id}</strong> (Net: ${money(realWinner?.val || 0)}).`;
      } else if (ratioFrais > 0.34) {
        const realWinner = results.find(r => r.code !== 'auto');
        verdictTitle = `⚠️ Attention aux Frais Réels`;
        verdictBody = `L'Auto-Entreprise est devant grâce à l'ACRE, mais vos frais (${(ratioFrais*100).toFixed(0)}%) dépassent l'abattement (34%). Vous perdez de l'argent fiscalement. Préparez le passage en <strong>${realWinner?.id}</strong>.`;
      } else {
        verdictTitle = `🏆 Vainqueur : Auto-Entreprise`;
        verdictBody = `C'est le statut idéal pour démarrer. Vous gagnez <strong>${money(gap)}</strong> de plus par mois que l'${runnerUp.id}.`;
      }
    } else {
      verdictTitle = `🏆 Vainqueur : ${financialWinner.id}`;
      if (financialWinner.code === 'eurl') {
        verdictBody = `L'<strong>EURL</strong> est la plus performante grâce à la déduction réelle de vos frais élevés (Voiture, Retraite).`;
      } else {
        verdictBody = `La <strong>SASU</strong> l'emporte. C'est souvent lié à une optimisation spécifique ou un niveau de frais particulier.`;
      }
    }

    setVerdictTitle(verdictTitle);
    setVerdictText(verdictBody);
  }, [
    localStatus, localTjm, localDays, localCostRetirement, localCostLld, localCostFuel, localCostMutuelle,
    localCostBankIns, localCostAccountant, localPctPortage, localCostMeals, localCostTelecom, localCostTech,
    localAcre, localFiscalParts, localAreToggle, localSalaryGross, localSalaryBonus, localSalaryMonths, localUserAge,
    localUseSpouseMutuelle, localActivityStart, localContractEnd, localAreWorkedDays, localAreInactivityDays,
    localAreExcludedDays, localArePartTime, localArePaidLeave, localAreSeverance, localAreRightsUsed,
    localAreOverseas, localAreIndividualAgreement, localAreReducedMinimum, localAreEconomicLayoff,
    localAreWaitingServed, localArceSecondPayment
  ]);

  useEffect(() => {
    calculate();
  }, [calculate]);

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
    <section className="budget-card freelance-board !mb-0 flex h-full min-h-0 flex-col !p-0 overflow-hidden">
      <div className="bg-slate-900 px-4 py-2 text-white flex items-center relative overflow-hidden shrink-0">
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg no-print">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight">Simulateur Freelance</h1>
        </div>
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-600 rounded-full opacity-10 blur-3xl no-print" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="grid grid-cols-12 items-start">
        {/* GAUCHE : PARAMÈTRES */}
        <div className="col-span-8 p-3 bg-gray-50 border-r border-gray-200 grid grid-cols-2 items-start gap-3">
          {/* 0. STATUT */}
          <div className="order-2 bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
            <h2 className="text-xl font-bold text-indigo-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              Statut & Facturation
            </h2>
            <div className="space-y-2">
              <div className="relative">
                <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                  <label className="block text-sm font-semibold text-gray-500">Statut Juridique</label>
                  <svg className="w-3 h-3 text-indigo-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="tooltip-content">Cadre légal de votre activité. Définit vos charges sociales (RSI/URSSAF) et votre protection sociale.</div>
                </div>
                <select
                  value={localStatus}
                  onChange={(e) => {
                    const value = e.target.value as StatusType;
                    handleChange('status', value);
                    handleSave('status', value);
                  }}
                  onBlur={() => handleSave('status', localStatus)}
                  className="w-full p-2.5 border border-indigo-200 rounded-lg bg-white font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="auto">Auto-Entrepreneur (Micro-BNC)</option>
                  <option value="eurl">Société EURL (IS / TNS)</option>
                  <option value="sasu">Société SASU (IS / Salarié)</option>
                  <option value="portage">Portage Salarial</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                    <label className="block text-sm font-semibold text-gray-500">TJM (HT)</label>
                    <svg className="w-3 h-3 text-indigo-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="tooltip-content">Tarif Journalier Moyen Hors Taxes. C'est le prix facturé au client pour une journée de prestation.</div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={localTjm}
                      onChange={(e) => handleChange('tjm', parseFloat(e.target.value) || 0)}
                      onBlur={() => handleSave('tjm', localTjm)}
                      onKeyDown={(e) => handleKeyDown('tjm', localTjm, e)}
                      className="unit-input w-full pl-3 pr-8 py-2 border border-gray-200 bg-white rounded-lg outline-none text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-gray-400 text-sm pointer-events-none">€</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                    <label className="block text-sm font-semibold text-gray-500">Jours / mois</label>
                    <svg className="w-3 h-3 text-indigo-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="tooltip-content">Nombre moyen de jours facturés. On compte généralement 18 jours pour inclure congés, maladie et intercontrats.</div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={localDays}
                      onChange={(e) => handleChange('days', parseFloat(e.target.value) || 0)}
                      onBlur={() => handleSave('days', localDays)}
                      onKeyDown={(e) => handleKeyDown('days', localDays, e)}
                      max={25}
                      className="unit-input w-full pl-3 pr-8 py-2 border border-gray-200 bg-white rounded-lg outline-none text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-gray-400 text-sm pointer-events-none">j</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. PARAMÈTRES SOCIAUX & FAMILLE */}
          <div className="order-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider mb-3">Paramètres Sociaux & Famille</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col justify-center bg-red-50 p-2 rounded border border-red-100 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 tooltip-trigger cursor-help relative">
                    <span className="text-sm font-bold text-red-800">ACRE (An 1)</span>
                    <svg className="w-3 h-3 text-red-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="tooltip-content">Micro : 10,6 % avant le 01/07/2026, puis 15,9 % jusqu&apos;à la fin du 3e trimestre civil suivant le début. Dirigeant : −25 % des cotisations si le revenu annuel est inférieur ou égal à 36 045 €, puis dégressif jusqu&apos;à 48 060 €, pendant 12 mois.</div>
                  </div>
                  <div className="relative inline-block w-8 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={localAcre}
                      onChange={(e) => {
                        const value = e.target.checked;
                        handleChange('acre', value);
                        handleSave('acre', value);
                      }}
                      className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300"
                    />
                    <label className="toggle-label block overflow-hidden h-4 rounded-full bg-gray-300 cursor-pointer" />
                  </div>
                </div>
                <label className="block text-sm text-red-800 mt-2">Début d&apos;activité</label>
                <input
                  type="date"
                  value={localActivityStart}
                  onChange={(event) => {
                    handleChange("activityStartDate", event.target.value);
                    handleSave("activityStartDate", event.target.value);
                  }}
                  className="w-full p-1 text-sm bg-white border border-red-200 rounded text-red-900"
                />
              </div>

              <div className="bg-blue-50 p-2 rounded border border-blue-100 relative">
                <div className="flex items-center gap-1 mb-1 tooltip-trigger cursor-help relative">
                  <label className="block text-sm font-bold text-blue-800">Parts Fiscales</label>
                  <svg className="w-3 h-3 text-blue-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="tooltip-content">Utilisé pour calculer l'Impôt sur le Revenu (Quotient familial). Dépend de votre situation (Marié, Enfants...).</div>
                </div>
                <select
                  value={localFiscalParts}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 1;
                    handleChange('fiscalParts', value);
                    handleSave('fiscalParts', value);
                  }}
                  onBlur={() => handleSave('fiscalParts', localFiscalParts)}
                  className="w-full p-1 text-sm bg-white border border-blue-200 rounded text-blue-900 font-bold outline-none"
                >
                  <option value="1">1 Part (Célib)</option>
                  <option value="1.5">1.5 Parts (1 Enf)</option>
                  <option value="2">2 Parts (Marié)</option>
                  <option value="2.5">2.5 Parts (Marié+1)</option>
                  <option value="3">3 Parts (Marié+2)</option>
                  <option value="4">4 Parts (Marié+3)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 bg-blue-50 p-2 rounded border border-blue-100 relative">
              <div className="flex items-center gap-1 tooltip-trigger cursor-help relative">
                <span className="text-sm font-bold text-blue-800">Bénéficiaire Chômage (ARE) ?</span>
                <svg className="w-3 h-3 text-blue-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="tooltip-content">Allocation d'Aide au Retour à l'Emploi versée par France Travail. Peut se cumuler partiellement avec vos revenus.</div>
              </div>
              <div className="relative inline-block w-8 align-middle select-none">
                <input
                  type="checkbox"
                  checked={localAreToggle}
                  onChange={(e) => {
                    const value = e.target.checked;
                    handleChange('areToggle', value);
                    handleSave('areToggle', value);
                  }}
                  className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300"
                />
                <label className="toggle-label block overflow-hidden h-4 rounded-full bg-gray-300 cursor-pointer" />
              </div>
            </div>

            {localAreToggle && (
              <div className="space-y-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <div className="grid grid-cols-2 gap-2">
                  <FieldTip label="Salaire brut mensuel" tip="Salaire brut mensuel moyen. Plafonné à 16 020 € pour le SJR.">
                    <input type="number" value={localSalaryGross} onChange={(e) => handleChange("salaryGross", parseFloat(e.target.value) || 0)} onBlur={() => handleSave("salaryGross", localSalaryGross)} onKeyDown={(e) => handleKeyDown("salaryGross", localSalaryGross, e)} className={fieldClass} />
                  </FieldTip>
                  <FieldTip label="Mois de paie" tip="12, 13 ou 14 mois de salaire dans l'année. Ce n'est pas la durée d'affiliation.">
                    <select value={localSalaryMonths} onChange={(e) => { const value = parseFloat(e.target.value) || 12; handleChange("salaryMonths", value); handleSave("salaryMonths", value); }} className={fieldClass}>
                      <option value="12">12 mois</option>
                      <option value="13">13 mois</option>
                      <option value="13.5">13,5 mois</option>
                      <option value="14">14 mois</option>
                    </select>
                  </FieldTip>
                  <FieldTip label="Primes sur la période" tip="Total des primes brutes perçues pendant les jours travaillés. Elles entrent dans le salaire de référence.">
                    <input type="number" value={localSalaryBonus} onChange={(e) => handleChange("salaryBonus", parseFloat(e.target.value) || 0)} onBlur={() => handleSave("salaryBonus", localSalaryBonus)} onKeyDown={(e) => handleKeyDown("salaryBonus", localSalaryBonus, e)} className={fieldClass} />
                  </FieldTip>
                  <FieldTip label="Âge en fin de contrat" tip="Avant 55 ans : 18 mois maximum. 55 ou 56 ans : 22,5 mois. À partir de 57 ans : 27 mois.">
                    <input type="number" value={localUserAge} onChange={(e) => handleChange("userAge", parseFloat(e.target.value) || 0)} onBlur={() => handleSave("userAge", localUserAge)} onKeyDown={(e) => handleKeyDown("userAge", localUserAge, e)} className={fieldClass} />
                  </FieldTip>
                  <FieldTip label="Jours travaillés" tip="Jours sous contrat sur la période de référence (24 mois, ou 36 mois à partir de 55 ans). 730 jours donnent le plafond de 18 mois. Minimum d'ouverture : 130 jours.">
                    <input type="number" value={localAreWorkedDays} onChange={(e) => handleChange("areWorkedDays", parseFloat(e.target.value) || 0)} onBlur={() => handleSave("areWorkedDays", localAreWorkedDays)} onKeyDown={(e) => handleKeyDown("areWorkedDays", localAreWorkedDays, e)} className={fieldClass} />
                  </FieldTip>
                  <FieldTip label="Jours non travaillés" tip="Intervalles entre contrats, retenus dans la limite de 70 % des jours travaillés. Ils allongent la durée et entrent au dénominateur du SJR.">
                    <input type="number" value={localAreInactivityDays} onChange={(e) => handleChange("areInactivityDays", parseFloat(e.target.value) || 0)} onBlur={() => handleSave("areInactivityDays", localAreInactivityDays)} onKeyDown={(e) => handleKeyDown("areInactivityDays", localAreInactivityDays, e)} className={fieldClass} />
                  </FieldTip>
                  <FieldTip label="Jours exclus" tip="Maladie de plus de 15 jours, maternité, accident du travail ou formation, à soustraire des jours retenus.">
                    <input type="number" value={localAreExcludedDays} onChange={(e) => handleChange("areExcludedDays", parseFloat(e.target.value) || 0)} onBlur={() => handleSave("areExcludedDays", localAreExcludedDays)} onKeyDown={(e) => handleKeyDown("areExcludedDays", localAreExcludedDays, e)} className={fieldClass} />
                  </FieldTip>
                  <FieldTip label="Temps partiel (%)" tip="100 % = temps plein. Un temps partiel réduit la partie fixe de 13,18 € et l'allocation minimale de 32,13 €.">
                    <input type="number" min={1} max={100} value={localArePartTime} onChange={(e) => handleChange("arePartTime", parseFloat(e.target.value) || 0)} onBlur={() => handleSave("arePartTime", localArePartTime)} onKeyDown={(e) => handleKeyDown("arePartTime", localArePartTime, e)} className={fieldClass} />
                  </FieldTip>
                  <FieldTip label="Jours d'ARE déjà consommés" tip="Jours d'allocation déjà versés. L'ARCE ne porte que sur les droits restants.">
                    <input type="number" value={localAreRightsUsed} onChange={(e) => handleChange("areRightsUsed", parseFloat(e.target.value) || 0)} onBlur={() => handleSave("areRightsUsed", localAreRightsUsed)} onKeyDown={(e) => handleKeyDown("areRightsUsed", localAreRightsUsed, e)} className={fieldClass} />
                  </FieldTip>
                  <FieldTip label="Fin du contrat" tip="À partir du 01/07/2023, l'ARCE est de 60 % des droits restants. Avant cette date, elle est de 45 %.">
                    <input type="date" value={localContractEnd} onChange={(e) => { handleChange("contractEndDate", e.target.value); handleSave("contractEndDate", e.target.value); }} className="w-full p-2 text-sm border border-gray-200 rounded bg-white" />
                  </FieldTip>
                  <FieldTip label="Indemnité de congés payés" tip="Indemnité compensatrice perçue sur les 6 derniers mois. Différé = montant ÷ SJR, plafonné à 30 jours.">
                    <input type="number" value={localArePaidLeave} onChange={(e) => handleChange("arePaidLeave", parseFloat(e.target.value) || 0)} onBlur={() => handleSave("arePaidLeave", localArePaidLeave)} onKeyDown={(e) => handleKeyDown("arePaidLeave", localArePaidLeave, e)} className={fieldClass} />
                  </FieldTip>
                  <FieldTip label="Indemnité supra-légale" tip="Part de l'indemnité de rupture au-dessus du légal. Différé = montant ÷ 111,80 €, plafonné à 150 jours (75 si licenciement économique).">
                    <input type="number" value={localAreSeverance} onChange={(e) => handleChange("areSeverance", parseFloat(e.target.value) || 0)} onBlur={() => handleSave("areSeverance", localAreSeverance)} onKeyDown={(e) => handleKeyDown("areSeverance", localAreSeverance, e)} className={fieldClass} />
                  </FieldTip>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <SocialCheck label="DROM-COM" tip="Pas de coefficient 0,75. Les plafonds de durée sont plus longs." checked={localAreOverseas} onToggle={(value) => { handleChange("areOverseas", value); handleSave("areOverseas", value); }} />
                  <SocialCheck label="Rupture conventionnelle" tip="Rupture conventionnelle individuelle à compter du 01/09/2026 : plafond abaissé (15 mois avant 55 ans, 20,5 mois à 55-56 ans)." checked={localAreIndividualAgreement} onToggle={(value) => { handleChange("areIndividualAgreement", value); handleSave("areIndividualAgreement", value); }} />
                  <SocialCheck label="Minimum 5 mois" tip="Saisonnier ou première ouverture de droits depuis 20 ans : plancher de 152 jours au lieu de 182." checked={localAreReducedMinimum} onToggle={(value) => { handleChange("areReducedMinimum", value); handleSave("areReducedMinimum", value); }} />
                  <SocialCheck label="Licenciement économique" tip="Le différé d'indemnité de rupture est plafonné à 75 jours." checked={localAreEconomicLayoff} onToggle={(value) => { handleChange("areEconomicLayoff", value); handleSave("areEconomicLayoff", value); }} />
                  <SocialCheck label="Délai d'attente déjà purgé" tip="Le délai fixe de 7 jours ne s'applique qu'une fois tous les 12 mois." checked={localAreWaitingServed} onToggle={(value) => { handleChange("areWaitingServed", value); handleSave("areWaitingServed", value); }} />
                  <SocialCheck label="Second versement ARCE" tip="La seconde moitié est versée 6 mois plus tard seulement si l'activité continue et qu'il n'y a pas de CDI à temps plein." checked={localArceSecondPayment} onToggle={(value) => { handleChange("arceSecondPayment", value); handleSave("arceSecondPayment", value); }} />
                </div>
                <div className="text-sm text-blue-900 bg-white rounded border border-blue-100 p-2 space-y-1">
                  <p><span className="font-semibold">ARE nette / mois :</span> {areMonthly} · <span className="font-semibold">nette / jour :</span> {areDaily}</p>
                  <p><span className="font-semibold">Durée :</span> {areDuration}</p>
                  {areBreakdown && <p>{areBreakdown}</p>}
                  {arceBreakdown && <p>{arceBreakdown}</p>}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
              <span>Taux appliqué :</span>
              <span className="font-bold text-gray-700">{appliedRateLabel}</span>
            </div>
          </div>
          {/* 2. CHARGES */}
          <div className="order-3 col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100 ring-1 ring-orange-100">
            <h2 className="text-xl font-bold text-orange-600 uppercase tracking-wider mb-3">Charges & Investissements</h2>
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                  <label className="block text-sm font-bold text-emerald-600">Epargne Retraite (Mensuelle)</label>
                  <svg className="w-3 h-3 text-emerald-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="tooltip-content">Montant placé volontairement (PER, Assurance Vie) pour compenser la perte de revenus à la retraite.</div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={localCostRetirement}
                    onChange={(e) => handleChange('costRetirement', parseFloat(e.target.value) || 0)}
                    onBlur={() => handleSave('costRetirement', localCostRetirement)}
                    onKeyDown={(e) => handleKeyDown('costRetirement', localCostRetirement, e)}
                    className="unit-input w-full p-2 pr-24 text-sm border border-emerald-200 rounded text-right font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="absolute right-4 top-2.5 text-emerald-600 text-sm font-bold pointer-events-none">€/mois</span>
                </div>
                <p className="text-sm text-emerald-600 mt-1 italic">{retirementNote}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                    <label className="block text-sm text-gray-500">Loyer Véhicule (LLD)</label>
                    <svg className="w-3 h-3 text-gray-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="tooltip-content">Coût de la Location Longue Durée ou LOA de votre véhicule professionnel.</div>
                  </div>
                  <input
                    type="number"
                    value={localCostLld}
                    onChange={(e) => handleChange('costLld', parseFloat(e.target.value) || 0)}
                    onBlur={() => handleSave('costLld', localCostLld)}
                    onKeyDown={(e) => handleKeyDown('costLld', localCostLld, e)}
                    className="w-full p-2 text-sm border border-gray-200 rounded text-right"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                    <label className="block text-sm text-gray-500">Carburant/Entretien</label>
                    <svg className="w-3 h-3 text-gray-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="tooltip-content">Frais d'essence, péages, assurance, réparations et maintenance.</div>
                  </div>
                  <input
                    type="number"
                    value={localCostFuel}
                    onChange={(e) => handleChange('costFuel', parseFloat(e.target.value) || 0)}
                    onBlur={() => handleSave('costFuel', localCostFuel)}
                    onKeyDown={(e) => handleKeyDown('costFuel', localCostFuel, e)}
                    className="w-full p-2 text-sm border border-gray-200 rounded text-right"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                    <label className="block text-sm text-gray-500">Mutuelle Santé</label>
                    <svg className="w-3 h-3 text-gray-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="tooltip-content">Cotisation mensuelle pour votre complémentaire santé (Madelin possible en société).</div>
                  </div>
                  <input
                    type="number"
                    value={localCostMutuelle}
                    onChange={(e) => handleChange('costMutuelle', parseFloat(e.target.value) || 0)}
                    onBlur={() => handleSave('costMutuelle', localCostMutuelle)}
                    onKeyDown={(e) => handleKeyDown('costMutuelle', localCostMutuelle, e)}
                    className="w-full p-2 text-sm border border-gray-200 rounded text-right"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                    <label className="block text-sm text-gray-500">RC Pro & Banque</label>
                    <svg className="w-3 h-3 text-gray-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="tooltip-content">Assurance Responsabilité Civile Pro (obligatoire ou conseillée) et frais de compte bancaire.</div>
                  </div>
                  <input
                    type="number"
                    value={localCostBankIns}
                    onChange={(e) => handleChange('costBankIns', parseFloat(e.target.value) || 0)}
                    onBlur={() => handleSave('costBankIns', localCostBankIns)}
                    onKeyDown={(e) => handleKeyDown('costBankIns', localCostBankIns, e)}
                    className="w-full p-2 text-sm border border-gray-200 rounded text-right"
                  />
                </div>
                <div className="rounded bg-gray-50 p-2">
                  <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                    <label className="block text-sm text-gray-500">Comptable (si Soc.)</label>
                    <svg className="w-3 h-3 text-gray-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="tooltip-content">Honoraires mensuels de l'expert-comptable (Bilan, TVA). Obligatoire en EURL/SASU.</div>
                  </div>
                  <input
                    type="number"
                    value={localCostAccountant}
                    onChange={(e) => handleChange('costAccountant', parseFloat(e.target.value) || 0)}
                    onBlur={() => handleSave('costAccountant', localCostAccountant)}
                    onKeyDown={(e) => handleKeyDown('costAccountant', localCostAccountant, e)}
                    className="w-full p-2 text-sm border border-gray-200 rounded bg-white text-right"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                    <label className="block text-sm text-gray-500">Frais Portage (%)</label>
                    <svg className="w-3 h-3 text-gray-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="tooltip-content">Commission de gestion prélevée sur votre CA par la société de portage (souvent 5% à 10%).</div>
                  </div>
                  <input
                    type="number"
                    value={localPctPortage}
                    onChange={(e) => handleChange('pctPortage', parseFloat(e.target.value) || 0)}
                    onBlur={() => handleSave('pctPortage', localPctPortage)}
                    onKeyDown={(e) => handleKeyDown('pctPortage', localPctPortage, e)}
                    className="w-full p-2 text-sm border border-gray-200 rounded bg-white text-right"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                    <label className="block text-sm text-gray-500">Repas</label>
                    <svg className="w-3 h-3 text-gray-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="tooltip-content">Frais de repas du midi lors de vos journées de travail.</div>
                  </div>
                  <input
                    type="number"
                    value={localCostMeals}
                    onChange={(e) => handleChange('costMeals', parseFloat(e.target.value) || 0)}
                    onBlur={() => handleSave('costMeals', localCostMeals)}
                    onKeyDown={(e) => handleKeyDown('costMeals', localCostMeals, e)}
                    className="w-full p-2 text-sm border border-gray-200 rounded text-right"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                    <label className="block text-sm text-gray-500">Tel/Net</label>
                    <svg className="w-3 h-3 text-gray-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="tooltip-content">Quote-part professionnelle de vos abonnements téléphone et internet.</div>
                  </div>
                  <input
                    type="number"
                    value={localCostTelecom}
                    onChange={(e) => handleChange('costTelecom', parseFloat(e.target.value) || 0)}
                    onBlur={() => handleSave('costTelecom', localCostTelecom)}
                    onKeyDown={(e) => handleKeyDown('costTelecom', localCostTelecom, e)}
                    className="w-full p-2 text-sm border border-gray-200 rounded text-right"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1 tooltip-trigger w-fit relative cursor-help">
                    <label className="block text-sm text-gray-500">Matos</label>
                    <svg className="w-3 h-3 text-gray-400 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="tooltip-content">Petit équipement, fournitures de bureau, licences logicielles (SaaS), etc.</div>
                  </div>
                  <input
                    type="number"
                    value={localCostTech}
                    onChange={(e) => handleChange('costTech', parseFloat(e.target.value) || 0)}
                    onBlur={() => handleSave('costTech', localCostTech)}
                    onKeyDown={(e) => handleKeyDown('costTech', localCostTech, e)}
                    className="w-full p-2 text-sm border border-gray-200 rounded text-right"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-600">TOTAL SORTIES / mois</span>
              <span className="text-sm font-bold text-orange-600">{totalChargesInput}</span>
            </div>
          </div>

        </div>

        {/* DROITE : DASHBOARD */}
        <div className="col-span-4 p-2 bg-white flex flex-col gap-1.5">
          <div className="bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
            <div className="text-indigo-500 text-sm font-bold uppercase tracking-wider">CA Annuel Projeté</div>
            <div id="headerAnnualCA" className="text-2xl font-bold text-indigo-950">{headerCA}</div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="tooltip-trigger relative bg-blue-50 px-2 py-2 rounded-xl border border-blue-100 cursor-help">
              <div className="text-blue-500 text-sm font-bold uppercase tracking-wider">CA Mensuel HT</div>
              <div className="text-xl font-bold text-blue-900">{caMensuel}</div>
              <div className={tvaBadge.className}>{tvaBadge.text}</div>
              <KpiTip lines={caDetail} />
            </div>
            <div className="tooltip-trigger relative bg-red-50 px-2 py-2 rounded-xl border border-red-100 cursor-help">
              <div className="text-red-500 text-sm font-bold uppercase tracking-wider">Cotis. & Impôts</div>
              <div className="text-lg font-bold text-red-900">{displayTaxes}</div>
              <KpiTip lines={taxDetail} />
            </div>
            <div className="tooltip-trigger relative bg-orange-50 px-2 py-2 rounded-xl border border-orange-100 cursor-help">
              <div className="text-orange-600 text-sm font-bold uppercase tracking-wider">Total Charges</div>
              <div className="text-lg font-bold text-orange-700">{displayFrais}</div>
              <KpiTip lines={chargeDetail} />
            </div>
          </div>

          {localAreToggle && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-3 py-2 rounded-xl shadow-lg text-white relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <div className="text-blue-200 text-sm font-bold uppercase tracking-wider">Filet de Sécurité (ARE)</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-xl font-bold">{areMonthly}</div>
                    <span className="text-sm opacity-80">/ mois (Net)</span>
                  </div>
                  <div className="text-sm text-blue-100 mt-1">{areDuration}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-300 uppercase font-bold">Alloc. Journalière</div>
                  <div className="text-xl font-bold">{areDaily}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-3 py-2 rounded-xl shadow-xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <div className="text-emerald-100 text-sm font-bold uppercase tracking-wider">Reste à vivre (Super Net) / Mois</div>
              <div className="flex items-baseline gap-3">
                <div className="text-xl font-extrabold tracking-tight">{superNet}</div>
                <div className="text-sm font-medium text-emerald-300">{marginPct}</div>
              </div>
              <div className="mt-1 text-sm text-emerald-100 opacity-90 font-medium">
                Montant NET réel disponible après TOUT (Charges, Retraite, Impôts).
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 px-3 py-2">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-gray-400 text-sm font-bold uppercase">Flux Financier (Statut Sélectionné)</h3>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">{chartMode}</span>
            </div>
            <div className="space-y-2">
              {showDeductible && (
                <div>
                  <div className="flex justify-between text-sm mb-1 font-semibold text-gray-600">
                    <span>1. Frais Déduits</span>
                    <span className="text-orange-600">{valDeductible}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-orange-400 h-2.5 rounded-full transition-all duration-700" style={{ width: `${barDeductibleWidth}%` }} />
                  </div>
                </div>
              )}
              <div>
                <div className="flex justify-between text-sm mb-1 font-semibold text-gray-600">
                  <span>{labelTaxes}</span>
                  <span className="text-red-600">{valTaxes}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-red-500 h-2.5 rounded-full transition-all duration-700" style={{ width: `${barTaxesWidth}%` }} />
                </div>
              </div>
              {showNonDeductible && (
                <div>
                  <div className="flex justify-between text-sm mb-1 font-semibold text-gray-600">
                    <span>3. Frais Non Déductibles</span>
                    <span className="text-orange-600">{valNonDeductible}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-orange-600 h-2.5 rounded-full transition-all duration-700" style={{ width: `${barNonDeductibleWidth}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-indigo-900 rounded-xl px-3 py-2 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <span>🏆</span> Bilan & Recommandation
              </h3>

              <div className="flex items-end justify-center gap-2 mb-2 h-40">
                <div className="flex h-full flex-col items-center justify-end w-1/4 group transition-all duration-500">
                  <div className="text-2xl leading-none">🥈</div>
                  <div className="text-sm text-indigo-300 font-bold">{podium2.name}</div>
                  <div className="text-sm text-indigo-400 mb-1">{podium2.val}</div>
                  <div className="w-full bg-indigo-500/50 rounded-t-lg podium-bar group-hover:bg-indigo-500/70 transition-all duration-500" style={{ height: `${Math.max(podium2Height, 18)}%` }} />
                </div>
                <div className={`flex h-full flex-col items-center justify-end w-1/3 group transition-all duration-500 ${podium1.penalty ? 'blur-locked' : ''}`}>
                  <div className="text-3xl leading-none">🥇</div>
                  <div className="text-sm text-yellow-300 font-bold">{podium1.name}</div>
                  <div className="text-sm text-white font-bold mb-1">{podium1.val}</div>
                  <div className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg podium-bar shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all duration-500" style={{ height: `${Math.max(podium1Height, 28)}%` }} />
                </div>
                <div className="flex h-full flex-col items-center justify-end w-1/4 group transition-all duration-500">
                  <div className="text-2xl leading-none">🥉</div>
                  <div className="text-sm text-indigo-300 font-bold">{podium3.name}</div>
                  <div className="text-sm text-indigo-400 mb-1">{podium3.val}</div>
                  <div className="w-full bg-indigo-700/50 rounded-t-lg podium-bar group-hover:bg-indigo-700/70 transition-all duration-500" style={{ height: `${Math.max(podium3Height, 12)}%` }} />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/10">
                <h4 className="text-sm font-bold text-yellow-300 mb-1" dangerouslySetInnerHTML={{ __html: verdictTitle }} />
                <p className="text-sm text-indigo-100 leading-snug" dangerouslySetInnerHTML={{ __html: verdictText }} />
              </div>
            </div>
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-30 no-print" />
          </div>
        </div>
      </div>
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Sauvegarde en cours...
        </div>
      )}

      <style jsx>{`
        :global(html.fit-viewport) input.unit-input {
          padding-right: 4.75rem !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c7c7c7; border-radius: 3px; }
        .podium-bar { transition: height 1s cubic-bezier(0.4, 0, 0.2, 1); }
        .blur-locked { filter: grayscale(1) opacity(0.5); }
        .toggle-checkbox:checked { right: 0; border-color: #2563EB; }
        .toggle-checkbox:checked + .toggle-label { background-color: #2563EB; }
        :global(.freelance-board .tooltip-trigger:hover .tooltip-content) { display: block; }
        :global(.freelance-board .tooltip-content) {
          display: none;
          position: absolute;
          bottom: 100%;
          left: 0;
          width: 240px;
          padding: 8px;
          background-color: #1e293b;
          color: white;
          font-size: 0.8rem;
          border-radius: 6px;
          z-index: 50;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          text-align: left;
          line-height: 1.4;
          pointer-events: none;
          margin-bottom: 5px;
        }
        :global(.freelance-board .kpi-tip) {
          width: 280px;
          z-index: 60;
        }
        :global(.freelance-board .grid.grid-cols-3 > :last-child .kpi-tip) {
          left: auto;
          right: 0;
        }
        :global(.freelance-board .tooltip-content)::after {
          content: " ";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #1e293b transparent transparent transparent;
        }
      `}</style>
    </section>
  );
}
