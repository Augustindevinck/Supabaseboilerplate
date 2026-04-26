import { useProfile, useAdminMetrics, useUserGrowth } from "@/hooks/use-supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Users, Mail, Clock, ShieldAlert, Trash2, TrendingUp, BarChart3, Search, Filter, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@shared/schema";
import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

function mapProfileDates(profile: any): Profile {
  return {
    ...profile,
    createdAt: profile.created_at ?? profile.createdAt,
    updatedAt: profile.updated_at ?? profile.updatedAt,
  } as Profile;
}

export function useAllProfiles(options?: { enabled?: boolean }) {
  const { isAdmin } = useAuth();
  const enabled = options?.enabled ?? true;

  return useQuery<Profile[]>({
    queryKey: ["profiles", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapProfileDates);
    },
    enabled: isAdmin && enabled,
  });
}

type PaginatedProfilesResponse = {
  profiles: Profile[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

type UsePaginatedProfilesParams = {
  page: number;
  pageSize: number;
  searchQuery: string;
  roleFilter: string;
};

function usePaginatedProfiles({
  page,
  pageSize,
  searchQuery,
  roleFilter,
}: UsePaginatedProfilesParams) {
  const { isAdmin } = useAuth();

  return useQuery<PaginatedProfilesResponse>({
    queryKey: ["profiles", "paginated", page, pageSize, searchQuery, roleFilter],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const normalizedSearch = searchQuery.trim().replace(/[^\w@.\-\s]/g, "");

      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      if (normalizedSearch) {
        query = query.or(`email.ilike.%${normalizedSearch}%,full_name.ilike.%${normalizedSearch}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      const profiles = (data || []).map(mapProfileDates);
      const total = count ?? 0;

      return {
        profiles,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        page,
        pageSize,
      };
    },
    enabled: isAdmin,
    placeholderData: keepPreviousData,
  });
}

/**
 * Admin Portal Main Page (Dashboard Only)
 */
export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const isUsersPage = location === "/admin/users";

  const { data: profiles } = useAllProfiles({ enabled: !isUsersPage });
  const { data: metrics, isLoading: isLoadingMetrics } = useAdminMetrics();
  const { data: growthData, isLoading: isLoadingGrowth } = useUserGrowth();

  const isLoading = isLoadingMetrics || isLoadingGrowth;

  if (!isAdmin && !isLoading) {
    return <AccessDenied setLocation={setLocation} />;
  }

  if (isUsersPage) {
    return <UsersManagementPage />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold tracking-tight">Aperçu Admin</h1>
        <p className="text-muted-foreground text-lg">
          Aperçu global et statistiques du système.
        </p>
      </div>

      {isLoading ? (
        <AdminSkeleton />
      ) : (
        <>
          <AdminStats metrics={metrics} profiles={profiles} />
          <GrowthChart data={growthData} />
        </>
      )}
    </div>
  );
}

/**
 * Dedicated User Management Page
 */
function UsersManagementPage() {
  const { updateProfile, deleteProfile } = useProfile();
  const { toast } = useToast();

  const pageSize = 25;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data, isLoading, isFetching, isPlaceholderData } = usePaginatedProfiles({
    page,
    pageSize,
    searchQuery,
    roleFilter,
  });

  const profiles = data?.profiles || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!isFetching && !isPlaceholderData && profiles.length === 0 && page > 1) {
      setPage((prev) => prev - 1);
    }
  }, [isFetching, isPlaceholderData, page, profiles.length]);

  const handleToggleSubscriber = async (id: string, current: boolean) => {
    try {
      await updateProfile({ id, updates: { is_subscriber: !current } });
      toast({ title: "Profil mis à jour", description: "Le statut d'abonné a été modifié." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Échec de la mise à jour", description: error.message });
    }
  };

  const handleToggleRole = async (id: string, currentRole: string) => {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      await updateProfile({ id, updates: { role: newRole as "user" | "admin" } });
      toast({ title: "Rôle mis à jour", description: `L'utilisateur est maintenant ${newRole === "admin" ? "Administrateur" : "Utilisateur"}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Échec de la mise à jour", description: error.message });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteProfile(id);
      toast({ title: "Utilisateur supprimé", description: "L'utilisateur a été retiré avec succès." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Échec de la suppression", description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold tracking-tight">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground text-lg">
          Consultez et modifiez les comptes utilisateurs du système.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <UserManagement
          searchQuery={searchInput}
          setSearchQuery={setSearchInput}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          profiles={profiles}
          onToggleRole={handleToggleRole}
          onToggleSubscriber={handleToggleSubscriber}
          onDelete={handleDeleteUser}
          page={page}
          totalPages={totalPages}
          isFetching={isFetching}
          isPlaceholderData={isPlaceholderData}
          onPageChange={setPage}
          onPreviousPage={() => setPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      )}
    </div>
  );
}

/**
 * Sub-components
 */

function AccessDenied({ setLocation }: { setLocation: any }) {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold">Accès Refusé</h1>
      <p className="text-muted-foreground max-w-md">
        Vous n'avez pas les permissions nécessaires pour voir cette page. Cette zone est réservée aux administrateurs.
      </p>
      <Button onClick={() => setLocation("/app")}>
        Retour à l'application
      </Button>
    </div>
  );
}

function AdminStats({ metrics, profiles }: any) {
  const adminsCount = profiles?.filter((p: any) => p.role === 'admin').length || 0;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Aujourd'hui" value={metrics?.today} icon={<TrendingUp className="h-4 w-4 text-green-500" />} description="Nouveaux inscrits" />
      <StatCard title="Cette Semaine" value={metrics?.week} icon={<Users className="h-4 w-4 text-primary" />} description="Inscriptions 7j" />
      <StatCard title="Ce Mois" value={metrics?.month} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="Inscriptions 30j" />
      <StatCard title="Admins" value={adminsCount} icon={<ShieldCheck className="h-4 w-4 text-primary" />} description="Administrateurs système" />
    </div>
  );
}

function StatCard({ title, value, icon, description }: any) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value || 0}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function GrowthChart({ data }: any) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Aperçu de la Croissance</CardTitle>
          <CardDescription>Évolution des inscriptions sur les 30 derniers jours.</CardDescription>
        </div>
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                minTickGap={30}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorCount)" 
                strokeWidth={2}
                name="Nouveaux Utilisateurs"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

type UserManagementProps = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  profiles: Profile[];
  onToggleRole: (id: string, currentRole: string) => void;
  onToggleSubscriber: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  page: number;
  totalPages: number;
  isFetching: boolean;
  isPlaceholderData: boolean;
  onPageChange: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

function UserManagement({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  profiles,
  onToggleRole,
  onToggleSubscriber,
  onDelete,
  page,
  totalPages,
  isFetching,
  isPlaceholderData,
  onPageChange,
  onPreviousPage,
  onNextPage,
}: UserManagementProps) {
  const pageNumbers =
    totalPages <= 3
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : page === 1
        ? [1, 2, 3]
        : page === totalPages
          ? [totalPages - 2, totalPages - 1, totalPages]
          : [page - 1, page, page + 1];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-lg border-border/70 bg-background px-3 shadow-sm transition-colors hover:border-border">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent align="end" className="min-w-[200px] rounded-lg border-border/70 p-1 shadow-lg">
            <SelectItem value="all" className="rounded-md">Tous les rôles</SelectItem>
            <SelectItem value="user" className="rounded-md">Utilisateurs</SelectItem>
            <SelectItem value="admin" className="rounded-md">Administrateurs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/70">
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Abonné</TableHead>
              <TableHead>Inscription</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length > 0 ? (
              profiles.map((profile: Profile) => (
                <TableRow key={profile.id} className="border-b border-border/60 last:border-b-0 hover:bg-transparent">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{profile.full_name || "N/A"}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {profile.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ConfirmRoleChangeDialog
                      profile={profile}
                      onConfirm={() => onToggleRole(profile.id, profile.role)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.is_subscriber ? "default" : "secondary"}>
                      {profile.is_subscriber ? "Oui" : "Non"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{profile.createdAt ? format(new Date(profile.createdAt), "dd/MM/yyyy") : "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActionsDropdown
                      profile={profile}
                      onToggleSubscriber={() => onToggleSubscriber(profile.id, !!profile.is_subscriber)}
                      onDelete={() => onDelete(profile.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex w-full justify-end">
        <div className="inline-flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreviousPage}
            disabled={page <= 1 || isFetching}
            className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Précédent
          </Button>
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              disabled={isFetching}
              className={`h-8 w-8 rounded-md px-0 ${
                pageNumber === page
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextPage}
            disabled={page >= totalPages || isFetching || isPlaceholderData}
            className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Suivant
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConfirmRoleChangeDialog({
  profile,
  onConfirm,
}: {
  profile: Profile;
  onConfirm: () => void;
}) {
  const targetRole = profile.role === "admin" ? "Utilisateur" : "Administrateur";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="transition-transform active:scale-95">
          <Badge
            variant={profile.role === "admin" ? "default" : "secondary"}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {profile.role === "admin" ? "Administrateur" : "Utilisateur"}
          </Badge>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer le changement de rôle ?</AlertDialogTitle>
          <AlertDialogDescription>
            L'utilisateur {profile.email} passera au rôle {targetRole}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function UserActionsDropdown({
  profile,
  onToggleSubscriber,
  onDelete,
}: {
  profile: Profile;
  onToggleSubscriber: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border/60 hover:bg-muted/60 hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-[190px] rounded-lg border-border/70 p-1 shadow-lg">
        <DropdownMenuLabel className="px-2 py-1 text-xs text-muted-foreground">
          Actions utilisateur
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleSubscriber} className="cursor-pointer rounded-md">
          {profile.is_subscriber ? "Retirer abonné" : "Passer abonné"}
        </DropdownMenuItem>
        <DeleteUserDialog profile={profile} onDelete={onDelete} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DeleteUserDialog({ profile, onDelete }: { profile: Profile; onDelete: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="cursor-pointer rounded-md text-destructive focus:text-destructive"
          onSelect={(event) => event.preventDefault()}
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Cela supprimera définitivement le profil utilisateur de {profile.email}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}