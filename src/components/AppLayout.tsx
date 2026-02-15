import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center gap-4 p-4 border-b border-border md:hidden">
            <SidebarTrigger />
            <h1 className="font-serif text-lg font-bold gold-text">EventPro</h1>
          </div>
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
