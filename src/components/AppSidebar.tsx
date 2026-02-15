import { LayoutDashboard, Users, Calendar, FileText, Receipt, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Events", url: "/events", icon: Calendar },
  { title: "Quotations", url: "/quotations", icon: FileText },
  { title: "Invoices", url: "/invoices", icon: Receipt },
];

export function AppSidebar() {
  const { signOut } = useAuth();

  return (
    <Sidebar className="border-r border-border">
      <div className="p-6">
        <h1 className="font-serif text-xl font-bold gold-text">EventPro</h1>
        <p className="text-xs text-muted-foreground mt-1">Management Suite</p>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      activeClassName="bg-secondary text-primary font-medium gold-border border"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
