import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Users, 
  LogOut,
  ChevronRight,
  Settings as SettingsIcon,
  CreditCard
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function AppSidebar() {
  const [location] = useLocation();
  const { profile, isAdmin, signOut } = useAuth();
  const { state } = useSidebar();

  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/20">
        <div className="flex items-center gap-2 px-2 w-full">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            S
          </div>
          <span className="font-display font-bold text-lg truncate group-data-[collapsible=icon]:hidden">
            SaaS Boilerplate
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive("/dashboard")}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive("/admin")}
                    className="text-primary hover:text-primary"
                    tooltip="Admin Overview"
                  >
                    <Link href="/admin">
                      <ShieldCheck />
                      <span>Admin Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive("/admin/users")}
                    tooltip="User Management"
                  >
                    <Link href="/admin/users">
                      <Users />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/20 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  {profile?.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{profile?.role === 'admin' ? 'Administrator' : 'User'}</span>
                <span className="truncate text-xs">{profile?.email}</span>
              </div>
              <ChevronRight className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex w-full items-center">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/billing" className="flex w-full items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </Link>
            </DropdownMenuItem>
            <div className="my-1 h-px bg-muted" />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading SaaS Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-hidden flex flex-col min-w-0 transition-[margin]">
          <header className="flex h-16 items-center gap-4 border-b bg-background/50 px-6 backdrop-blur transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <SidebarTrigger />
            <div className="flex-1">
              {/* Breadcrumbs could go here */}
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-6">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
