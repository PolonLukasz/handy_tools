"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import {
  Upload, X, FileText, Download, Scissors, Merge,
  AlertCircle, CheckCircle2, Loader2,
  Info, Lock, Eye, EyeOff, Save,
} from "lucide-react";

type Mode = "split" | "merge" | "metadata" | "encrypt";

interface PdfFile {
  id: string;
  name: string;
  pageCount: number | null;
  buffer: ArrayBuffer;
}

interface OutputFile {
  name: string;
  url: string;
}

interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
}

const EMPTY_META: PdfMetadata = {
  title: "", author: "", subject: "", creator: "",
  producer: "", creationDate: "", modificationDate: "",
};

function makeId() { return Math.random().toString(36).slice(2); }

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function getPageCount(buffer: ArrayBuffer): Promise<number | null> {
  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch { return null; }
}

function dateToInputValue(d: Date | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function inputValueToDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function DropZone({ multiple, onFiles }: { multiple: boolean; onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf");
      if (files.length) onFiles(files);
    },
    [onFiles],
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-colors ${
        dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
      }`}
    >
      <div className="p-3 rounded-full bg-red-50 text-red-500">
        <Upload size={24} />
      </div>
      <div className="text-center">
        <p className="text-gray-700 text-sm">Drop PDF{multiple ? "s" : ""} here or click to browse</p>
        <p className="text-gray-400 text-xs mt-1">
          {multiple ? "Multiple PDF files supported" : "One PDF file · all pages will be extracted"}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function FileRow({
  pdfFile, index, total, onRemove, onMoveUp, onMoveDown,
}: {
  pdfFile: PdfFile; index: number; total: number;
  onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
      <FileText size={18} className="text-red-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate">{pdfFile.name}</p>
        <p className="text-xs text-gray-400">
          {pdfFile.pageCount !== null ? `${pdfFile.pageCount} page${pdfFile.pageCount !== 1 ? "s" : ""}` : "Reading…"}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onMoveUp}   disabled={index === 0}         className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Move up">▲</button>
        <button onClick={onMoveDown} disabled={index === total - 1} className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Move down">▼</button>
        <button onClick={onRemove}                                   className="p-1 rounded text-gray-400 hover:text-red-500 ml-1" title="Remove"><X size={16} /></button>
      </div>
    </div>
  );
}

interface EncryptModalProps {
  onClose: () => void;
  onEncrypt: (password: string) => void;
  processing: boolean;
}

function EncryptModal({ onClose, onEncrypt, processing }: EncryptModalProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleSubmit = () => {
    if (!password) { setValidationError("Please enter a password."); return; }
    if (password.length < 4) { setValidationError("Password must be at least 4 characters."); return; }
    if (password !== confirm) { setValidationError("Passwords do not match."); return; }
    setValidationError("");
    onEncrypt(password);
  };

  const inputBase = "flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400";
  const wrapBase = "flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-red-400 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-50 rounded-lg">
              <Lock size={15} className="text-red-500" />
            </div>
            <h3 className="text-gray-900 text-sm">Encrypt PDF</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-xs text-gray-400">
            Set a password to protect this PDF. The encrypted file will be saved as a new document.
          </p>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Password</label>
            <div className={wrapBase}>
              <Lock size={14} className="text-gray-400 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setValidationError(""); }}
                placeholder="Enter password…"
                className={inputBase}
                autoFocus
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Confirm Password</label>
            <div className={wrapBase}>
              <Lock size={14} className="text-gray-400 shrink-0" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setValidationError(""); }}
                placeholder="Re-enter password…"
                className={inputBase}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {validationError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="shrink-0" />
              {validationError}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing}
            className="px-5 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {processing
              ? <><Loader2 size={14} className="animate-spin" /> Encrypting…</>
              : <><Lock size={14} /> Encrypt & Save</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

interface MetadataFormProps {
  meta: PdfMetadata;
  onChange: (meta: PdfMetadata) => void;
}

function MetadataForm({ meta, onChange }: MetadataFormProps) {
  const inputBase = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white placeholder-gray-400";

  const set = (key: keyof PdfMetadata) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...meta, [key]: e.target.value });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Title</label>
          <input className={inputBase} value={meta.title}   onChange={set("title")}   placeholder="Document title" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Author</label>
          <input className={inputBase} value={meta.author}  onChange={set("author")}  placeholder="Author name" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1.5">Subject</label>
          <input className={inputBase} value={meta.subject} onChange={set("subject")} placeholder="Document subject" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Creator</label>
          <input className={inputBase} value={meta.creator} onChange={set("creator")} placeholder="Creator application" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Producer</label>
          <input className={inputBase} value={meta.producer} onChange={set("producer")} placeholder="Producer application" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Creation Date</label>
          <input type="datetime-local" className={inputBase} value={meta.creationDate} onChange={set("creationDate")} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Modification Date</label>
          <input type="datetime-local" className={inputBase} value={meta.modificationDate} onChange={set("modificationDate")} />
        </div>
      </div>
    </div>
  );
}

const MODES: { id: Mode; label: string; Icon: React.ElementType }[] = [
  { id: "split",    label: "Split",         Icon: Scissors },
  { id: "merge",    label: "Merge",         Icon: Merge    },
  { id: "metadata", label: "Edit Metadata", Icon: Info     },
  { id: "encrypt",  label: "Encrypt",       Icon: Lock     },
];

export function PdfConverter() {
  const [mode,        setMode]        = useState<Mode>("split");
  const [files,       setFiles]       = useState<PdfFile[]>([]);
  const [outputs,     setOutputs]     = useState<OutputFile[]>([]);
  const [processing,  setProcessing]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const [meta,       setMeta]       = useState<PdfMetadata>(EMPTY_META);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);

  const [showEncryptModal, setShowEncryptModal] = useState(false);

  const clearOutputs = () => {
    outputs.forEach((o) => URL.revokeObjectURL(o.url));
    setOutputs([]);
  };

  useEffect(() => {
    if (mode !== "metadata" || files.length === 0) {
      setMeta(EMPTY_META);
      setMetaLoaded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const doc = await PDFDocument.load(files[0].buffer, { ignoreEncryption: true });
        if (cancelled) return;
        setMeta({
          title:            doc.getTitle()            ?? "",
          author:           doc.getAuthor()           ?? "",
          subject:          doc.getSubject()          ?? "",
          creator:          doc.getCreator()          ?? "",
          producer:         doc.getProducer()         ?? "",
          creationDate:     dateToInputValue(doc.getCreationDate()),
          modificationDate: dateToInputValue(doc.getModificationDate()),
        });
        setMetaLoaded(true);
      } catch {
        if (!cancelled) setError("Could not read metadata from this PDF.");
      }
    })();
    return () => { cancelled = true; };
  }, [files, mode]);

  const handleUploadFiles = useCallback(
    async (rawFiles: File[]) => {
      setError(null);
      clearOutputs();
      const entries: PdfFile[] = await Promise.all(
        rawFiles.map(async (file) => {
          const buffer    = await readFileAsArrayBuffer(file);
          const pageCount = await getPageCount(buffer);
          return { id: makeId(), name: file.name, pageCount, buffer };
        }),
      );
      const isSingle = mode === "split" || mode === "metadata" || mode === "encrypt";
      if (isSingle) setFiles([entries[0]]);
      else setFiles((prev) => [...prev, ...entries]);
    },
    [mode],
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    clearOutputs();
    setError(null);
    setMetaLoaded(false);
    setMeta(EMPTY_META);
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    setFiles((prev) => {
      const arr    = [...prev];
      const target = index + direction;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setFiles([]);
    clearOutputs();
    setError(null);
    setMeta(EMPTY_META);
    setMetaLoaded(false);
  };

  const handleSplit = async () => {
    if (!files[0]) return;
    setProcessing(true); setError(null); clearOutputs();
    try {
      const srcDoc    = await PDFDocument.load(files[0].buffer);
      const pageCount = srcDoc.getPageCount();
      const baseName  = files[0].name.replace(/\.pdf$/i, "");
      const results: OutputFile[] = [];
      for (let i = 0; i < pageCount; i++) {
        const newDoc  = await PDFDocument.create();
        const [page]  = await newDoc.copyPages(srcDoc, [i]);
        newDoc.addPage(page);
        const bytes = await newDoc.save();
        const blob  = new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
        results.push({ name: `${baseName}_page_${i + 1}.pdf`, url: URL.createObjectURL(blob) });
      }
      setOutputs(results);
    } catch { setError("Failed to split PDF. Make sure the file is a valid, non-encrypted PDF."); }
    finally   { setProcessing(false); }
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true); setError(null); clearOutputs();
    try {
      const mergedDoc = await PDFDocument.create();
      for (const pdfFile of files) {
        const doc   = await PDFDocument.load(pdfFile.buffer);
        const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => mergedDoc.addPage(p));
      }
      const bytes = await mergedDoc.save();
      const blob  = new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
      setOutputs([{ name: "merged.pdf", url: URL.createObjectURL(blob) }]);
    } catch { setError("Failed to merge PDFs. Make sure all files are valid, non-encrypted PDFs."); }
    finally   { setProcessing(false); }
  };

  const handleSaveMetadata = async () => {
    if (!files[0]) return;
    setMetaSaving(true); setError(null); clearOutputs();
    try {
      const doc = await PDFDocument.load(files[0].buffer, { ignoreEncryption: true });
      if (meta.title)   doc.setTitle(meta.title);
      if (meta.author)  doc.setAuthor(meta.author);
      if (meta.subject) doc.setSubject(meta.subject);
      if (meta.creator) doc.setCreator(meta.creator);
      if (meta.producer) doc.setProducer(meta.producer);
      const creationD = inputValueToDate(meta.creationDate);
      const modD      = inputValueToDate(meta.modificationDate);
      if (creationD) doc.setCreationDate(creationD);
      if (modD)      doc.setModificationDate(modD);

      const bytes    = await doc.save();
      const blob     = new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
      const baseName = files[0].name.replace(/\.pdf$/i, "");
      setOutputs([{ name: `${baseName}_edited_metadata.pdf`, url: URL.createObjectURL(blob) }]);
    } catch { setError("Failed to save metadata. The PDF might be encrypted or corrupted."); }
    finally   { setMetaSaving(false); }
  };

  const handleEncrypt = async (password: string) => {
    if (!files[0]) return;
    setProcessing(true); setError(null); clearOutputs();
    try {
      const doc      = await PDFDocument.load(files[0].buffer, { ignoreEncryption: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bytes    = await (doc as any).save({ userPassword: password, ownerPassword: password });
      const blob     = new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
      const baseName = files[0].name.replace(/\.pdf$/i, "");
      setOutputs([{ name: `${baseName}_encrypted.pdf`, url: URL.createObjectURL(blob) }]);
      setShowEncryptModal(false);
    } catch { setError("Failed to encrypt PDF. The file might be corrupted."); }
    finally   { setProcessing(false); }
  };

  const canProcess = !processing && (mode === "split" ? files.length === 1 : files.length >= 2);
  const canAddMore = mode === "merge" || files.length === 0;

  return (
    <div className="h-full overflow-auto bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-5">

        <div className="flex flex-wrap gap-2 bg-white border border-gray-200 rounded-xl p-1.5 self-start">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => switchMode(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                mode === id ? "bg-red-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          {mode === "split"    && <p className="text-sm text-gray-500">Select or upload a single PDF and it will be split into individual files — one per page — ready to download.</p>}
          {mode === "merge"    && <p className="text-sm text-gray-500">Upload two or more PDF files. They will be merged in the order shown below.</p>}
          {mode === "metadata" && <p className="text-sm text-gray-500">Upload a PDF to load and edit its metadata — title, author, subject, and more. Saved as a new file.</p>}
          {mode === "encrypt"  && <p className="text-sm text-gray-500">Upload a PDF and protect it with a password. The encrypted copy will be saved as a new file.</p>}
        </div>

        {canAddMore && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <DropZone multiple={mode === "merge"} onFiles={handleUploadFiles} />
          </div>
        )}

        {files.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {mode === "split"    ? "Selected file"
                : mode === "merge"   ? `Files to merge (${files.length})`
                : mode === "metadata"? "Selected file"
                :                      "Selected file"}
              </p>
            </div>
            {files.map((f, i) => (
              <FileRow
                key={f.id} pdfFile={f} index={i} total={files.length}
                onRemove={() => removeFile(f.id)}
                onMoveUp={() => moveFile(i, -1)}
                onMoveDown={() => moveFile(i, 1)}
              />
            ))}
          </div>
        )}

        {mode === "metadata" && files.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Info size={16} className="text-red-500" />
              <span className="text-sm text-gray-700">
                {metaLoaded ? "Edit Metadata" : "Loading metadata…"}
              </span>
              {!metaLoaded && <Loader2 size={14} className="animate-spin text-gray-400 ml-auto" />}
            </div>

            {metaLoaded && (
              <>
                <MetadataForm meta={meta} onChange={setMeta} />
                <button
                  onClick={handleSaveMetadata}
                  disabled={metaSaving}
                  className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 text-sm transition-colors mt-1"
                >
                  {metaSaving
                    ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                    : <><Save size={16} /> Save as New File</>
                  }
                </button>
              </>
            )}
          </div>
        )}

        {mode === "encrypt" && files.length > 0 && (
          <button
            onClick={() => setShowEncryptModal(true)}
            disabled={processing}
            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 text-sm transition-colors"
          >
            {processing
              ? <><Loader2 size={17} className="animate-spin" /> Encrypting…</>
              : <><Lock size={17} /> Set Password & Encrypt…</>
            }
          </button>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {(mode === "split" || mode === "merge") && files.length > 0 && (
          <button
            onClick={mode === "split" ? handleSplit : handleMerge}
            disabled={!canProcess}
            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 text-sm transition-colors"
          >
            {processing ? (
              <><Loader2 size={17} className="animate-spin" /> Processing…</>
            ) : mode === "split" ? (
              <><Scissors size={17} /> Split PDF</>
            ) : (
              <><Merge size={17} /> Merge PDFs</>
            )}
          </button>
        )}

        {outputs.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle2 size={18} />
              <span className="text-sm">
                {outputs.length === 1 ? "File ready to download" : `${outputs.length} files ready to download`}
              </span>
            </div>
            {outputs.map((out, i) => (
              <a
                key={i}
                href={out.url}
                download={out.name}
                className="flex items-center gap-3 border border-gray-200 hover:border-red-300 hover:bg-red-50 rounded-lg px-4 py-3 transition-colors group"
              >
                <FileText size={18} className="text-red-500 shrink-0" />
                <span className="flex-1 text-sm text-gray-700 truncate">{out.name}</span>
                <Download size={16} className="text-gray-400 group-hover:text-red-500 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>

      {showEncryptModal && (
        <EncryptModal
          onClose={() => setShowEncryptModal(false)}
          onEncrypt={handleEncrypt}
          processing={processing}
        />
      )}
    </div>
  );
}
