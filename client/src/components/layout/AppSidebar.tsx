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

  const isActive = (path: string) => location === path;

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/20 overflow-hidden">
        <Link href="/app" className="flex items-center justify-center gap-2 px-2 w-full hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            S
          </div>
          {!isCollapsed && (
            <span className="font-display font-bold text-lg truncate animate-in fade-in duration-300">
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

      <SidebarFooter className="border-t border-border/20 p-2 overflow-hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex items-center justify-center cursor-pointer"
            >
              <Avatar className="h-8 w-8 shrink-0 rounded-full">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={profile?.email || "Avatar utilisateur"} /> : null}
                <AvatarFallback className="rounded-full bg-primary/10 text-primary">
                  {profile?.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight animate-in fade-in duration-300">
                    <span className="truncate font-semibold">{profile?.role === "admin" ? "Administrateur" : "Utilisateur"}</span>
                    <span className="truncate text-xs">{profile?.email}</span>
                  </div>
                  <ChevronRight className="ml-auto size-4 shrink-0" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex w-full items-center cursor-pointer">
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/billing" className="flex w-full items-center cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Facturation</span>
              </Link>
            </DropdownMenuItem>
            <div className="my-1 h-px bg-muted" />
            <DropdownMenuItem className="cursor-pointer" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
