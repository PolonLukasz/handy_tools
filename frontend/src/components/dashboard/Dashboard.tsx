"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  FileText, ChevronRight, Code2, Ruler, FileOutput,
  TrendingUp, TrendingDown, Wallet, ArrowUpRight,
} from "lucide-react";
import { useDocuments } from "@/context/DocumentsContext";
import { useFinances, sectionsTotalPLN, fmtPLN, toPLN } from "@/context/FinancesContext";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const SECTION_COLORS = [
  "#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444",
  "#ec4899","#06b6d4","#84cc16","#f97316","#a855f7",
];

function formatDate(d: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function BalanceTile() {
  const { reports, rates } = useFinances();

  const sorted = useMemo(
    () => [...reports].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month),
    [reports],
  );

  const latest = sorted[0] ?? null;
  const prev = sorted[1] ?? null;

  const latestTotal = useMemo(() => latest ? sectionsTotalPLN(latest.sections, rates) : 0, [latest, rates]);
  const prevTotal = useMemo(() => prev ? sectionsTotalPLN(prev.sections, rates) : 0, [prev, rates]);

  const change = prevTotal > 0 ? ((latestTotal - prevTotal) / prevTotal) * 100 : 0;
  const isUp = change >= 0;
  const changeAbs = Math.abs(change);

  const sectionItems = useMemo(() => {
    if (!latest) return [];
    return latest.sections.map((s, i) => ({
      name: s.name,
      pln: toPLN(s.amount, s.currency, rates),
      color: SECTION_COLORS[i % SECTION_COLORS.length],
    }));
  }, [latest, rates]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-50">
            <Wallet size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total Balance</p>
            {latest && (
              <p className="text-xs text-gray-400 mt-0.5">
                {MONTHS_SHORT[latest.month - 1]} {latest.year}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/finances"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
        >
          View all <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="flex items-end justify-between">
        <p className="text-3xl text-gray-900 tabular-nums tracking-tight">{fmtPLN(latestTotal)}</p>
        <div className="flex items-center gap-1.5 mb-0.5">
          {isUp
            ? <TrendingUp size={14} className="text-green-500" />
            : <TrendingDown size={14} className="text-red-500" />}
          <span className={`text-xs ${isUp ? "text-green-600" : "text-red-500"}`}>
            {isUp ? "+" : "-"}{changeAbs.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400">vs {prev ? MONTHS_SHORT[prev.month - 1] : "prev"}</span>
        </div>
      </div>

      {sectionItems.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
          {sectionItems.map((s) => {
            const pct = latestTotal > 0 ? (s.pln / latestTotal) * 100 : 0;
            return (
              <div key={s.name} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-gray-500 truncate max-w-24">{s.name}</span>
                <span className="text-xs text-gray-400 tabular-nums">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      )}

      {!latest && (
        <p className="text-sm text-gray-400 text-center py-2">No reports yet</p>
      )}
    </div>
  );
}

function DocumentsTile() {
  const { documents } = useDocuments();

  const recent = useMemo(
    () => [...documents].sort((a, b) => b.added.getTime() - a.added.getTime()).slice(0, 10),
    [documents],
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50">
            <FileText size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-800">Recent Documents</p>
            <p className="text-xs text-gray-400">{documents.length} total</p>
          </div>
        </div>
        <Link
          href="/documents"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
        >
          View all <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {recent.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
            <div className="p-1.5 rounded-lg bg-red-50 shrink-0">
              <FileText size={13} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 truncate">{doc.name}</p>
              <p className="text-xs text-gray-400">{doc.pages} pages · {doc.sizeMb.toFixed(1)} MB</p>
            </div>
            <span className="text-xs text-gray-400 shrink-0 tabular-nums">{formatDate(doc.added)}</span>
          </div>
        ))}
        {recent.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            No documents yet
          </div>
        )}
      </div>
    </div>
  );
}

const PINNED_TOOLS = [
  { id: "json-formatter", label: "JSON Formatter", description: "Format, validate & minify JSON", Icon: Code2, bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100", badge: "Developer", badgeColor: "bg-blue-100 text-blue-700" },
  { id: "unit-converter", label: "Unit Converter", description: "Convert length, weight & temperature", Icon: Ruler, bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-100", badge: "Math", badgeColor: "bg-orange-100 text-orange-700" },
  { id: "pdf-converter", label: "PDF Converter", description: "Split or merge PDF files", Icon: FileOutput, bg: "bg-red-50", icon: "text-red-600", border: "border-red-100", badge: "Documents", badgeColor: "bg-red-100 text-red-700" },
];

function ToolsTile() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <p className="text-sm text-gray-800">Quick Tools</p>
        <Link
          href="/tools"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
        >
          All tools <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="flex flex-col divide-y divide-gray-50">
        {PINNED_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.id}`}
            className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left group"
          >
            <div className={`p-2.5 rounded-xl border ${tool.bg} ${tool.border} shrink-0`}>
              <tool.Icon size={18} className={tool.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm text-gray-800 group-hover:text-blue-600 transition-colors">{tool.label}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${tool.badgeColor}`}>{tool.badge}</span>
              </div>
              <p className="text-xs text-gray-400">{tool.description}</p>
            </div>
            <ChevronRight size={15} className="text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const now = new Date();
  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6 min-h-full">
        <div>
          <p className="text-gray-800">{greeting}!</p>
          <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <BalanceTile />
          <ToolsTile />
        </div>

        <DocumentsTile />
      </div>
    </div>
  );
}
