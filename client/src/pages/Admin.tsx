import { useProfile, useAdminMetrics, useUserGrowth } from "@/hooks/use-supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Users, Mail, Clock, ShieldAlert, Trash2, Crown, TrendingUp, BarChart3, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { useState, useMemo } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Hook for fetching all profiles (Admin only)
 */
export function useAllProfiles() {
  const { isAdmin } = useAuth();

  return useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });
}

/**
 * Admin Portal Main Page
 */
export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const { data: profiles, isLoading: isLoadingProfiles } = useAllProfiles();
  const { data: metrics, isLoading: isLoadingMetrics } = useAdminMetrics();
  const { data: growthData, isLoading: isLoadingGrowth } = useUserGrowth();
  const { updateProfile, deleteProfile } = useProfile();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const isLoading = isLoadingProfiles || isLoadingMetrics || isLoadingGrowth;

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    const query = searchQuery.toLowerCase().trim();
    return profiles.filter((p: Profile) => {
      const matchesRole = roleFilter === "all" || p.role === roleFilter;
      const matchesSearch = !query || 
        p.email?.toLowerCase().includes(query) || 
        p.full_name?.toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [profiles, searchQuery, roleFilter]);

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
      toast({ title: "Rôle mis à jour", description: `L'utilisateur est maintenant ${newRole === 'admin' ? 'Administrateur' : 'Utilisateur'}.` });
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

  if (!isAdmin && !isLoading) {
    return <AccessDenied setLocation={setLocation} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold tracking-tight">Portail Administrateur</h1>
        <p className="text-muted-foreground text-lg">
          Gérez les utilisateurs et surveillez les accès au système.
        </p>
      </div>

      {isLoading ? (
        <AdminSkeleton />
      ) : (
        <>
          <AdminStats metrics={metrics} profiles={profiles} />
          <GrowthChart data={growthData} />
          <UserManagement 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            profiles={filteredProfiles}
            onToggleRole={handleToggleRole}
            onToggleSubscriber={handleToggleSubscriber}
            onDelete={handleDeleteUser}
          />
        </>
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
      <Button onClick={() => setLocation("/dashboard")}>
        Retour au Tableau de Bord
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

function UserManagement({ searchQuery, setSearchQuery, roleFilter, setRoleFilter, profiles, onToggleRole, onToggleSubscriber, onDelete }: any) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Gestion des Utilisateurs</CardTitle>
          <CardDescription>Liste de tous les utilisateurs inscrits dans le système.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher nom ou email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-9">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Tous les rôles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="user">Utilisateurs</SelectItem>
              <SelectItem value="admin">Administrateurs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Abonné</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length > 0 ? (
                profiles.map((profile: Profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{profile.full_name || "N/A"}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {profile.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button 
                        onClick={() => onToggleRole(profile.id, profile.role)}
                        className="transition-transform active:scale-95"
                      >
                        <Badge 
                          variant={profile.role === 'admin' ? "default" : "secondary"}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {profile.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={profile.is_subscriber} 
                          onCheckedChange={() => onToggleSubscriber(profile.id, !!profile.is_subscriber)}
                        />
                        {profile.is_subscriber && <Crown className="h-3 w-3 text-amber-500" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {profile.last_active_at ? format(new Date(profile.last_active_at), "d MMM, HH:mm") : "Jamais"}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {profile.createdAt ? format(new Date(profile.createdAt), "d MMM yyyy") : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteUserDialog profile={profile} onDelete={() => onDelete(profile.id)} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Aucun utilisateur trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function DeleteUserDialog({ profile, onDelete }: any) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
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