"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { toolsList } from "@/components/tools/toolsList";

function getPageTitle(pathname: string): string {
  if (pathname === "/" || pathname === "") return "Dashboard";
  if (pathname === "/finances") return "Finances";
  if (pathname === "/documents") return "Documents";
  if (pathname === "/stock-market") return "Stock Market";
  if (pathname === "/tools") return "Tools";
  if (pathname.startsWith("/tools/")) {
    const id = pathname.replace("/tools/", "");
    const tool = toolsList.find((t) => t.id === id);
    return tool ? tool.label : "Tool";
  }
  return "HandyTools";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="w-full h-full flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={getPageTitle(pathname)} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
