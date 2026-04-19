"use client";

import { useState } from "react";
import { Copy, Check, AlertCircle, Eraser } from "lucide-react";

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [indent, setIndent] = useState(2);

  const format = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const minify = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => { setInput(""); setOutput(""); setError(""); };

  return (
    <div className="p-6 h-full flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={format} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">Format</button>
        <button onClick={minify} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm">Minify</button>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Indent:
          <select value={indent} onChange={(e) => setIndent(Number(e.target.value))} className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={1}>1 space</option>
          </select>
        </label>
        <button onClick={clear} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 ml-auto">
          <Eraser size={14} /> Clear
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <AlertCircle size={16} />
          <span className="text-sm font-mono">{error}</span>
        </div>
      )}

      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        <div className="flex flex-col gap-2 min-h-0">
          <label className="text-sm text-gray-500 shrink-0">Input JSON</label>
          <textarea
            className="flex-1 border border-gray-300 rounded-lg p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-0"
            placeholder={'{\n  "key": "value"\n}'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <label className="text-sm text-gray-500">Output</label>
            {output && (
              <button onClick={copy} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <textarea
            className="flex-1 border border-gray-300 rounded-lg p-3 font-mono text-sm resize-none bg-gray-50 focus:outline-none min-h-0"
            readOnly
            value={output}
            placeholder="Formatted output will appear here..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
