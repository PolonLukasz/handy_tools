"use client";

import { useState, useMemo, useRef } from "react";
import {
  FileText, Download, Trash2, X, AlertTriangle, CheckSquare,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import { useDocuments, type StoredDocument } from "@/context/DocumentsContext";

type SortKey = keyof Omit<StoredDocument, "id" | "buffer">;
type SortDir = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

function formatDate(d: Date): string {
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

function sortDocs(docs: StoredDocument[], key: SortKey, dir: SortDir): StoredDocument[] {
  return [...docs].sort((a, b) => {
    let cmp = 0;
    if (key === "name") cmp = a.name.localeCompare(b.name);
    else if (key === "added") cmp = a.added.getTime() - b.added.getTime();
    else if (key === "sizeMb") cmp = a.sizeMb - b.sizeMb;
    else if (key === "pages") cmp = a.pages - b.pages;
    return dir === "asc" ? cmp : -cmp;
  });
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-amber-50 text-amber-500 shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-sm text-white transition-colors ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionBar({ count, onDownload, onDelete, onClear }: { count: number; onDownload: () => void; onDelete: () => void; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-4 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg">
      <CheckSquare size={18} className="shrink-0" />
      <span className="text-sm flex-1">{count} document{count !== 1 ? "s" : ""} selected</span>
      <button onClick={onDownload} className="flex items-center gap-1.5 text-sm bg-white/15 hover:bg-white/25 px-4 py-1.5 rounded-lg transition-colors">
        <Download size={15} /> Download
      </button>
      <button onClick={onDelete} className="flex items-center gap-1.5 text-sm bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-lg transition-colors">
        <Trash2 size={15} /> Delete
      </button>
      <button onClick={onClear} className="text-white/60 hover:text-white ml-1">
        <X size={18} />
      </button>
    </div>
  );
}

interface ColHeaderProps {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: SortDir;
  align?: "left" | "right";
  onClick: (key: SortKey) => void;
}

function ColHeader({ label, sortKey, active, dir, align = "left", onClick }: ColHeaderProps) {
  const isActive = active === sortKey;
  const Icon = isActive ? (dir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th className={`px-4 py-3 text-xs text-gray-500 uppercase tracking-wide whitespace-nowrap select-none ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        onClick={() => onClick(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-gray-800 transition-colors ${isActive ? "text-blue-600" : ""} ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        <Icon size={13} className={isActive ? "text-blue-500" : "text-gray-400"} />
      </button>
    </th>
  );
}

export function DocumentsPage() {
  const { documents, removeDocuments } = useDocuments();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<"download" | "delete" | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("added");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const sortedDocs = useMemo(() => sortDocs(documents, sortKey, sortDir), [documents, sortKey, sortDir]);
  const totalPages = Math.max(1, Math.ceil(sortedDocs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageDocs = useMemo(() => sortedDocs.slice((safePage - 1) * pageSize, safePage * pageSize), [sortedDocs, safePage, pageSize]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const pageIds = pageDocs.map((d) => d.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePageSelected = pageIds.some((id) => selected.has(id)) && !allPageSelected;

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteConfirm = () => {
    removeDocuments(Array.from(selected));
    setSelected(new Set());
    setPage(1);
    setConfirmDialog(null);
  };

  const selectedNames = documents.filter((d) => selected.has(d.id)).map((d) => d.name);

  const dialogMessage = (action: "download" | "delete") => {
    const names = selectedNames.slice(0, 3).map((n) => `"${n}"`).join(", ");
    const extra = selectedNames.length > 3 ? ` and ${selectedNames.length - 3} more` : "";
    if (action === "download")
      return `You are about to download ${selectedNames.length} file${selectedNames.length !== 1 ? "s" : ""}: ${names}${extra}.`;
    return `This will permanently delete ${selectedNames.length} file${selectedNames.length !== 1 ? "s" : ""}: ${names}${extra}. This action cannot be undone.`;
  };

  const pageButtons = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className={`px-6 transition-all duration-200 ${selected.size > 0 ? "pt-4 pb-0" : "h-0 overflow-hidden"}`}>
        <ActionBar
          count={selected.size}
          onDownload={() => setConfirmDialog("download")}
          onDelete={() => setConfirmDialog("delete")}
          onClear={() => setSelected(new Set())}
        />
      </div>

      <div className="flex-1 overflow-auto p-6 pb-0">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    ref={(el) => { if (el) el.indeterminate = somePageSelected; }}
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-600"
                  />
                </th>
                <ColHeader label="Name" sortKey="name" active={sortKey} dir={sortDir} onClick={handleSort} />
                <ColHeader label="Added" sortKey="added" active={sortKey} dir={sortDir} onClick={handleSort} />
                <ColHeader label="Size (MB)" sortKey="sizeMb" active={sortKey} dir={sortDir} align="right" onClick={handleSort} />
                <ColHeader label="Pages" sortKey="pages" active={sortKey} dir={sortDir} align="right" onClick={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageDocs.map((doc) => {
                const isSelected = selected.has(doc.id);
                return (
                  <tr key={doc.id} onClick={() => toggleOne(doc.id)} className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleOne(doc.id)} className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-600" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-red-50 text-red-500 shrink-0"><FileText size={16} /></div>
                        <div className="min-w-0">
                          <span className={`truncate block max-w-xs ${isSelected ? "text-blue-700" : "text-gray-800"}`}>{doc.name}</span>
                          {doc.buffer && <span className="text-xs text-green-600">Uploaded</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(doc.added)}</td>
                    <td className="px-4 py-3.5 text-gray-600 text-right">{doc.sizeMb.toFixed(1)}</td>
                    <td className="px-4 py-3.5 text-gray-600 text-right">{doc.pages}</td>
                  </tr>
                );
              })}
              {documents.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-gray-400 text-sm">No documents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-6 py-4 flex items-center justify-between gap-4 bg-gray-50 border-t border-gray-200 shrink-0">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>
            {documents.length === 0
              ? "No documents"
              : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, sortedDocs.length)} of ${sortedDocs.length}`}
          </span>
          <span className="text-gray-300">|</span>
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">‹</button>
          {pageButtons().map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 py-1 text-gray-400 text-sm select-none">…</span>
            ) : (
              <button key={p} onClick={() => setPage(p as number)} className={`w-8 h-8 rounded-lg text-sm transition-colors ${safePage === p ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-200"}`}>{p}</button>
            ),
          )}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">›</button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog === "download"}
        title="Download documents?"
        message={dialogMessage("download")}
        confirmLabel="Download"
        confirmClass="bg-blue-600 hover:bg-blue-700"
        onConfirm={() => { setConfirmDialog(null); setSelected(new Set()); }}
        onCancel={() => setConfirmDialog(null)}
      />
      <ConfirmDialog
        open={confirmDialog === "delete"}
        title="Delete documents?"
        message={dialogMessage("delete")}
        confirmLabel="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
