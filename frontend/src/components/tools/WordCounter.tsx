"use client";

import { useState } from "react";
import { Eraser } from "lucide-react";

function analyze(text: string) {
  const trimmed = text.trim();
  const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const sentences = trimmed === "" ? 0 : (trimmed.match(/[.!?]+/g) || []).length;
  const paragraphs = trimmed === "" ? 0 : text.split(/\n\s*\n/).filter((p) => p.trim() !== "").length || (trimmed !== "" ? 1 : 0);
  const readingTime = Math.max(1, Math.ceil(words / 200));
  return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTime };
}

const EXAMPLE = `The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet.

Word counters are useful tools for writers, students, and content creators alike. They help track progress, meet requirements, and stay within limits.`;

function StatBox({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className={`${color} rounded-xl p-5 flex flex-col gap-1`}>
      <span className="text-3xl font-bold text-gray-900">{value}</span>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}

export function WordCounter() {
  const [text, setText] = useState("");
  const stats = analyze(text);

  return (
    <div className="p-6 h-full flex flex-col gap-5 overflow-hidden">
      <div className="grid grid-cols-6 gap-3 shrink-0">
        <StatBox value={stats.words} label="Words" color="bg-blue-50" />
        <StatBox value={stats.characters} label="Characters" color="bg-purple-50" />
        <StatBox value={stats.charactersNoSpaces} label="No Spaces" color="bg-indigo-50" />
        <StatBox value={stats.sentences} label="Sentences" color="bg-green-50" />
        <StatBox value={stats.paragraphs} label="Paragraphs" color="bg-yellow-50" />
        <StatBox value={`~${stats.readingTime} min`} label="Read Time" color="bg-pink-50" />
      </div>

      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <div className="flex items-center justify-between shrink-0">
          <label className="text-sm text-gray-500">Your text</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setText(EXAMPLE)} className="text-sm text-blue-600 hover:text-blue-700 transition-colors">Load example</button>
            <button onClick={() => setText("")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <Eraser size={14} /> Clear
            </button>
          </div>
        </div>
        <textarea
          className="flex-1 border border-gray-300 rounded-lg p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-0"
          placeholder="Start typing or paste your text here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {text.trim() && (
        <div className="shrink-0 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2">Most frequent characters</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(
              text.toLowerCase().replace(/\s/g, "").split("").reduce<Record<string, number>>((acc, c) => ({ ...acc, [c]: (acc[c] || 0) + 1 }), {})
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([char, count]) => (
                <div key={char} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-md px-2.5 py-1">
                  <span className="font-mono text-sm text-gray-800">{char}</span>
                  <span className="text-xs text-gray-400">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
