"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";

type Category = "length" | "weight" | "temperature";

interface UnitDef {
  label: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

const UNITS: Record<Category, Record<string, UnitDef>> = {
  length: {
    mm: { label: "Millimeter (mm)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    cm: { label: "Centimeter (cm)", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    m:  { label: "Meter (m)", toBase: (v) => v, fromBase: (v) => v },
    km: { label: "Kilometer (km)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    in: { label: "Inch (in)", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    ft: { label: "Foot (ft)", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    yd: { label: "Yard (yd)", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
    mi: { label: "Mile (mi)", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
  },
  weight: {
    mg: { label: "Milligram (mg)", toBase: (v) => v / 1_000_000, fromBase: (v) => v * 1_000_000 },
    g:  { label: "Gram (g)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    kg: { label: "Kilogram (kg)", toBase: (v) => v, fromBase: (v) => v },
    t:  { label: "Tonne (t)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    oz: { label: "Ounce (oz)", toBase: (v) => v * 0.028349, fromBase: (v) => v / 0.028349 },
    lb: { label: "Pound (lb)", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
  },
  temperature: {
    c: { label: "Celsius (°C)", toBase: (v) => v, fromBase: (v) => v },
    f: { label: "Fahrenheit (°F)", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
    k: { label: "Kelvin (K)", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  },
};

const CATEGORY_LABELS: Record<Category, string> = { length: "Length", weight: "Weight", temperature: "Temperature" };
const DEFAULT_FROM: Record<Category, string> = { length: "m", weight: "kg", temperature: "c" };
const DEFAULT_TO: Record<Category, string> = { length: "ft", weight: "lb", temperature: "f" };

function formatResult(n: number): string {
  if (!isFinite(n)) return "Invalid";
  if (Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-4 && n !== 0)) return n.toExponential(6);
  return parseFloat(n.toPrecision(10)).toString();
}

export function UnitConverter() {
  const [category, setCategory] = useState<Category>("length");
  const [fromUnit, setFromUnit] = useState(DEFAULT_FROM.length);
  const [toUnit, setToUnit] = useState(DEFAULT_TO.length);
  const [inputValue, setInputValue] = useState("1");

  const changeCategory = (cat: Category) => {
    setCategory(cat);
    setFromUnit(DEFAULT_FROM[cat]);
    setToUnit(DEFAULT_TO[cat]);
    setInputValue("1");
  };

  const swap = () => { setFromUnit(toUnit); setToUnit(fromUnit); };

  const units = UNITS[category];
  const unitKeys = Object.keys(units);

  const convert = (): string => {
    const num = parseFloat(inputValue);
    if (isNaN(num)) return "—";
    return formatResult(units[toUnit].fromBase(units[fromUnit].toBase(num)));
  };

  const result = convert();

  const quickRef = unitKeys
    .filter((k) => k !== fromUnit)
    .map((k) => ({
      key: k,
      label: units[k].label,
      value: formatResult(units[k].fromBase(units[fromUnit].toBase(1))),
    }));

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-auto">
      <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <button key={cat} onClick={() => changeCategory(cat)} className={`px-5 py-2 rounded-md text-sm transition-colors ${category === cat ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-500">From</label>
            <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {unitKeys.map((k) => <option key={k} value={k}>{units[k].label}</option>)}
            </select>
            <input type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter value…" />
          </div>

          <button onClick={swap} className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-blue-100 hover:text-blue-600 transition-colors self-end" title="Swap units">
            <ArrowLeftRight size={18} />
          </button>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-500">To</label>
            <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {unitKeys.map((k) => <option key={k} value={k}>{units[k].label}</option>)}
            </select>
            <div className="border border-blue-200 bg-blue-50 rounded-lg px-3 py-3 text-lg text-blue-800">{result}</div>
          </div>
        </div>

        {inputValue && !isNaN(parseFloat(inputValue)) && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500 text-center">
            {inputValue} {units[fromUnit].label} = <span className="text-blue-600">{result} {units[toUnit].label}</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-3">Quick Reference — 1 {units[fromUnit].label} equals:</p>
        <div className="grid grid-cols-3 gap-3">
          {quickRef.map(({ key, label, value }) => (
            <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">{label}</span>
              <span className="font-mono text-sm text-gray-900 ml-2">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
