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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  LogOut,
  ChevronRight,
  Settings as SettingsIcon,
  CreditCard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { state, isMobile } = useSidebar();

  const isCollapsed = state === "collapsed" && !isMobile;
  const profileAvatarUrl = (profile as any)?.avatar_url as string | undefined;
  const avatarUrl =
    profileAvatarUrl ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.photoURL ||
    null;
  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || profile?.email || user?.email || "Utilisateur";
  const displayEmail = profile?.email || user?.email || "";
  const avatarInitials =
    (displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0])
      .join("") || displayEmail.slice(0, 2) || "U"
    ).toUpperCase();

  const isActive = (path: string) => location === path;

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center overflow-hidden transition-[width,height] ease-linear group-data-[collapsible=icon]:h-12">
        <Link href="/app" className="flex h-full w-full items-center justify-center gap-2 px-2 pt-1 text-sidebar-foreground">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            S
          </div>
          {!isCollapsed && (
            <span className="font-display font-bold text-lg text-sidebar-foreground truncate animate-in fade-in duration-300">
              SaaSify
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/app")} tooltip="App">
                  <Link href="/app" className="flex items-center gap-2 w-full">
                    <LayoutDashboard className="shrink-0" />
                    {!isCollapsed && <span className="truncate">App</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin")} tooltip="Aperçu Admin">
                    <Link href="/admin" className="flex items-center gap-2 w-full">
                      <ShieldCheck className="shrink-0" />
                      {!isCollapsed && <span className="truncate">Aperçu Admin</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/users")} tooltip="Gestion Utilisateurs">
                    <Link href="/admin/users" className="flex items-center gap-2 w-full">
                      <Users className="shrink-0" />
                      {!isCollapsed && <span className="truncate">Utilisateurs</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/20 p-2.5 overflow-hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex items-center justify-start gap-3 px-2.5 cursor-pointer"
            >
              <Avatar className="h-9 w-9 shrink-0 rounded-full">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={profile?.email || "Avatar utilisateur"} /> : null}
                <AvatarFallback className="rounded-full bg-primary/10 text-primary">
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight animate-in fade-in duration-300">
                    <span className="truncate font-semibold">{profile?.role === "admin" ? "Administrateur" : "Utilisateur"}</span>
                    <span className="truncate text-xs">{profile?.email}</span>
                  </div>
                  <ChevronRight className="ml-auto size-4 shrink-0" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-sidebar-border bg-sidebar p-1 text-sidebar-foreground"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <div className="mb-1 flex items-center gap-2.5 px-2.5 py-2">
              <Avatar className="h-9 w-9 shrink-0 rounded-full">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayEmail || "Avatar utilisateur"} /> : null}
                <AvatarFallback className="rounded-full bg-primary/15 text-primary">{avatarInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-sidebar-foreground/80">{displayEmail}</p>
              </div>
            </div>
            <div className="my-1 h-px bg-sidebar-border/70" />
            <DropdownMenuItem
              asChild
              className="h-9 cursor-pointer rounded-md px-2 text-sm font-medium data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
            >
              <Link href="/settings" className="flex w-full items-center gap-2">
                <SettingsIcon className="h-4 w-4 shrink-0" />
                <span>Paramètres</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="h-9 cursor-pointer rounded-md px-2 text-sm font-medium data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
            >
              <Link href="/billing" className="flex w-full items-center gap-2">
                <CreditCard className="h-4 w-4 shrink-0" />
                <span>Facturation</span>
              </Link>
            </DropdownMenuItem>
            <div className="my-1 h-px bg-sidebar-border/70" />
            <DropdownMenuItem
              className="h-9 cursor-pointer rounded-md px-2 text-sm font-medium data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
