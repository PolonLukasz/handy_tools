"use client";

import { useState, useId, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Plus, Trash2, X, ChevronDown,
  BarChart2, Layers, Landmark, Gem, Pin, PinOff,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, ReferenceLine,
} from "recharts";
import {
  useStockMarket,
  Share, ETF, Bond, Metal, MetalType, WeightUnit, HistoryPoint, StartPoint,
} from "@/context/StockMarketContext";

function fmtCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function weeklyChange(history: HistoryPoint[]) {
  const last = history[history.length - 1]?.value ?? 0;
  const prev = history[history.length - 2]?.value ?? last;
  const pct = prev > 0 ? ((last - prev) / prev) * 100 : 0;
  return { pct, isUp: pct >= 0 };
}

function yearlyChange(history: HistoryPoint[]) {
  const last  = history[history.length - 1]?.value ?? 0;
  const first = history[0]?.value ?? last;
  const pct = first > 0 ? ((last - first) / first) * 100 : 0;
  return { pct, isUp: pct >= 0 };
}

const METAL_COLORS: Record<MetalType, string> = {
  gold: "#f59e0b", silver: "#94a3b8", platinum: "#6366f1", copper: "#f97316",
};
const METAL_LABELS: Record<MetalType, string> = {
  gold: "Gold", silver: "Silver", platinum: "Platinum", copper: "Copper",
};

function Sparkline({ data, isUp, startPoint }: {
  data: HistoryPoint[];
  isUp: boolean;
  startPoint?: StartPoint;
}) {
  const gradId   = useId();
  const color    = isUp ? "#22c55e" : "#ef4444";
  const startDate = startPoint?.date ?? null;

  return (
    <ResponsiveContainer width="100%" height={72}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.22} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <Tooltip
          contentStyle={{ fontSize: 11, padding: "4px 8px", borderRadius: 8, border: "1px solid #e5e7eb" }}
          formatter={(v: number) => [v.toFixed(2), "Price"]}
          labelFormatter={(l: string) => l}
        />
        {startDate && (
          <ReferenceLine x={startDate} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="3 3" />
        )}
        <Area
          type="monotone" dataKey="value"
          stroke={color} strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false} isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface StartPointBannerProps {
  startPoint: StartPoint;
  currentPrice: number;
  currency: string;
  onEdit: () => void;
  onClear: () => void;
}

function StartPointBanner({ startPoint, currentPrice, currency, onEdit, onClear }: StartPointBannerProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  const priceDiff = currentPrice - startPoint.price;
  const pct       = startPoint.price > 0 ? (priceDiff / startPoint.price) * 100 : 0;
  const totalDiff = priceDiff * startPoint.quantity;
  const isUp      = pct >= 0;
  const color     = isUp ? "text-green-600" : "text-red-500";
  const bg        = isUp ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100";
  const Icon      = isUp ? TrendingUp : TrendingDown;

  return (
    <>
      <div className={`mx-3 mb-3 rounded-xl border px-3 py-2.5 ${bg}`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Pin size={11} className="text-indigo-400" />
            <span className="text-xs text-gray-500">Since {fmtDate(startPoint.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors px-1.5 py-0.5 rounded hover:bg-indigo-50">
              Edit
            </button>
            <button onClick={() => setConfirmClear(true)} className="p-0.5 text-gray-300 hover:text-red-400 transition-colors rounded" title="Remove starting point">
              <X size={11} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon size={13} className={color} />
            <span className={`text-sm tabular-nums ${color}`}>{isUp ? "+" : ""}{pct.toFixed(2)}%</span>
            <span className="text-xs text-gray-400">per unit</span>
          </div>
          <div className="text-right">
            <span className={`text-xs tabular-nums ${color}`}>{isUp ? "+" : ""}{fmtCurrency(totalDiff, currency)}</span>
            <span className="text-xs text-gray-400 ml-1">total</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{fmtCurrency(startPoint.price, currency)} → {fmtCurrency(currentPrice, currency)}</span>
          <span className="text-xs text-gray-400">× {startPoint.quantity} units</span>
        </div>
      </div>

      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setConfirmClear(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-50 rounded-lg"><PinOff size={15} className="text-red-400" /></div>
                <h3 className="text-gray-900 text-sm">Remove Starting Point?</h3>
              </div>
              <button onClick={() => setConfirmClear(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X size={15} /></button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-600">This will remove the pinned starting point from <span className="text-gray-900">{fmtDate(startPoint.date)}</span>.</p>
              <p className="text-xs text-gray-400 mt-1.5">The price change tracking will no longer be displayed on this tile.</p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setConfirmClear(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={() => { onClear(); setConfirmClear(false); }} className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1.5">
                <PinOff size={13} /> Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface SetStartPointModalProps {
  initial?: StartPoint;
  defaultQuantity: number;
  defaultPrice: number;
  quantityLabel: string;
  onClose: () => void;
  onSave: (sp: StartPoint) => void;
}

function SetStartPointModal({ initial, defaultQuantity, defaultPrice, quantityLabel, onClose, onSave }: SetStartPointModalProps) {
  const [date,     setDate]     = useState(initial?.date     ?? "");
  const [price,    setPrice]    = useState(initial?.price    ?? defaultPrice);
  const [quantity, setQuantity] = useState(initial?.quantity ?? defaultQuantity);

  const handleSave = () => {
    if (!date || !price || !quantity) return;
    onSave({ date, price: Number(price), quantity: Number(quantity) });
    onClose();
  };

  const inputBase = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg"><Pin size={15} className="text-indigo-500" /></div>
            <h3 className="text-gray-900">Set Starting Point</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X size={16} /></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-xs text-gray-400">Define the date and unit price at your starting point. The card will show the price change from this moment to today.</p>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} max="2026-04-19" className={inputBase} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Price per unit at that date *</label>
            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} step="0.01" min="0" className={inputBase} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{quantityLabel} *</label>
            <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} step="any" min="0" className={inputBase} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
            <Pin size={13} /> Set point
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3 border-t border-gray-50 pt-2.5">
      {items.map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-xs text-gray-700 tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  );
}

interface CardShellProps {
  badge: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  totalValue: number;
  currency: string;
  currentUnitPrice: number;
  history: HistoryPoint[];
  startPoint?: StartPoint;
  quantityLabel: string;
  defaultQuantity: number;
  onRemove: () => void;
  onSetStartPoint: (sp: StartPoint | undefined) => void;
  children: React.ReactNode;
}

function CardShell({
  badge, badgeBg, title, subtitle,
  totalValue, currency, currentUnitPrice, history,
  startPoint, quantityLabel, defaultQuantity,
  onRemove, onSetStartPoint, children,
}: CardShellProps) {
  const { pct, isUp }               = weeklyChange(history);
  const { pct: yrPct, isUp: yrUp }  = yearlyChange(history);
  const [showSPModal, setShowSPModal] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between mb-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-900 tracking-wide">{title}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${badgeBg}`}>{badge}</span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 ml-1">
            <button
              onClick={() => setShowSPModal(true)}
              title={startPoint ? "Edit starting point" : "Set starting point"}
              className={`p-1 rounded transition-colors ${
                startPoint
                  ? "text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                  : "text-gray-300 hover:text-indigo-400 hover:bg-indigo-50"
              }`}
            >
              {startPoint ? <Pin size={13} /> : <PinOff size={13} />}
            </button>
            <button onClick={onRemove} className="p-1 text-gray-300 hover:text-red-400 transition-colors rounded">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>

      <div className="px-4 pb-2">
        <p className="text-lg text-gray-900 tabular-nums">{fmtCurrency(totalValue, currency)}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <div className="flex items-center gap-1">
            {isUp ? <TrendingUp size={12} className="text-green-500" /> : <TrendingDown size={12} className="text-red-500" />}
            <span className={`text-xs ${isUp ? "text-green-600" : "text-red-500"}`}>{isUp ? "+" : ""}{pct.toFixed(2)}%</span>
            <span className="text-xs text-gray-400">1W</span>
          </div>
          <div className="flex items-center gap-1">
            {yrUp ? <TrendingUp size={12} className="text-blue-400" /> : <TrendingDown size={12} className="text-orange-400" />}
            <span className={`text-xs ${yrUp ? "text-blue-500" : "text-orange-500"}`}>{yrUp ? "+" : ""}{yrPct.toFixed(1)}%</span>
            <span className="text-xs text-gray-400">1Y</span>
          </div>
        </div>
      </div>

      {children}

      <div className="mt-auto border-t border-gray-50">
        <Sparkline data={history} isUp={isUp} startPoint={startPoint} />
      </div>

      {startPoint && (
        <StartPointBanner
          startPoint={startPoint}
          currentPrice={currentUnitPrice}
          currency={currency}
          onEdit={() => setShowSPModal(true)}
          onClear={() => onSetStartPoint(undefined)}
        />
      )}

      {showSPModal && (
        <SetStartPointModal
          initial={startPoint}
          defaultQuantity={defaultQuantity}
          defaultPrice={currentUnitPrice}
          quantityLabel={quantityLabel}
          onClose={() => setShowSPModal(false)}
          onSave={(sp) => { onSetStartPoint(sp); setShowSPModal(false); }}
        />
      )}
    </div>
  );
}

function ShareCard({ share, onRemove, onSetStartPoint }: {
  share: Share; onRemove: () => void; onSetStartPoint: (sp: StartPoint | undefined) => void;
}) {
  const totalValue = share.sharesOwned * share.currentPrice;
  const pl         = (share.currentPrice - share.avgBuyPrice) * share.sharesOwned;
  const plPct      = share.avgBuyPrice > 0 ? ((share.currentPrice - share.avgBuyPrice) / share.avgBuyPrice) * 100 : 0;

  return (
    <CardShell
      badge={share.sector} badgeBg="bg-blue-50 text-blue-700"
      title={share.ticker} subtitle={`${share.name} · ${share.exchange}`}
      totalValue={totalValue} currency={share.currency}
      currentUnitPrice={share.currentPrice}
      history={share.history} startPoint={share.startPoint}
      quantityLabel="Shares at that date" defaultQuantity={share.sharesOwned}
      onRemove={onRemove} onSetStartPoint={onSetStartPoint}
    >
      <DetailRow items={[
        { label: "Shares",     value: share.sharesOwned.toString() },
        { label: "Avg Price",  value: fmtCurrency(share.avgBuyPrice, share.currency) },
        { label: "P&L",        value: `${pl >= 0 ? "+" : ""}${fmtCurrency(pl, share.currency)} (${plPct >= 0 ? "+" : ""}${plPct.toFixed(1)}%)` },
        { label: "Div. Yield", value: `${share.dividendYield}%` },
      ]} />
    </CardShell>
  );
}

function ETFCard({ etf, onRemove, onSetStartPoint }: {
  etf: ETF; onRemove: () => void; onSetStartPoint: (sp: StartPoint | undefined) => void;
}) {
  const totalValue = etf.unitsOwned * etf.currentPrice;
  const pl         = (etf.currentPrice - etf.avgBuyPrice) * etf.unitsOwned;
  const plPct      = etf.avgBuyPrice > 0 ? ((etf.currentPrice - etf.avgBuyPrice) / etf.avgBuyPrice) * 100 : 0;

  return (
    <CardShell
      badge={etf.provider} badgeBg="bg-violet-50 text-violet-700"
      title={etf.ticker} subtitle={etf.name}
      totalValue={totalValue} currency={etf.currency}
      currentUnitPrice={etf.currentPrice}
      history={etf.history} startPoint={etf.startPoint}
      quantityLabel="Units at that date" defaultQuantity={etf.unitsOwned}
      onRemove={onRemove} onSetStartPoint={onSetStartPoint}
    >
      <DetailRow items={[
        { label: "Units",     value: etf.unitsOwned.toString() },
        { label: "Avg Price", value: fmtCurrency(etf.avgBuyPrice, etf.currency) },
        { label: "P&L",       value: `${pl >= 0 ? "+" : ""}${fmtCurrency(pl, etf.currency)} (${plPct >= 0 ? "+" : ""}${plPct.toFixed(1)}%)` },
        { label: "TER",       value: `${etf.ter}%` },
        { label: "Index",     value: etf.indexTracked },
      ]} />
    </CardShell>
  );
}

function BondCard({ bond, onRemove, onSetStartPoint }: {
  bond: Bond; onRemove: () => void; onSetStartPoint: (sp: StartPoint | undefined) => void;
}) {
  const totalValue     = (bond.currentPrice / 100) * bond.faceValue * bond.quantity;
  const daysToMaturity = Math.max(0, Math.floor((new Date(bond.maturityDate).getTime() - Date.now()) / 86400000));
  const yearsLeft      = (daysToMaturity / 365).toFixed(1);
  const ytm            = (bond.couponRate / bond.currentPrice * 100).toFixed(2);

  return (
    <CardShell
      badge={bond.rating} badgeBg="bg-emerald-50 text-emerald-700"
      title={bond.name} subtitle={bond.issuer}
      totalValue={totalValue} currency={bond.currency}
      currentUnitPrice={bond.currentPrice}
      history={bond.history} startPoint={bond.startPoint}
      quantityLabel="Quantity at that date" defaultQuantity={bond.quantity}
      onRemove={onRemove} onSetStartPoint={onSetStartPoint}
    >
      <DetailRow items={[
        { label: "Qty",      value: bond.quantity.toString() },
        { label: "Coupon",   value: `${bond.couponRate}%` },
        { label: "Price",    value: `${bond.currentPrice}% of par` },
        { label: "YTM",      value: `~${ytm}%` },
        { label: "Maturity", value: `${bond.maturityDate} (${yearsLeft}y)` },
      ]} />
    </CardShell>
  );
}

function MetalCard({ metal, onRemove, onSetStartPoint }: {
  metal: Metal; onRemove: () => void; onSetStartPoint: (sp: StartPoint | undefined) => void;
}) {
  const totalValue = metal.weight * metal.currentUnitPrice;
  const color      = METAL_COLORS[metal.metal];

  return (
    <CardShell
      badge={METAL_LABELS[metal.metal]} badgeBg=""
      title={metal.name} subtitle={`${metal.weight} ${metal.unit} · Purity ${metal.purity}`}
      totalValue={totalValue} currency={metal.currency}
      currentUnitPrice={metal.currentUnitPrice}
      history={metal.history} startPoint={metal.startPoint}
      quantityLabel={`Weight at that date (${metal.unit})`} defaultQuantity={metal.weight}
      onRemove={onRemove} onSetStartPoint={onSetStartPoint}
    >
      <div className="px-4 pb-3 border-t border-gray-50 pt-2.5 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div>
            <p className="text-xs text-gray-400">Unit Price</p>
            <p className="text-xs text-gray-700 tabular-nums">{fmtCurrency(metal.currentUnitPrice, metal.currency)}/{metal.unit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Weight</p>
            <p className="text-xs text-gray-700 tabular-nums">{metal.weight} {metal.unit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Purity</p>
            <p className="text-xs text-gray-700">{metal.purity}</p>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function SummaryBar({ count, history }: { count: number; history: HistoryPoint[][] }) {
  const gains    = history.filter(h => weeklyChange(h).isUp).length;
  const losses   = history.length - gains;
  const bestPct  = history.length > 0 ? Math.max(...history.map(h => weeklyChange(h).pct)) : 0;
  const worstPct = history.length > 0 ? Math.min(...history.map(h => weeklyChange(h).pct)) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 flex items-center gap-8 flex-wrap">
      <div>
        <p className="text-xs text-gray-400">Positions</p>
        <p className="text-lg text-gray-900 tabular-nums">{count}</p>
      </div>
      <div className="w-px h-8 bg-gray-100" />
      <div>
        <p className="text-xs text-gray-400">Gaining (1W)</p>
        <p className="text-sm text-green-600 tabular-nums">{gains} ▲</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Losing (1W)</p>
        <p className="text-sm text-red-500 tabular-nums">{losses} ▼</p>
      </div>
      {history.length > 0 && (
        <>
          <div className="w-px h-8 bg-gray-100" />
          <div>
            <p className="text-xs text-gray-400">Best (1W)</p>
            <p className="text-sm text-green-600 tabular-nums">+{bestPct.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Worst (1W)</p>
            <p className="text-sm text-red-500 tabular-nums">{worstPct.toFixed(2)}%</p>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", options, placeholder }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; options?: string[]; placeholder?: string;
}) {
  const base = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {options ? (
        <div className="relative">
          <select value={value} onChange={e => onChange(e.target.value)} className={`${base} appearance-none pr-7`}>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={base} />
      )}
    </div>
  );
}

const SECTORS   = ["Technology","Finance","Healthcare","Consumer","Energy","Industrial","Materials","Utilities","Real Estate","Communication","Gaming"];
const EXCHANGES = ["NYSE","NASDAQ","LSE","WSE","XETRA","Euronext","TSX","ASX"];
const CURRENCIES = ["USD","EUR","GBP","PLN","CHF","CAD","AUD","JPY"];
const RATINGS   = ["AAA","AA+","AA","AA-","A+","A","A-","BBB+","BBB","BBB-","BB+","BB","B+","B","B-"];
const METALS_OPT = ["gold","silver","platinum","copper"];
const UNITS_OPT  = ["oz","g","kg"];

function ModalShell({ title, onClose, onSubmit, children }: {
  title: string; onClose: () => void; onSubmit: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <h3 className="text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={onSubmit} className="px-5 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

function AddShareModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Omit<Share, "id" | "history">) => void }) {
  const [f, setF] = useState({ ticker: "", name: "", sector: "Technology", exchange: "NASDAQ", sharesOwned: "", avgBuyPrice: "", currentPrice: "", currency: "USD", dividendYield: "" });
  const set = (k: string) => (v: string) => setF(p => ({ ...p, [k]: v }));
  const submit = () => {
    if (!f.ticker || !f.name || !f.sharesOwned || !f.currentPrice) return;
    onAdd({ ticker: f.ticker.toUpperCase(), name: f.name, sector: f.sector, exchange: f.exchange, sharesOwned: parseFloat(f.sharesOwned) || 0, avgBuyPrice: parseFloat(f.avgBuyPrice) || 0, currentPrice: parseFloat(f.currentPrice) || 0, currency: f.currency, dividendYield: parseFloat(f.dividendYield) || 0 });
    onClose();
  };
  return (
    <ModalShell title="Add Share" onClose={onClose} onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ticker *"         value={f.ticker}        onChange={set("ticker")}        placeholder="AAPL" />
        <Field label="Currency"         value={f.currency}      onChange={set("currency")}      options={CURRENCIES} />
        <div className="col-span-2"><Field label="Company Name *" value={f.name} onChange={set("name")} placeholder="Apple Inc." /></div>
        <Field label="Sector"           value={f.sector}        onChange={set("sector")}        options={SECTORS} />
        <Field label="Exchange"         value={f.exchange}      onChange={set("exchange")}      options={EXCHANGES} />
        <Field label="Shares Owned *"   value={f.sharesOwned}   onChange={set("sharesOwned")}  type="number" placeholder="100" />
        <Field label="Avg Buy Price"    value={f.avgBuyPrice}   onChange={set("avgBuyPrice")}  type="number" placeholder="175.00" />
        <Field label="Current Price *"  value={f.currentPrice}  onChange={set("currentPrice")} type="number" placeholder="184.52" />
        <Field label="Dividend Yield %" value={f.dividendYield} onChange={set("dividendYield")} type="number" placeholder="0.52" />
      </div>
    </ModalShell>
  );
}

function AddETFModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: Omit<ETF, "id" | "history">) => void }) {
  const [f, setF] = useState({ ticker: "", name: "", indexTracked: "", provider: "", unitsOwned: "", avgBuyPrice: "", currentPrice: "", currency: "USD", ter: "" });
  const set = (k: string) => (v: string) => setF(p => ({ ...p, [k]: v }));
  const submit = () => {
    if (!f.ticker || !f.name || !f.unitsOwned || !f.currentPrice) return;
    onAdd({ ticker: f.ticker.toUpperCase(), name: f.name, indexTracked: f.indexTracked, provider: f.provider, unitsOwned: parseFloat(f.unitsOwned) || 0, avgBuyPrice: parseFloat(f.avgBuyPrice) || 0, currentPrice: parseFloat(f.currentPrice) || 0, currency: f.currency, ter: parseFloat(f.ter) || 0 });
    onClose();
  };
  return (
    <ModalShell title="Add ETF" onClose={onClose} onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ticker *"        value={f.ticker}       onChange={set("ticker")}        placeholder="SPY" />
        <Field label="Currency"        value={f.currency}     onChange={set("currency")}      options={CURRENCIES} />
        <div className="col-span-2"><Field label="Fund Name *" value={f.name} onChange={set("name")} placeholder="SPDR S&P 500 ETF Trust" /></div>
        <Field label="Index Tracked"   value={f.indexTracked} onChange={set("indexTracked")}  placeholder="S&P 500" />
        <Field label="Provider"        value={f.provider}     onChange={set("provider")}      placeholder="State Street" />
        <Field label="Units Owned *"   value={f.unitsOwned}   onChange={set("unitsOwned")}   type="number" placeholder="30" />
        <Field label="Avg Buy Price"   value={f.avgBuyPrice}  onChange={set("avgBuyPrice")}  type="number" placeholder="475.00" />
        <Field label="Current Price *" value={f.currentPrice} onChange={set("currentPrice")} type="number" placeholder="512.40" />
        <Field label="TER (%)"         value={f.ter}          onChange={set("ter")}           type="number" placeholder="0.09" />
      </div>
    </ModalShell>
  );
}

function AddBondModal({ onClose, onAdd }: { onClose: () => void; onAdd: (b: Omit<Bond, "id" | "history">) => void }) {
  const [f, setF] = useState({ name: "", issuer: "", couponRate: "", maturityDate: "", faceValue: "", currentPrice: "", quantity: "", currency: "USD", rating: "AAA" });
  const set = (k: string) => (v: string) => setF(p => ({ ...p, [k]: v }));
  const submit = () => {
    if (!f.name || !f.issuer || !f.faceValue || !f.currentPrice) return;
    onAdd({ name: f.name, issuer: f.issuer, couponRate: parseFloat(f.couponRate) || 0, maturityDate: f.maturityDate, faceValue: parseFloat(f.faceValue) || 1000, currentPrice: parseFloat(f.currentPrice) || 100, quantity: parseFloat(f.quantity) || 1, currency: f.currency, rating: f.rating });
    onClose();
  };
  return (
    <ModalShell title="Add Bond" onClose={onClose} onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Bond Name *" value={f.name} onChange={set("name")} placeholder="US Treasury 10Y" /></div>
        <div className="col-span-2"><Field label="Issuer *" value={f.issuer} onChange={set("issuer")} placeholder="US Government" /></div>
        <Field label="Coupon Rate (%)" value={f.couponRate}   onChange={set("couponRate")}  type="number" placeholder="4.25" />
        <Field label="Maturity Date"   value={f.maturityDate} onChange={set("maturityDate")} type="date" />
        <Field label="Face Value *"    value={f.faceValue}    onChange={set("faceValue")}   type="number" placeholder="1000" />
        <Field label="Current Price (% of par) *" value={f.currentPrice} onChange={set("currentPrice")} type="number" placeholder="97.50" />
        <Field label="Quantity"        value={f.quantity}     onChange={set("quantity")}    type="number" placeholder="10" />
        <Field label="Currency"        value={f.currency}     onChange={set("currency")}    options={CURRENCIES} />
        <Field label="Credit Rating"   value={f.rating}       onChange={set("rating")}      options={RATINGS} />
      </div>
    </ModalShell>
  );
}

function AddMetalModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: Omit<Metal, "id" | "history">) => void }) {
  const [f, setF] = useState({ metal: "gold" as MetalType, name: "", weight: "", unit: "oz" as WeightUnit, purity: "", currentUnitPrice: "", currency: "USD" });
  const set = (k: string) => (v: string) => setF(p => ({ ...p, [k]: v }));
  const submit = () => {
    if (!f.weight || !f.currentUnitPrice) return;
    onAdd({ metal: f.metal, name: f.name || `${METAL_LABELS[f.metal]} ${f.unit}`, weight: parseFloat(f.weight) || 0, unit: f.unit, purity: f.purity || "999.9", currentUnitPrice: parseFloat(f.currentUnitPrice) || 0, currency: f.currency });
    onClose();
  };
  return (
    <ModalShell title="Add Metal" onClose={onClose} onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Metal"            value={f.metal}            onChange={v => setF(p => ({ ...p, metal: v as MetalType }))} options={METALS_OPT} />
        <Field label="Currency"         value={f.currency}         onChange={set("currency")}         options={CURRENCIES} />
        <div className="col-span-2"><Field label="Name" value={f.name} onChange={set("name")} placeholder={`${METAL_LABELS[f.metal]} Bullion`} /></div>
        <Field label="Weight *"         value={f.weight}           onChange={set("weight")}           type="number" placeholder="10" />
        <Field label="Unit"             value={f.unit}             onChange={v => setF(p => ({ ...p, unit: v as WeightUnit }))} options={UNITS_OPT} />
        <Field label="Purity"           value={f.purity}           onChange={set("purity")}           placeholder="999.9" />
        <Field label="Price per unit *" value={f.currentUnitPrice} onChange={set("currentUnitPrice")} type="number" placeholder="2315.40" />
      </div>
    </ModalShell>
  );
}

function EmptyState({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-20 gap-4">
      <div className="p-4 bg-gray-100 rounded-2xl"><BarChart2 size={32} className="text-gray-400" /></div>
      <div className="text-center">
        <p className="text-sm text-gray-600">No {label} added yet</p>
        <p className="text-xs text-gray-400 mt-1">Click the button above to add your first position</p>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors">
        <Plus size={15} /> Add {label}
      </button>
    </div>
  );
}

type TabId = "shares" | "etfs" | "bonds" | "metals";

const TABS: { id: TabId; label: string; Icon: typeof BarChart2 }[] = [
  { id: "shares", label: "Shares",  Icon: BarChart2 },
  { id: "etfs",   label: "ETFs",    Icon: Layers    },
  { id: "bonds",  label: "Bonds",   Icon: Landmark  },
  { id: "metals", label: "Metals",  Icon: Gem       },
];

export function StockMarketPage() {
  const [activeTab, setActiveTab] = useState<TabId>("shares");
  const [showAdd,   setShowAdd]   = useState(false);

  const {
    shares, etfs, bonds, metals,
    addShare, addETF, addBond, addMetal,
    removeShare, removeETF, removeBond, removeMetal,
    setShareStartPoint, setETFStartPoint, setBondStartPoint, setMetalStartPoint,
  } = useStockMarket();

  const currentHistories = useMemo(() => {
    if (activeTab === "shares") return shares.map(s => s.history);
    if (activeTab === "etfs")   return etfs.map(e => e.history);
    if (activeTab === "bonds")  return bonds.map(b => b.history);
    return metals.map(m => m.history);
  }, [activeTab, shares, etfs, bonds, metals]);

  const count = activeTab === "shares" ? shares.length
              : activeTab === "etfs"   ? etfs.length
              : activeTab === "bonds"  ? bonds.length
              : metals.length;

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto flex flex-col gap-5">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === id ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"
                }`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={15} />
            Add {TABS.find(t => t.id === activeTab)?.label.replace(/s$/, "")}
          </button>
        </div>

        <SummaryBar count={count} history={currentHistories} />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeTab === "shares" && (
            shares.length === 0 ? <EmptyState label="Shares" onAdd={() => setShowAdd(true)} /> :
            shares.map(s => <ShareCard key={s.id} share={s} onRemove={() => removeShare(s.id)} onSetStartPoint={sp => setShareStartPoint(s.id, sp)} />)
          )}
          {activeTab === "etfs" && (
            etfs.length === 0 ? <EmptyState label="ETFs" onAdd={() => setShowAdd(true)} /> :
            etfs.map(e => <ETFCard key={e.id} etf={e} onRemove={() => removeETF(e.id)} onSetStartPoint={sp => setETFStartPoint(e.id, sp)} />)
          )}
          {activeTab === "bonds" && (
            bonds.length === 0 ? <EmptyState label="Bonds" onAdd={() => setShowAdd(true)} /> :
            bonds.map(b => <BondCard key={b.id} bond={b} onRemove={() => removeBond(b.id)} onSetStartPoint={sp => setBondStartPoint(b.id, sp)} />)
          )}
          {activeTab === "metals" && (
            metals.length === 0 ? <EmptyState label="Metals" onAdd={() => setShowAdd(true)} /> :
            metals.map(m => <MetalCard key={m.id} metal={m} onRemove={() => removeMetal(m.id)} onSetStartPoint={sp => setMetalStartPoint(m.id, sp)} />)
          )}
        </div>
      </div>

      {showAdd && activeTab === "shares" && <AddShareModal onClose={() => setShowAdd(false)} onAdd={addShare} />}
      {showAdd && activeTab === "etfs"   && <AddETFModal   onClose={() => setShowAdd(false)} onAdd={addETF}   />}
      {showAdd && activeTab === "bonds"  && <AddBondModal  onClose={() => setShowAdd(false)} onAdd={addBond}  />}
      {showAdd && activeTab === "metals" && <AddMetalModal onClose={() => setShowAdd(false)} onAdd={addMetal} />}
    </div>
  );
}
