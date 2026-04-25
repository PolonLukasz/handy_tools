"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  listDocumentsApiV1DocumentsGet,
  uploadDocumentApiV1DocumentsPost,
  deleteDocumentApiV1DocumentsDocumentIdDelete,
  getDocumentsConfigApiV1DocumentsConfigGet,
  type DocumentResponse,
} from "@/api";

export interface StoredDocument {
  id: number;
  name: string;
  extension: string;
  displayName: string;
  added: Date;
  sizeMb: number;
}

export interface UploadLimits {
  allowedExtensions: string[];
  maxUploadMb: number;
}

interface DocumentsContextType {
  documents: StoredDocument[];
  limits: UploadLimits | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  uploadDocument: (file: File) => Promise<StoredDocument>;
  removeDocuments: (ids: number[]) => Promise<void>;
}

function toStoredDocument(r: DocumentResponse): StoredDocument {
  return {
    id: r.id,
    name: r.name,
    extension: r.extension,
    displayName: r.name + r.extension,
    added: new Date(r.created_at),
    sizeMb: r.size_mb,
  };
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "detail" in error) {
    const detail = (error as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return String(detail[0]?.msg ?? "Unknown error");
    }
  }
  return "An unexpected error occurred";
}

const DocumentsContext = createContext<DocumentsContextType | null>(null);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [limits, setLimits] = useState<UploadLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const { data, error: fetchError } = await listDocumentsApiV1DocumentsGet();
    if (fetchError) {
      setError(extractErrorMessage(fetchError));
    } else if (data) {
      setDocuments(data.map(toStoredDocument));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [listResult, configResult] = await Promise.all([
        listDocumentsApiV1DocumentsGet(),
        getDocumentsConfigApiV1DocumentsConfigGet(),
      ]);
      if (cancelled) return;
      if (listResult.error) {
        setError(extractErrorMessage(listResult.error));
      } else if (listResult.data) {
        setDocuments(listResult.data.map(toStoredDocument));
      }
      if (configResult.data) {
        setLimits({
          allowedExtensions: configResult.data.allowed_extensions,
          maxUploadMb: configResult.data.max_upload_mb,
        });
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const uploadDocument = useCallback(async (file: File): Promise<StoredDocument> => {
    const { data, error: uploadError } = await uploadDocumentApiV1DocumentsPost({
      body: { file },
    });
    if (uploadError) {
      throw new Error(extractErrorMessage(uploadError));
    }
    const stored = toStoredDocument(data!);
    setDocuments((prev) => [stored, ...prev]);
    return stored;
  }, []);

  const removeDocuments = useCallback(async (ids: number[]): Promise<void> => {
    const results = await Promise.allSettled(
      ids.map((id) =>
        deleteDocumentApiV1DocumentsDocumentIdDelete({ path: { document_id: id } })
      )
    );
    const failures = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.error));
    if (failures.length > 0) {
      await refresh();
      const firstFailure = failures[0];
      const msg =
        firstFailure.status === "rejected"
          ? String(firstFailure.reason)
          : extractErrorMessage((firstFailure as PromiseFulfilledResult<{ error: unknown }>).value.error);
      throw new Error(msg);
    }
    const deletedSet = new Set(ids);
    setDocuments((prev) => prev.filter((d) => !deletedSet.has(d.id)));
  }, [refresh]);

  return (
    <DocumentsContext.Provider value={{ documents, limits, loading, error, refresh, uploadDocument, removeDocuments }}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments(): DocumentsContextType {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error("useDocuments must be used inside DocumentsProvider");
  return ctx;
}
