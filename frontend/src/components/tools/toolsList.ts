import type { LucideIcon } from "lucide-react";
import { Code2, Lock, AlignLeft, Ruler, FileOutput } from "lucide-react";

export interface Tool {
  id: string;
  label: string;
  icon: LucideIcon;
  category: string;
  description: string;
  categoryColor: string;
  iconBg: string;
}

export const toolsList: Tool[] = [
  {
    id: "json-formatter",
    label: "JSON Formatter",
    icon: Code2,
    category: "Developer",
    description: "Format, validate and minify JSON data with syntax highlighting.",
    categoryColor: "bg-blue-100 text-blue-700",
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    id: "password-gen",
    label: "Password Generator",
    icon: Lock,
    category: "Security",
    description: "Generate strong, secure random passwords with custom options.",
    categoryColor: "bg-green-100 text-green-700",
    iconBg: "bg-green-50 text-green-600",
  },
  {
    id: "word-counter",
    label: "Word Counter",
    icon: AlignLeft,
    category: "Text",
    description: "Count words, characters, sentences, paragraphs and estimate reading time.",
    categoryColor: "bg-purple-100 text-purple-700",
    iconBg: "bg-purple-50 text-purple-600",
  },
  {
    id: "unit-converter",
    label: "Unit Converter",
    icon: Ruler,
    category: "Math",
    description: "Convert between length, weight and temperature measurement units.",
    categoryColor: "bg-orange-100 text-orange-700",
    iconBg: "bg-orange-50 text-orange-600",
  },
  {
    id: "pdf-converter",
    label: "PDF Converter",
    icon: FileOutput,
    category: "Documents",
    description: "Split a PDF into individual pages or merge multiple PDFs into one file.",
    categoryColor: "bg-red-100 text-red-700",
    iconBg: "bg-red-50 text-red-600",
  },
];
