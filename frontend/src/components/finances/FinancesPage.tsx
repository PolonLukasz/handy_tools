"use client";

import { useState, useMemo } from "react";
import {
  Plus, Save, X, Edit2, Trash2, ChevronLeft, ChevronRight,
  Check, FileText, ClipboardCopy, TrendingUp, Settings2,
  ArrowRightLeft, Info,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  useFinances, ExchangeRates, FinanceReport, ReportSection,
  DEFAULT_RATES, toPLN, sectionsTotalPLN, fmtPLN,
} from "@/context/FinancesContext";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CURRENCIES = ["USD","EUR","GBP","CHF","PLN","JPY","CAD","AUD"];

const SECTION_COLORS = [
  "#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444",
  "#ec4899","#06b6d4","#84cc16","#f97316","#a855f7",
];

const CONFIGURABLE_CURRENCIES: Array<keyof ExchangeRates> = ["USD","EUR","GBP","CHF","JPY","CAD","AUD"];
const CURRENCY_FLAGS: Record<string, string> = {
  USD:"🇺🇸", EUR:"🇪🇺", GBP:"🇬🇧", CHF:"🇨🇭", JPY:"🇯🇵", CAD:"🇨🇦", AUD:"🇦🇺", PLN:"🇵🇱",
};
const CURRENCY_NAMES: Record<string, string> = {
  USD:"US Dollar", EUR:"Euro", GBP:"British Pound", CHF:"Swiss Franc",
  JPY:"Japanese Yen", CAD:"Canadian Dollar", AUD:"Australian Dollar",
};

let _seq = 0;
function makeId() { return `fid_${++_seq}_${Math.random().toString(36).slice(2,5)}`; }
function makeReportId(y: number, m: number) { return `${y}-${String(m).padStart(2,"0")}`; }

function prevMonthOf(year: number, month: number): [number, number] {
  return month === 1 ? [year-1, 12] : [year, month-1];
}
function nextMonthOf(year: number, month: number): [number, number] {
  return month === 12 ? [year+1, 1] : [year, month+1];
}

function fmtAmt(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style:"currency", currency, maximumFractionDigits:2 }).format(amount);
  } catch { return `${amount.toFixed(2)} ${currency}`; }
}

function ExchangeRateModal({ rates, onSave, onClose }: {
  rates: ExchangeRates; onSave: (r: ExchangeRates) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState<Record<string,string>>(() => {
    const r: Record<string,string> = {};
    CONFIGURABLE_CURRENCIES.forEach((c) => { r[c] = rates[c].toString(); });
    return r;
  });
  const [errors, setErrors] = useState<Record<string,string>>({});

  const setRate = (cur: string, val: string) => {
    setDraft((p) => ({ ...p, [cur]: val }));
    setErrors((p) => { const e = { ...p }; delete e[cur]; return e; });
  };

  const handleSave = () => {
    const e: Record<string,string> = {};
    CONFIGURABLE_CURRENCIES.forEach((c) => {
      const n = parseFloat(draft[c]);
      if (isNaN(n) || n <= 0) e[c] = "Must be > 0";
    });
    if (Object.keys(e).length) { setErrors(e); return; }
    const next = { ...rates };
    CONFIGURABLE_CURRENCIES.forEach((c) => { next[c] = parseFloat(draft[c]); });
    onSave(next); onClose();
  };

  const reset = () => {
    const r: Record<string,string> = {};
    CONFIGURABLE_CURRENCIES.forEach((c) => { r[c] = DEFAULT_RATES[c].toString(); });
    setDraft(r); setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><ArrowRightLeft size={18} /></div>
            <div>
              <h3 className="text-gray-900">Currency Exchange Rates</h3>
              <p className="text-xs text-gray-400 mt-0.5">Rates used to convert all amounts to PLN</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>

        <div className="mx-6 mt-5 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Info size={15} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Enter how many <strong>PLN</strong> equal one unit of each currency. Example: 1 USD = 4.02 PLN → enter <strong>4.02</strong>.
          </p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-3">
          {CONFIGURABLE_CURRENCIES.map((cur) => {
            const highlighted = cur === "USD" || cur === "EUR";
            return (
              <div key={cur} className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
                highlighted ? "border-blue-200 bg-blue-50/40" : "border-gray-100 bg-gray-50/60"
              }`}>
                <span className="text-xl shrink-0">{CURRENCY_FLAGS[cur]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{CURRENCY_NAMES[cur]}</p>
                  <p className="text-xs text-gray-400">
                    1 {cur} = <span className="font-mono">{parseFloat(draft[cur]||"0").toFixed(4)}</span> PLN
                    {highlighted && <span className="ml-1.5 text-blue-500">(primary)</span>}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 border rounded-lg px-3 py-2 bg-white ${
                  errors[cur] ? "border-red-400" : "border-gray-200 focus-within:border-blue-400"
                }`}>
                  <input type="number" value={draft[cur]}
                    onChange={(e) => setRate(cur, e.target.value)}
                    step="0.0001" min="0.0001"
                    className="w-20 text-sm text-right outline-none tabular-nums" />
                  <span className="text-xs text-gray-400">PLN</span>
                </div>
                {errors[cur] && <p className="text-xs text-red-500 shrink-0">{errors[cur]}</p>}
              </div>
            );
          })}
        </div>

        <div className="mx-6 mb-5 flex items-center gap-2 text-xs text-gray-400 border border-gray-100 rounded-xl px-4 py-2.5">
          <span className="text-base">{CURRENCY_FLAGS.PLN}</span>
          <span>Polish Złoty (PLN) is the base currency — always 1.0</span>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Reset to defaults</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5">
              <Check size={14} /> Apply Rates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionForm({ initial, onSave, onCancel }: {
  initial: Partial<ReportSection>;
  onSave: (s: Omit<ReportSection,"id">) => void;
  onCancel: () => void;
}) {
  const [name,     setName]     = useState(initial.name ?? "");
  const [desc,     setDesc]     = useState(initial.description ?? "");
  const [amount,   setAmount]   = useState(initial.amount?.toString() ?? "");
  const [currency, setCurrency] = useState(initial.currency ?? "USD");
  const [errors,   setErrors]   = useState<Record<string,string>>({});

  const save = () => {
    const e: Record<string,string> = {};
    if (!name.trim()) e.name = "Required";
    const n = parseFloat(amount);
    if (isNaN(n)) e.amount = "Must be a number";
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ name: name.trim(), description: desc.trim(), amount: n, currency });
  };

  const inp = (err: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${err ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Account" className={inp(!!errors.name)} />
          {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Description</label>
          <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" className={inp(false)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Amount *</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="0.01" className={inp(!!errors.amount)} />
          {errors.amount && <p className="text-xs text-red-500 mt-0.5">{errors.amount}</p>}
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Currency *</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-200 transition-colors">Cancel</button>
        <button onClick={save} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors">Save Section</button>
      </div>
    </div>
  );
}

function SectionCard({ section, index, editMode, rates, onEdit, onDelete }: {
  section: ReportSection; index: number; editMode: boolean;
  rates: ExchangeRates; onEdit: () => void; onDelete: () => void;
}) {
  const color = SECTION_COLORS[index % SECTION_COLORS.length];
  const plnVal = toPLN(section.amount, section.currency, rates);
  const needsConversion = section.currency !== "PLN";

  return (
    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 group">
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{section.name}</p>
        {section.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{section.description}</p>}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm text-gray-900 tabular-nums">{fmtAmt(section.amount, section.currency)}</p>
        {needsConversion && <p className="text-xs text-gray-400 tabular-nums">≈ {fmtPLN(plnVal)}</p>}
      </div>
      {editMode && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit}   className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 size={14} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  );
}

function ReportsSidebar({ reports, selectedYear, selectedMonth, rates, onSelect }: {
  reports: FinanceReport[]; selectedYear: number; selectedMonth: number;
  rates: ExchangeRates; onSelect: (y: number, m: number) => void;
}) {
  const years = [...new Set(reports.map((r) => r.year))].sort((a,b) => b-a);
  return (
    <div className="w-48 shrink-0 border-r border-gray-200 overflow-y-auto bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Saved Reports</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {years.map((year) => (
          <div key={year}>
            <div className="px-4 py-1.5 bg-gray-50 border-y border-gray-100">
              <p className="text-xs text-gray-400">{year}</p>
            </div>
            {reports.filter((r) => r.year === year).sort((a,b) => b.month - a.month).map((r) => {
              const isActive = r.year === selectedYear && r.month === selectedMonth;
              const plnTotal = sectionsTotalPLN(r.sections, rates);
              return (
                <button key={r.id} onClick={() => onSelect(r.year, r.month)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                    isActive ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-gray-50"
                  }`}>
                  <p className={`text-sm ${isActive ? "text-blue-700" : "text-gray-700"}`}>
                    {MONTHS_SHORT[r.month-1]} {r.year}
                  </p>
                  <p className="text-xs text-gray-400 tabular-nums">{Math.round(plnTotal/1000)}k PLN</p>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsTab() {
  const { reports, rates, saveReport } = useFinances();

  const [selYear,   setSelYear]   = useState(2026);
  const [selMonth,  setSelMonth]  = useState(4);
  const [editMode,  setEditMode]  = useState(false);
  const [draft,     setDraft]     = useState<FinanceReport | null>(null);
  const [editingSec, setEditingSec] = useState<string | null>(null);
  const [addingSec, setAddingSec] = useState(false);

  const savedReport = useMemo(() => reports.find((r) => r.year === selYear && r.month === selMonth) ?? null, [reports, selYear, selMonth]);
  const [prevY, prevM] = prevMonthOf(selYear, selMonth);
  const prevReport = useMemo(() => reports.find((r) => r.year === prevY && r.month === prevM) ?? null, [reports, prevY, prevM]);

  const goTo = (year: number, month: number) => {
    setSelYear(year); setSelMonth(month);
    setEditMode(false); setDraft(null); setEditingSec(null); setAddingSec(false);
  };
  const nav = (dir: -1 | 1) => {
    const [ny, nm] = dir === -1 ? prevMonthOf(selYear, selMonth) : nextMonthOf(selYear, selMonth);
    goTo(ny, nm);
  };
  const startEdit = (source?: FinanceReport | null) => {
    const base = source ?? savedReport;
    setDraft({ id: makeReportId(selYear, selMonth), year: selYear, month: selMonth, savedAt: new Date(),
      sections: (base?.sections ?? []).map((s) => ({ ...s, id: makeId() })) });
    setEditMode(true); setEditingSec(null); setAddingSec(false);
  };
  const cancelEdit = () => { setDraft(null); setEditMode(false); setEditingSec(null); setAddingSec(false); };
  const handleSave = () => {
    if (!draft) return;
    saveReport({ ...draft, savedAt: new Date() });
    setEditMode(false); setDraft(null); setEditingSec(null); setAddingSec(false);
  };
  const mutDraft = (fn: (d: FinanceReport) => FinanceReport) => setDraft((d) => d ? fn(d) : d);
  const addSection    = (sec: Omit<ReportSection,"id">) => { mutDraft((d) => ({ ...d, sections: [...d.sections, { ...sec, id: makeId() }] })); setAddingSec(false); };
  const updateSection = (id: string, sec: Omit<ReportSection,"id">) => { mutDraft((d) => ({ ...d, sections: d.sections.map((s) => s.id === id ? { ...sec, id } : s) })); setEditingSec(null); };
  const deleteSection = (id: string) => mutDraft((d) => ({ ...d, sections: d.sections.filter((s) => s.id !== id) }));
  const importFromPrev = () => { if (!prevReport) return; mutDraft((d) => ({ ...d, sections: prevReport.sections.map((s) => ({ ...s, id: makeId() })) })); };

  const current  = editMode ? draft : savedReport;
  const plnTotal = useMemo(() => current ? sectionsTotalPLN(current.sections, rates) : 0, [current, rates]);

  return (
    <div className="flex-1 flex overflow-hidden">
      <ReportsSidebar reports={reports} selectedYear={selYear} selectedMonth={selMonth} rates={rates} onSelect={goTo} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => nav(-1)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"><ChevronLeft size={18} /></button>
            <h2 className="text-gray-800 min-w-40 text-center">{MONTHS[selMonth-1]} {selYear}</h2>
            <button onClick={() => nav(1)}  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"><ChevronRight size={18} /></button>
            {savedReport && !editMode && (
              <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5 flex items-center gap-1 ml-1">
                <Check size={11} /> Saved
              </span>
            )}
            {editMode && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 ml-1">Editing</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editMode && prevReport && (
              <button onClick={importFromPrev} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <ClipboardCopy size={14} /> Import {MONTHS_SHORT[prevM-1]} {prevY}
              </button>
            )}
            {!editMode && savedReport && (
              <button onClick={() => startEdit()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                <Edit2 size={14} /> Edit
              </button>
            )}
            {editMode && (
              <>
                <button onClick={cancelEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-200 transition-colors"><X size={14} /> Cancel</button>
                <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"><Save size={14} /> Save Report</button>
              </>
            )}
          </div>
        </div>

        {!savedReport && !editMode && (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="p-5 rounded-full bg-gray-100"><FileText size={36} className="text-gray-400" /></div>
            <div className="text-center">
              <p className="text-gray-700 mb-1">No report for {MONTHS[selMonth-1]} {selYear}</p>
              <p className="text-sm text-gray-400">Create a new report or import the previous month&apos;s structure</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => startEdit(null)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                <Plus size={16} /> New Report
              </button>
              {prevReport && (
                <button onClick={() => startEdit(prevReport)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                  <ClipboardCopy size={16} /> Import from {MONTHS_SHORT[prevM-1]} {prevY}
                </button>
              )}
            </div>
          </div>
        )}

        {current && (
          <>
            <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 mb-4">
              <div className="p-2.5 rounded-xl bg-red-50"><span className="text-lg">🇵🇱</span></div>
              <div>
                <p className="text-xs text-gray-400">Total Balance in PLN</p>
                <p className="text-xl text-gray-900 tabular-nums">{fmtPLN(plnTotal)}</p>
              </div>
              <p className="text-xs text-gray-400 ml-auto">{current.sections.length} section{current.sections.length !== 1 ? "s" : ""}</p>
            </div>

            <div className="flex flex-col gap-2 mb-3">
              {current.sections.map((sec, i) =>
                editMode && editingSec === sec.id ? (
                  <SectionForm key={sec.id} initial={sec} onSave={(s) => updateSection(sec.id, s)} onCancel={() => setEditingSec(null)} />
                ) : (
                  <SectionCard key={sec.id} section={sec} index={i} editMode={editMode} rates={rates}
                    onEdit={() => { setEditingSec(sec.id); setAddingSec(false); }}
                    onDelete={() => deleteSection(sec.id)} />
                ),
              )}
            </div>

            {editMode && addingSec && <SectionForm initial={{}} onSave={addSection} onCancel={() => setAddingSec(false)} />}

            {editMode && !addingSec && (
              <button onClick={() => { setAddingSec(true); setEditingSec(null); }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 text-sm transition-colors mt-1">
                <Plus size={16} /> Add Section
              </button>
            )}

            {!editMode && (
              <button onClick={() => startEdit()} className="flex items-center gap-2 mt-5 px-4 py-2 rounded-lg text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <Edit2 size={14} /> Edit Report
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryTab({ onOpenRateConfig }: { onOpenRateConfig: () => void }) {
  const { reports, rates } = useFinances();
  const [year, setYear] = useState(2026);

  const latestReport = useMemo(() =>
    [...reports].sort((a,b) => a.year !== b.year ? b.year - a.year : b.month - a.month)[0] ?? null,
    [reports],
  );
  const latestPlnTotal = useMemo(() => latestReport ? sectionsTotalPLN(latestReport.sections, rates) : 0, [latestReport, rates]);
  const latestSectionPLN = useMemo(() => {
    if (!latestReport) return [];
    return latestReport.sections.map((s,i) => ({
      name: s.name, pln: toPLN(s.amount, s.currency, rates),
      originalAmt: s.amount, currency: s.currency, color: SECTION_COLORS[i % SECTION_COLORS.length],
    }));
  }, [latestReport, rates]);

  const totalBalanceData = useMemo(() =>
    MONTHS_SHORT.map((month, i) => {
      const rep = reports.find((r) => r.year === year && r.month === i+1);
      return { month, "Total (PLN)": rep ? sectionsTotalPLN(rep.sections, rates) : null };
    }),
    [reports, year, rates],
  );

  const allSectionNames = useMemo(() => {
    const names = new Set<string>();
    reports.filter((r) => r.year === year).forEach((r) => r.sections.forEach((s) => names.add(s.name)));
    return [...names];
  }, [reports, year]);

  const changeData = useMemo(() =>
    MONTHS_SHORT.map((month, i) => {
      const m = i+1;
      const rep  = reports.find((r) => r.year === year && r.month === m);
      const [py,pm] = prevMonthOf(year, m);
      const prev = reports.find((r) => r.year === py && r.month === pm);
      const point: Record<string, number|string|null> = { month };
      if (rep) {
        rep.sections.forEach((s) => {
          const ps  = prev?.sections.find((p) => p.name === s.name);
          const cur = toPLN(s.amount, s.currency, rates);
          const prv = ps ? toPLN(ps.amount, ps.currency, rates) : cur;
          point[s.name] = cur - prv;
        });
      } else { allSectionNames.forEach((n) => { point[n] = null; }); }
      return point;
    }),
    [reports, year, rates, allSectionNames],
  );

  const YearNav = ({ small }: { small?: boolean }) => (
    <div className="flex items-center gap-1">
      <button onClick={() => setYear((y) => y-1)} className={`${small ? "p-1" : "p-1.5"} rounded-lg hover:bg-gray-200 text-gray-500 transition-colors`}><ChevronLeft size={small ? 13 : 15} /></button>
      <span className={`text-gray-800 w-12 text-center tabular-nums ${small ? "text-xs" : "text-sm"}`}>{year}</span>
      <button onClick={() => setYear((y) => y+1)} className={`${small ? "p-1" : "p-1.5"} rounded-lg hover:bg-gray-200 text-gray-500 transition-colors`}><ChevronRight size={small ? 13 : 15} /></button>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Year</span>
          <YearNav />
        </div>
        <button onClick={onOpenRateConfig}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
          <ArrowRightLeft size={14} /> Exchange Rates
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">1 USD = {rates.USD} PLN</span>
        </button>
      </div>

      {latestReport && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Balance</p>
              <p className="text-4xl text-gray-900 tabular-nums">{fmtPLN(latestPlnTotal)}</p>
              <p className="text-xs text-gray-400 mt-1.5">
                As of {MONTHS[latestReport.month-1]} {latestReport.year} · all currencies converted to PLN
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-50"><span className="text-2xl">🇵🇱</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {latestSectionPLN.map((s) => {
              const pct = latestPlnTotal > 0 ? (s.pln / latestPlnTotal) * 100 : 0;
              return (
                <div key={s.name} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate">{s.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                      </div>
                      <span className="text-xs text-gray-400 tabular-nums shrink-0">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-800 tabular-nums">{fmtPLN(s.pln)}</p>
                    {s.currency !== "PLN" && <p className="text-xs text-gray-400 tabular-nums">{fmtAmt(s.originalAmt, s.currency)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-300 mt-4 flex items-center gap-1.5">
            Using rates: 1 USD = {rates.USD} PLN · 1 EUR = {rates.EUR} PLN ·
            <button onClick={onOpenRateConfig} className="text-blue-400 hover:text-blue-500 underline transition-colors">Configure</button>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-gray-800 text-sm">Monthly Total Balance</h3>
              <p className="text-xs text-gray-400 mt-0.5">{year} · in PLN</p>
            </div>
            <YearNav small />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={totalBalanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize:11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize:11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [fmtPLN(v), "Total (PLN)"]} />
              <Legend />
              <Line type="monotone" dataKey="Total (PLN)" stroke="#ef4444" strokeWidth={2.5} dot={{ r:3, fill:"#ef4444" }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-gray-800 text-sm">Monthly Change by Section</h3>
              <p className="text-xs text-gray-400 mt-0.5">{year} · delta vs prior month · PLN</p>
            </div>
            <YearNav small />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={changeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize:11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize:11 }} tickFormatter={(v) => `${v>=0?"+":""}${(v/1000).toFixed(1)}k`} />
              <Tooltip formatter={(v: number, name: string) => [`${v>=0?"+":""}${fmtPLN(v)}`, name]} />
              <Legend />
              <ReferenceLine y={0} stroke="#9ca3af" />
              {allSectionNames.map((name, i) => (
                <Bar key={`bar-${name}`} dataKey={name} fill={SECTION_COLORS[i % SECTION_COLORS.length]} radius={[3,3,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function FinancesPage() {
  const { rates, setRates } = useFinances();
  const [tab, setTab]             = useState<"summary"|"reports">("summary");
  const [rateModalOpen, setRateModalOpen] = useState(false);

  const tabs = [
    { id: "summary" as const, label: "Summary", Icon: TrendingUp },
    { id: "reports" as const, label: "Reports",  Icon: FileText  },
  ];

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="flex items-center border-b border-gray-200 px-6 bg-white shrink-0">
        <div className="flex flex-1">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm border-b-2 transition-colors ${
                tab === id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
        <button onClick={() => setRateModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200 mr-1">
          <Settings2 size={12} /> Exchange Rates
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {tab === "summary" && <SummaryTab onOpenRateConfig={() => setRateModalOpen(true)} />}
        {tab === "reports" && <ReportsTab />}
      </div>

      {rateModalOpen && (
        <ExchangeRateModal rates={rates} onSave={setRates} onClose={() => setRateModalOpen(false)} />
      )}
    </div>
  );
}
