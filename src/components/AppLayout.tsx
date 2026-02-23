import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen min-h-[100dvh] flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {/* Mobile header with safe area for iOS notch/status bar */}
          <div 
            className="flex items-center gap-3 px-3 sm:px-4 pb-3 border-b border-border md:hidden sticky top-0 bg-background/95 backdrop-blur-sm z-40"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <SidebarTrigger />
            <h1 className="font-serif text-base sm:text-lg font-bold gold-text">EventPro</h1>
          </div>
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
