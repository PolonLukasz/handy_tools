"use client";

import { useState, useEffect } from "react";
import { X, Moon, Sun, Monitor, Download, Trash2, Check, HardDrive } from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
}

type Theme = "light" | "dark" | "system";

const THEMES: { id: Theme; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
];

interface DiskInfo {
  used: number;
  total: number;
}

function useDiskSpace(): DiskInfo | null {
  const [disk, setDisk] = useState<DiskInfo | null>(null);

  useEffect(() => {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      navigator.storage
        .estimate()
        .then(({ usage, quota }) => {
          if (usage != null && quota != null) {
            setDisk({
              used: parseFloat((usage / 1e9).toFixed(2)),
              total: parseFloat((quota / 1e9).toFixed(2)),
            });
          }
        })
        .catch(() => {
          setDisk({ used: 47.3, total: 256 });
        });
    } else {
      setDisk({ used: 47.3, total: 256 });
    }
  }, []);

  return disk;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function Row({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className="shrink-0 ml-4">{children}</div>
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-200"}`}
      style={{ width: 40, height: 22 }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform"
        style={{ transform: value ? "translateX(18px)" : "translateX(0)" }}
      />
    </button>
  );
}

function DiskBar({ used, total }: DiskInfo) {
  const pct = Math.min((used / total) * 100, 100);
  const color = pct > 85 ? "#ef4444" : pct > 65 ? "#f59e0b" : "#3b82f6";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 flex items-center gap-1.5">
          <HardDrive size={14} className="text-gray-400" /> Disk Space
        </span>
        <span className="text-gray-800 tabular-nums">
          {used} GB <span className="text-gray-400">/ {total} GB</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-gray-400 text-right">{pct.toFixed(1)}% used</p>
    </div>
  );
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [autoSave, setAutoSave] = useState(true);
  const [saved, setSaved] = useState(false);
  const disk = useDiskSpace();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <h3 className="text-gray-900">Settings</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {/* Appearance */}
          <div>
            <SectionTitle>Appearance</SectionTitle>
            <div className="flex gap-2">
              {THEMES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm transition-colors ${
                    theme === id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Data & Storage */}
          <div>
            <SectionTitle>Data & Storage</SectionTitle>
            <Row label="Auto-save" sub="Automatically save report drafts">
              <Toggle value={autoSave} onChange={setAutoSave} />
            </Row>
            <Row label="Export all data" sub="Download your data as JSON">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <Download size={13} /> Export
              </button>
            </Row>
            <Row label="Clear app cache" sub="Resets temporary storage">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 size={13} /> Clear
              </button>
            </Row>
          </div>

          {/* About */}
          <div>
            <SectionTitle>About</SectionTitle>
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">App</span>
                  <span className="text-gray-800">Handy Tools</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Version</span>
                  <span className="text-gray-800">1.0.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Build</span>
                  <span className="text-gray-400 tabular-nums">2026.04.19</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                {disk ? (
                  <DiskBar used={disk.used} total={disk.total} />
                ) : (
                  <p className="text-xs text-gray-400">Loading disk info…</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`px-5 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
              saved
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {saved ? (
              <>
                <Check size={14} /> Saved!
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
