"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Wrench,
  ChevronDown,
  ChevronRight,
  FileText,
  BarChart2,
} from "lucide-react";
import { toolsList } from "@/components/tools/toolsList";

const menuItems = [
  { id: "dashboard", href: "/", label: "Dashboard", icon: LayoutDashboard },
  { id: "finances", href: "/finances", label: "Finances", icon: Wallet },
  { id: "documents", href: "/documents", label: "Documents", icon: FileText },
  { id: "stock-market", href: "/stock-market", label: "Stock Market", icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const isToolsActive =
    pathname === "/tools" || pathname.startsWith("/tools/");
  const [toolsOpen, setToolsOpen] = useState(isToolsActive);

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col shrink-0">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Handy Tools</h2>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Tools section */}
        <button
          onClick={() => {
            if (!toolsOpen) {
              setToolsOpen(true);
            } else {
              setToolsOpen(false);
            }
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
            isToolsActive
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-800"
          }`}
        >
          <Wrench size={20} />
          <span className="flex-1 text-left">Tools</span>
          {toolsOpen ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>

        {toolsOpen && (
          <div className="ml-3 pl-4 border-l border-gray-700 mb-2">
            <Link
              href="/tools"
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
                pathname === "/tools"
                  ? "bg-blue-500 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              All Tools
            </Link>
            {toolsList.map((tool) => {
              const Icon = tool.icon;
              const toolHref = `/tools/${tool.id}`;
              const isActive = pathname === toolHref;
              return (
                <Link
                  key={tool.id}
                  href={toolHref}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
                >
                  <Icon size={15} />
                  <span>{tool.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </div>
  );
}
