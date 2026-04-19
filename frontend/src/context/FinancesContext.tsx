"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface ReportSection {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
}

export interface FinanceReport {
  id: string;
  year: number;
  month: number;
  sections: ReportSection[];
  savedAt: Date;
}

export interface ExchangeRates {
  USD: number;
  EUR: number;
  GBP: number;
  CHF: number;
  JPY: number;
  CAD: number;
  AUD: number;
  PLN: number;
}

export const DEFAULT_RATES: ExchangeRates = {
  USD: 4.02, EUR: 4.28, GBP: 5.10, CHF: 4.48,
  JPY: 0.027, CAD: 2.96, AUD: 2.60, PLN: 1.0,
};

export function toPLN(amount: number, currency: string, rates: ExchangeRates): number {
  const rate = (rates as Record<string, number>)[currency] ?? 1;
  return amount * rate;
}

export function sectionsTotalPLN(sections: ReportSection[], rates: ExchangeRates): number {
  return sections.reduce((acc, s) => acc + toPLN(s.amount, s.currency, rates), 0);
}

export function fmtPLN(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency", currency: "PLN", maximumFractionDigits: 0,
  }).format(amount);
}

let _seq = 0;
function makeId() { return `fid_${++_seq}_${Math.random().toString(36).slice(2, 5)}`; }
function makeReportId(y: number, m: number) { return `${y}-${String(m).padStart(2, "0")}`; }

const SEC_DEFS = [
  { name: "Main Account", description: "Primary checking account for daily expenses", currency: "USD" },
  { name: "Savings Account", description: "Emergency fund & long-term savings", currency: "USD" },
  { name: "Investment - Gold", description: "Physical gold & gold ETF holdings", currency: "USD" },
  { name: "Investment - ETF", description: "S&P 500 index fund (VUSA)", currency: "USD" },
  { name: "Euro Account", description: "European travel & expense buffer", currency: "EUR" },
];

const AMT_2025: number[][] = [
  [8200,15000,4200,22000,3100],[7600,15350,4350,23500,3050],
  [8100,15700,4100,24800,3200],[7800,16000,4450,23200,3150],
  [8500,16400,4600,25100,3000],[8900,16700,4800,26800,3100],
  [8200,17100,4550,27500,3250],[7700,17450,4700,26200,3300],
  [8300,17800,5100,28100,3100],[8600,18200,5300,29500,3050],
  [9100,18600,5000,31000,3200],[8800,19000,5200,32500,3300],
];
const AMT_2026: number[][] = [
  [9200,19400,5400,33800,3400],
  [8800,19800,5600,35200,3350],
  [9400,20200,5800,36500,3500],
];

function buildSeed(): FinanceReport[] {
  const out: FinanceReport[] = [];
  const push = (year: number, amts: number[][]) =>
    amts.forEach((row, i) =>
      out.push({
        id: makeReportId(year, i + 1),
        year, month: i + 1,
        savedAt: new Date(year, i, 28),
        sections: SEC_DEFS.map((def, j) => ({ id: makeId(), ...def, amount: row[j] })),
      }),
    );
  push(2025, AMT_2025);
  push(2026, AMT_2026);
  return out;
}

interface FinancesContextType {
  reports: FinanceReport[];
  rates: ExchangeRates;
  saveReport: (r: FinanceReport) => void;
  setRates: (r: ExchangeRates) => void;
}

const FinancesContext = createContext<FinancesContextType | null>(null);

export function FinancesProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<FinanceReport[]>(buildSeed);
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_RATES);

  const saveReport = useCallback((report: FinanceReport) => {
    setReports((prev) => {
      const idx = prev.findIndex((r) => r.id === report.id);
      if (idx >= 0) {
        const next = [...prev]; next[idx] = report; return next;
      }
      return [...prev, report].sort((a, b) =>
        a.year !== b.year ? a.year - b.year : a.month - b.month,
      );
    });
  }, []);

  return (
    <FinancesContext.Provider value={{ reports, rates, saveReport, setRates }}>
      {children}
    </FinancesContext.Provider>
  );
}

export function useFinances(): FinancesContextType {
  const ctx = useContext(FinancesContext);
  if (!ctx) throw new Error("useFinances must be used inside FinancesProvider");
  return ctx;
}
