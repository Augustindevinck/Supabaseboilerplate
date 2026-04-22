import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TermsGuard } from "./TermsGuard";
import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const [location] = useLocation();

  const pageTitleByPath: Record<string, string> = {
    "/app": "App",
    "/settings": "Paramètres",
    "/billing": "Facturation",
    "/admin": "Aperçu Admin",
    "/admin/users": "Gestion Utilisateurs",
  };

  const pageTitle = pageTitleByPath[location] ?? "Application";

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-medium animate-pulse">Chargement de la plateforme...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <TermsGuard />
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden bg-card">
        <header className="flex h-16 items-center gap-4 bg-card/80 px-6 backdrop-blur transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <SidebarTrigger />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-semibold truncate">{pageTitle}</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 pt-6 md:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
