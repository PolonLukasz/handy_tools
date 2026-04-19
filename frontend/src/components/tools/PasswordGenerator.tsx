"use client";

import { useState, useCallback } from "react";
import { Copy, Check, RefreshCw, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function generatePassword(opts: { length: number; uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean }): string {
  let charset = "";
  if (opts.uppercase) charset += UPPERCASE;
  if (opts.lowercase) charset += LOWERCASE;
  if (opts.numbers) charset += NUMBERS;
  if (opts.symbols) charset += SYMBOLS;
  if (!charset) return "";
  const arr = new Uint32Array(opts.length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join("");
}

function getStrength(password: string): { label: string; color: string; icon: React.ReactNode; bars: number } {
  if (!password) return { label: "", color: "bg-gray-200", icon: null, bars: 0 };
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-red-500", icon: <ShieldX size={16} className="text-red-500" />, bars: 1 };
  if (score <= 4) return { label: "Fair", color: "bg-yellow-400", icon: <ShieldAlert size={16} className="text-yellow-500" />, bars: 2 };
  return { label: "Strong", color: "bg-green-500", icon: <ShieldCheck size={16} className="text-green-500" />, bars: 3 };
}

export function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [password, setPassword] = useState(() => generatePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: false }));
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const generate = useCallback(() => {
    const newPass = generatePassword({ length, uppercase, lowercase, numbers, symbols });
    setPassword(newPass);
    if (newPass) setHistory((h) => [newPass, ...h].slice(0, 5));
  }, [length, uppercase, lowercase, numbers, symbols]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = getStrength(password);

  const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer select-none group">
      <div
        onClick={onChange}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300 group-hover:border-blue-400"}`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-auto">
      <div className="bg-gray-900 rounded-xl p-5 flex items-center gap-4">
        <span className="flex-1 font-mono text-xl text-white tracking-widest break-all">
          {password || <span className="text-gray-500 text-base">Select at least one character type</span>}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={generate} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors" title="Generate new password">
            <RefreshCw size={18} />
          </button>
          <button onClick={() => copy(password)} disabled={!password} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {password && (
        <div className="flex items-center gap-3">
          {strength.icon}
          <div className="flex gap-1.5">
            {[1, 2, 3].map((bar) => (
              <div key={bar} className={`h-2 w-16 rounded-full transition-colors ${bar <= strength.bars ? strength.color : "bg-gray-200"}`} />
            ))}
          </div>
          <span className="text-sm text-gray-600">{strength.label}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-700">Password Length</label>
              <span className="text-sm text-blue-600">{length} characters</span>
            </div>
            <input type="range" min={6} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-full accent-blue-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>6</span><span>64</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-700">Character Types</p>
            <Checkbox checked={uppercase} onChange={() => setUppercase((v) => !v)} label="Uppercase (A–Z)" />
            <Checkbox checked={lowercase} onChange={() => setLowercase((v) => !v)} label="Lowercase (a–z)" />
            <Checkbox checked={numbers} onChange={() => setNumbers((v) => !v)} label="Numbers (0–9)" />
            <Checkbox checked={symbols} onChange={() => setSymbols((v) => !v)} label="Symbols (!@#$%…)" />
          </div>

          <button onClick={generate} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
            <RefreshCw size={16} /> Generate Password
          </button>
        </div>

        <div>
          <p className="text-sm text-gray-700 mb-3">Recent Passwords</p>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">Generated passwords will appear here.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="font-mono text-sm text-gray-700 truncate">{p}</span>
                  <button onClick={() => copy(p)} className="text-gray-400 hover:text-gray-700 shrink-0 transition-colors" title="Copy">
                    <Copy size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
