"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface StoredDocument {
  id: string;
  name: string;
  added: Date;
  sizeMb: number;
  pages: number;
  buffer: ArrayBuffer | null;
}

interface DocumentsContextType {
  documents: StoredDocument[];
  addDocuments: (docs: StoredDocument[]) => void;
  removeDocuments: (ids: string[]) => void;
}

const SEED_DOCS: StoredDocument[] = [
  { id: "1", name: "Q1 Financial Report.pdf", added: new Date("2026-03-15T09:24:00"), sizeMb: 3.2, pages: 18, buffer: null },
  { id: "2", name: "Project Proposal v2.pdf", added: new Date("2026-03-22T14:05:00"), sizeMb: 1.8, pages: 9, buffer: null },
  { id: "3", name: "Employee Handbook 2026.pdf", added: new Date("2026-02-10T11:00:00"), sizeMb: 5.4, pages: 42, buffer: null },
  { id: "4", name: "Design System Guidelines.pdf", added: new Date("2026-04-01T08:30:00"), sizeMb: 7.1, pages: 56, buffer: null },
  { id: "5", name: "Meeting Notes - March.pdf", added: new Date("2026-03-31T16:45:00"), sizeMb: 0.6, pages: 4, buffer: null },
  { id: "6", name: "Infrastructure Audit.pdf", added: new Date("2026-01-20T10:15:00"), sizeMb: 4.9, pages: 31, buffer: null },
  { id: "7", name: "Marketing Strategy 2026.pdf", added: new Date("2026-02-28T13:20:00"), sizeMb: 2.3, pages: 15, buffer: null },
  { id: "8", name: "Legal Agreement - NDA.pdf", added: new Date("2026-04-05T09:00:00"), sizeMb: 0.4, pages: 3, buffer: null },
  { id: "9", name: "Annual Budget Overview.pdf", added: new Date("2026-03-05T17:10:00"), sizeMb: 2.9, pages: 22, buffer: null },
  { id: "10", name: "User Research Summary.pdf", added: new Date("2026-04-10T12:00:00"), sizeMb: 1.1, pages: 8, buffer: null },
  { id: "11", name: "Tech Stack Evaluation.pdf", added: new Date("2026-03-18T15:30:00"), sizeMb: 3.7, pages: 26, buffer: null },
  { id: "12", name: "Onboarding Checklist.pdf", added: new Date("2026-04-14T08:00:00"), sizeMb: 0.3, pages: 2, buffer: null },
];

const DocumentsContext = createContext<DocumentsContextType | null>(null);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<StoredDocument[]>(SEED_DOCS);

  const addDocuments = useCallback((docs: StoredDocument[]) => {
    setDocuments((prev) => {
      const existingIds = new Set(prev.map((d) => d.id));
      const fresh = docs.filter((d) => !existingIds.has(d.id));
      return [...prev, ...fresh];
    });
  }, []);

  const removeDocuments = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setDocuments((prev) => prev.filter((d) => !set.has(d.id)));
  }, []);

  return (
    <DocumentsContext.Provider value={{ documents, addDocuments, removeDocuments }}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments(): DocumentsContextType {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error("useDocuments must be used inside DocumentsProvider");
  return ctx;
}
