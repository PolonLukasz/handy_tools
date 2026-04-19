"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface HistoryPoint { date: string; value: number; }

export interface StartPoint {
  date: string;
  price: number;
  quantity: number;
}

export interface Share {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  exchange: string;
  sharesOwned: number;
  avgBuyPrice: number;
  currentPrice: number;
  currency: string;
  dividendYield: number;
  history: HistoryPoint[];
  startPoint?: StartPoint;
}

export interface ETF {
  id: string;
  ticker: string;
  name: string;
  indexTracked: string;
  provider: string;
  unitsOwned: number;
  avgBuyPrice: number;
  currentPrice: number;
  currency: string;
  ter: number;
  history: HistoryPoint[];
  startPoint?: StartPoint;
}

export interface Bond {
  id: string;
  name: string;
  issuer: string;
  couponRate: number;
  maturityDate: string;
  faceValue: number;
  currentPrice: number;
  quantity: number;
  currency: string;
  rating: string;
  history: HistoryPoint[];
  startPoint?: StartPoint;
}

export type MetalType = "gold" | "silver" | "platinum" | "copper";
export type WeightUnit = "oz" | "g" | "kg";

export interface Metal {
  id: string;
  metal: MetalType;
  name: string;
  weight: number;
  unit: WeightUnit;
  purity: string;
  currentUnitPrice: number;
  currency: string;
  history: HistoryPoint[];
  startPoint?: StartPoint;
}

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1) ^ (s + Math.imul(s ^ (s >>> 7), s | 61));
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateHistory(currentPrice: number, id: string, volatility = 0.022): HistoryPoint[] {
  const seed = Array.from(id).reduce((acc, c) => Math.imul(acc, 31) + c.charCodeAt(0) | 0, 7);
  const rng = seededRng(seed);
  const WEEKS = 52;
  const endDate = new Date("2026-04-19");
  const points: HistoryPoint[] = [];
  let price = currentPrice * (0.72 + rng() * 0.46);
  for (let w = WEEKS; w >= 0; w--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - w * 7);
    const drift = (currentPrice - price) * 0.045;
    const noise = (rng() - 0.5) * currentPrice * volatility * 2;
    price = Math.max(price + drift + noise, currentPrice * 0.05);
    if (w === 0) price = currentPrice;
    points.push({ date: d.toISOString().split("T")[0], value: Math.round(price * 100) / 100 });
  }
  return points;
}

const INITIAL_SHARES: Share[] = [
  { id: "aapl", ticker: "AAPL", name: "Apple Inc.", sector: "Technology", exchange: "NASDAQ", sharesOwned: 50, avgBuyPrice: 175.00, currentPrice: 184.52, currency: "USD", dividendYield: 0.52, history: generateHistory(184.52, "aapl", 0.022), startPoint: { date: "2025-07-01", price: 162.40, quantity: 50 } },
  { id: "msft", ticker: "MSFT", name: "Microsoft Corp.", sector: "Technology", exchange: "NASDAQ", sharesOwned: 20, avgBuyPrice: 390.00, currentPrice: 418.32, currency: "USD", dividendYield: 0.73, history: generateHistory(418.32, "msft", 0.019) },
  { id: "nvda", ticker: "NVDA", name: "NVIDIA Corp.", sector: "Technology", exchange: "NASDAQ", sharesOwned: 15, avgBuyPrice: 750.00, currentPrice: 878.65, currency: "USD", dividendYield: 0.03, history: generateHistory(878.65, "nvda", 0.038), startPoint: { date: "2025-04-19", price: 685.00, quantity: 15 } },
  { id: "cdp", ticker: "CDP", name: "CDP S.A.", sector: "Gaming", exchange: "WSE", sharesOwned: 200, avgBuyPrice: 130.50, currentPrice: 148.20, currency: "PLN", dividendYield: 0.0, history: generateHistory(148.20, "cdp", 0.031) },
];

const INITIAL_ETFS: ETF[] = [
  { id: "spy", ticker: "SPY", name: "SPDR S&P 500 ETF Trust", indexTracked: "S&P 500", provider: "State Street", unitsOwned: 30, avgBuyPrice: 475.00, currentPrice: 512.40, currency: "USD", ter: 0.09, history: generateHistory(512.40, "spy", 0.016), startPoint: { date: "2025-06-15", price: 488.20, quantity: 30 } },
  { id: "vwce", ticker: "VWCE", name: "Vanguard FTSE All-World", indexTracked: "FTSE All-World", provider: "Vanguard", unitsOwned: 25, avgBuyPrice: 108.00, currentPrice: 118.24, currency: "USD", ter: 0.22, history: generateHistory(118.24, "vwce", 0.017) },
  { id: "qqq", ticker: "QQQ", name: "Invesco QQQ Trust", indexTracked: "NASDAQ-100", provider: "Invesco", unitsOwned: 18, avgBuyPrice: 415.00, currentPrice: 445.70, currency: "USD", ter: 0.20, history: generateHistory(445.70, "qqq", 0.024) },
];

const INITIAL_BONDS: Bond[] = [
  { id: "ust10", name: "US Treasury 10Y", issuer: "US Government", couponRate: 4.25, maturityDate: "2034-02-15", faceValue: 1000, currentPrice: 97.50, quantity: 10, currency: "USD", rating: "AAA", history: generateHistory(97.50, "ust10", 0.008), startPoint: { date: "2025-09-01", price: 96.10, quantity: 10 } },
  { id: "bund30", name: "German Bund 2030", issuer: "Federal Republic of Germany", couponRate: 2.30, maturityDate: "2030-08-15", faceValue: 1000, currentPrice: 94.20, quantity: 5, currency: "EUR", rating: "AAA", history: generateHistory(94.20, "bund30", 0.007) },
  { id: "pol33", name: "Poland 10Y 2033", issuer: "Republic of Poland", couponRate: 5.75, maturityDate: "2033-04-25", faceValue: 1000, currentPrice: 101.50, quantity: 20, currency: "PLN", rating: "A-", history: generateHistory(101.50, "pol33", 0.009) },
];

const INITIAL_METALS: Metal[] = [
  { id: "gold-1", metal: "gold", name: "Gold Bullion", weight: 10, unit: "oz", purity: "999.9", currentUnitPrice: 2315.40, currency: "USD", history: generateHistory(2315.40, "gold-1", 0.018), startPoint: { date: "2025-01-15", price: 2020.00, quantity: 10 } },
  { id: "silver-1", metal: "silver", name: "Silver Bars", weight: 100, unit: "oz", purity: "999", currentUnitPrice: 28.42, currency: "USD", history: generateHistory(28.42, "silver-1", 0.025) },
  { id: "platinum-1", metal: "platinum", name: "Platinum Coins", weight: 5, unit: "oz", purity: "999.5", currentUnitPrice: 978.00, currency: "USD", history: generateHistory(978.00, "platinum-1", 0.021) },
  { id: "copper-1", metal: "copper", name: "Copper Ingots", weight: 50, unit: "kg", purity: "99.9", currentUnitPrice: 9.85, currency: "USD", history: generateHistory(9.85, "copper-1", 0.015) },
];

interface StockMarketContextType {
  shares: Share[];
  etfs: ETF[];
  bonds: Bond[];
  metals: Metal[];
  addShare: (s: Omit<Share, "id" | "history">) => void;
  addETF: (e: Omit<ETF, "id" | "history">) => void;
  addBond: (b: Omit<Bond, "id" | "history">) => void;
  addMetal: (m: Omit<Metal, "id" | "history">) => void;
  removeShare: (id: string) => void;
  removeETF: (id: string) => void;
  removeBond: (id: string) => void;
  removeMetal: (id: string) => void;
  setShareStartPoint: (id: string, sp: StartPoint | undefined) => void;
  setETFStartPoint: (id: string, sp: StartPoint | undefined) => void;
  setBondStartPoint: (id: string, sp: StartPoint | undefined) => void;
  setMetalStartPoint: (id: string, sp: StartPoint | undefined) => void;
}

const StockMarketContext = createContext<StockMarketContextType | null>(null);

export function StockMarketProvider({ children }: { children: ReactNode }) {
  const [shares, setShares] = useState<Share[]>(INITIAL_SHARES);
  const [etfs, setEtfs] = useState<ETF[]>(INITIAL_ETFS);
  const [bonds, setBonds] = useState<Bond[]>(INITIAL_BONDS);
  const [metals, setMetals] = useState<Metal[]>(INITIAL_METALS);

  const mkId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const addShare = (s: Omit<Share, "id" | "history">) => { const id = mkId(); setShares(prev => [...prev, { ...s, id, history: generateHistory(s.currentPrice, id, 0.022) }]); };
  const addETF = (e: Omit<ETF, "id" | "history">) => { const id = mkId(); setEtfs(prev => [...prev, { ...e, id, history: generateHistory(e.currentPrice, id, 0.018) }]); };
  const addBond = (b: Omit<Bond, "id" | "history">) => { const id = mkId(); setBonds(prev => [...prev, { ...b, id, history: generateHistory(b.currentPrice, id, 0.008) }]); };
  const addMetal = (m: Omit<Metal, "id" | "history">) => { const id = mkId(); setMetals(prev => [...prev, { ...m, id, history: generateHistory(m.currentUnitPrice, id, 0.020) }]); };

  const removeShare = (id: string) => setShares(prev => prev.filter(x => x.id !== id));
  const removeETF = (id: string) => setEtfs(prev => prev.filter(x => x.id !== id));
  const removeBond = (id: string) => setBonds(prev => prev.filter(x => x.id !== id));
  const removeMetal = (id: string) => setMetals(prev => prev.filter(x => x.id !== id));

  const setShareStartPoint = (id: string, sp: StartPoint | undefined) => setShares(prev => prev.map(x => x.id === id ? { ...x, startPoint: sp } : x));
  const setETFStartPoint = (id: string, sp: StartPoint | undefined) => setEtfs(prev => prev.map(x => x.id === id ? { ...x, startPoint: sp } : x));
  const setBondStartPoint = (id: string, sp: StartPoint | undefined) => setBonds(prev => prev.map(x => x.id === id ? { ...x, startPoint: sp } : x));
  const setMetalStartPoint = (id: string, sp: StartPoint | undefined) => setMetals(prev => prev.map(x => x.id === id ? { ...x, startPoint: sp } : x));

  return (
    <StockMarketContext.Provider value={{ shares, etfs, bonds, metals, addShare, addETF, addBond, addMetal, removeShare, removeETF, removeBond, removeMetal, setShareStartPoint, setETFStartPoint, setBondStartPoint, setMetalStartPoint }}>
      {children}
    </StockMarketContext.Provider>
  );
}

export function useStockMarket() {
  const ctx = useContext(StockMarketContext);
  if (!ctx) throw new Error("useStockMarket must be within StockMarketProvider");
  return ctx;
}
