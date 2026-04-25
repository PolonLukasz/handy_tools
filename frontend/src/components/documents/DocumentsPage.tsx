"use client";

import { useState, useMemo, useRef } from "react";
import {
  FileText, Download, Trash2, X, AlertTriangle, CheckSquare,
  ChevronUp, ChevronDown, ChevronsUpDown, Upload, AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useDocuments, type StoredDocument } from "@/context/DocumentsContext";

type SortKey = keyof Omit<StoredDocument, "id" | "extension" | "displayName">;
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

function ActionBar({ count, onDelete, onClear }: { count: number; onDelete: () => void; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-4 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg">
      <CheckSquare size={18} className="shrink-0" />
      <span className="text-sm flex-1">{count} document{count !== 1 ? "s" : ""} selected</span>
      <button
        disabled
        title="Download coming soon"
        className="flex items-center gap-1.5 text-sm bg-white/10 px-4 py-1.5 rounded-lg opacity-40 cursor-not-allowed"
      >
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
  const { documents, limits, loading, error, refresh, uploadDocument, removeDocuments } = useDocuments();

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("added");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteConfirm = async () => {
    setDeleteError(null);
    try {
      await removeDocuments(Array.from(selected));
      setSelected(new Set());
      setPage(1);
      setConfirmDelete(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
      setConfirmDelete(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      await uploadDocument(file);
      setPage(1);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const selectedNames = documents.filter((d) => selected.has(d.id)).map((d) => d.displayName);

  const deleteMessage = () => {
    const names = selectedNames.slice(0, 3).map((n) => `"${n}"`).join(", ");
    const extra = selectedNames.length > 3 ? ` and ${selectedNames.length - 3} more` : "";
    return `This will permanently delete ${selectedNames.length} file${selectedNames.length !== 1 ? "s" : ""}: ${names}${extra}. This action cannot be undone.`;
  };

  const acceptAttr = limits ? limits.allowedExtensions.join(",") : undefined;
  const helperText = limits
    ? `${limits.allowedExtensions.map((e) => e.replace(".", "").toUpperCase()).join(", ")} up to ${limits.maxUploadMb} MB`
    : null;

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
      {/* Selection action bar */}
      <div className={`px-6 transition-all duration-200 ${selected.size > 0 ? "pt-4 pb-0" : "h-0 overflow-hidden"}`}>
        <ActionBar
          count={selected.size}
          onDelete={() => { setDeleteError(null); setConfirmDelete(true); }}
          onClear={() => setSelected(new Set())}
        />
      </div>

      {/* Upload strip */}
      <div className="px-6 pt-4 pb-2 flex items-start gap-4">
        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {uploading ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Upload size={15} />
            )}
            {uploading ? "Uploading…" : "Upload document"}
          </button>
          {helperText && (
            <p className="mt-1 text-xs text-gray-400">{helperText}</p>
          )}
          {uploadError && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {uploadError}
            </p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttr}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Delete error banner */}
      {deleteError && (
        <div className="mx-6 mb-2 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-600">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-0">
        {/* List error banner */}
        {error && (
          <div className="mb-3 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={refresh}
              className="flex items-center gap-1 text-red-600 hover:text-red-800 font-medium"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

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
                    disabled={loading || documents.length === 0}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-600 disabled:cursor-default"
                  />
                </th>
                <ColHeader label="Name" sortKey="name" active={sortKey} dir={sortDir} onClick={handleSort} />
                <ColHeader label="Added" sortKey="added" active={sortKey} dir={sortDir} onClick={handleSort} />
                <ColHeader label="Size (MB)" sortKey="sizeMb" active={sortKey} dir={sortDir} align="right" onClick={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-gray-400 text-sm">
                    Loading documents…
                  </td>
                </tr>
              ) : pageDocs.map((doc) => {
                const isSelected = selected.has(doc.id);
                return (
                  <tr key={doc.id} onClick={() => toggleOne(doc.id)} className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleOne(doc.id)} className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-600" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-red-50 text-red-500 shrink-0"><FileText size={16} /></div>
                        <span className={`truncate block max-w-xs ${isSelected ? "text-blue-700" : "text-gray-800"}`}>{doc.displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(doc.added)}</td>
                    <td className="px-4 py-3.5 text-gray-600 text-right">{doc.sizeMb.toFixed(1)}</td>
                  </tr>
                );
              })}
              {!loading && documents.length === 0 && !error && (
                <tr><td colSpan={4} className="px-4 py-16 text-center text-gray-400 text-sm">No documents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
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
        open={confirmDelete}
        title="Delete documents?"
        message={deleteMessage()}
        confirmLabel="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
