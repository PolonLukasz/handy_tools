"use client";

import { DocumentsProvider } from "@/context/DocumentsContext";
import { FinancesProvider } from "@/context/FinancesContext";
import { StockMarketProvider } from "@/context/StockMarketContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FinancesProvider>
      <DocumentsProvider>
        <StockMarketProvider>{children}</StockMarketProvider>
      </DocumentsProvider>
    </FinancesProvider>
  );
}
