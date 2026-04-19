"use client";

import { useState } from "react";
import { Search, Settings } from "lucide-react";
import { SettingsModal } from "@/components/settings/SettingsModal";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Search size={20} className="text-gray-600" />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
