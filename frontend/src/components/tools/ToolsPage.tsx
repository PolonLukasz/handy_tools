"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toolsList } from "./toolsList";
import { JsonFormatter } from "./JsonFormatter";
import { PasswordGenerator } from "./PasswordGenerator";
import { WordCounter } from "./WordCounter";
import { UnitConverter } from "./UnitConverter";
import { PdfConverter } from "./PdfConverter";

interface ToolsPageProps {
  activeTool: string | null;
}

function ToolComponent({ id }: { id: string }) {
  switch (id) {
    case "json-formatter": return <JsonFormatter />;
    case "password-gen": return <PasswordGenerator />;
    case "word-counter": return <WordCounter />;
    case "unit-converter": return <UnitConverter />;
    case "pdf-converter": return <PdfConverter />;
    default: return <div className="p-6 text-gray-500">Tool not found.</div>;
  }
}

export function ToolsPage({ activeTool }: ToolsPageProps) {
  if (activeTool) {
    const tool = toolsList.find((t) => t.id === activeTool);
    const Icon = tool?.icon;
    return (
      <div className="h-full flex flex-col overflow-hidden bg-gray-50">
        <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200 shrink-0">
          <Link
            href="/tools"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            All Tools
          </Link>
          <span className="text-gray-300">|</span>
          {Icon && (
            <div className={`p-1.5 rounded-lg ${tool?.iconBg}`}>
              <Icon size={18} />
            </div>
          )}
          <div>
            <h2 className="text-gray-900">{tool?.label}</h2>
          </div>
          {tool && (
            <span className={`ml-auto text-xs px-2.5 py-1 rounded-full ${tool.categoryColor}`}>
              {tool.category}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <ToolComponent id={activeTool} />
        </div>
      </div>
    );
  }

  const categories = Array.from(new Set(toolsList.map((t) => t.category)));

  return (
    <div className="p-6 bg-gray-50 h-full overflow-auto">
      <div className="mb-6">
        <p className="text-gray-600">Pick a tool below to get started.</p>
      </div>

      {categories.map((cat) => {
        const catTools = toolsList.filter((t) => t.category === cat);
        return (
          <div key={cat} className="mb-8">
            <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-3">{cat}</h3>
            <div className="grid grid-cols-3 gap-4">
              {catTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.id}`}
                    className="group bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-blue-400 hover:shadow-md transition-all duration-150"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg shrink-0 ${tool.iconBg} group-hover:scale-110 transition-transform`}>
                        <Icon size={22} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-gray-900 text-sm">{tool.label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${tool.categoryColor}`}>
                            {tool.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 leading-snug">{tool.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
