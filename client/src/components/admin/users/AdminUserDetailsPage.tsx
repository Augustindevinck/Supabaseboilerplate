import { Profile } from "@shared/schema";
import { format } from "date-fns";
import { useMemo } from "react";
import {
  AlertCircle,
  Clock3,
  Globe,
  Laptop,
  Loader2,
  Mail,
  Trash2,
  ShieldX,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/use-supabase";
import {
  useAdminUserDetails,
  useRevokeAdminSession,
  useRevokeAllAdminSessions,
} from "@/hooks/use-admin-profiles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmRoleChangeDialog } from "./ConfirmRoleChangeDialog";

type AdminUserDetailsPageProps = {
  userId: string;
};

function formatDateTime(value: string | null) {
  if (!value) return "N/A";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";

  return format(parsed, "dd/MM/yyyy HH:mm");
}

function providerLabel(provider: string) {
  const normalized = provider.trim().toLowerCase();

  if (normalized === "google") return "Google";
  if (normalized === "email") return "Email";
  if (normalized === "github") return "GitHub";

  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Inconnu";
}

export function AdminUserDetailsPage({ userId }: AdminUserDetailsPageProps) {
  const { toast } = useToast();
  const { updateProfile } = useProfile();
  const { data, isLoading, isError, error, refetch } = useAdminUserDetails(userId);
  const revokeSessionMutation = useRevokeAdminSession(userId);
  const revokeAllMutation = useRevokeAllAdminSessions(userId);

  const initials = useMemo(() => {
    const displayName = data?.profile.fullName || data?.profile.email || "U";

    return displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [data?.profile.fullName, data?.profile.email]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSessionMutation.mutateAsync(sessionId);
      toast({ title: "Session supprimée", description: "La session a été révoquée." });
    } catch (mutationError: any) {
      toast({
        variant: "destructive",
        title: "Échec de suppression",
        description: mutationError?.message ?? "Impossible de supprimer cette session.",
      });
    }
  };

  const handleRevokeAll = async () => {
    try {
      await revokeAllMutation.mutateAsync();
      toast({ title: "Sessions révoquées", description: "Toutes les sessions ont été supprimées." });
    } catch (mutationError: any) {
      toast({
        variant: "destructive",
        title: "Échec de révocation",
        description: mutationError?.message ?? "Impossible de révoquer toutes les sessions.",
      });
    }
  };

  const handleToggleRole = async () => {
    if (!data) return;

    try {
      const newRole = data.profile.role === "admin" ? "user" : "admin";
      await updateProfile({ id: data.profile.id, updates: { role: newRole } });
      await refetch();
      toast({
        title: "Rôle mis à jour",
        description: `L'utilisateur est maintenant ${newRole === "admin" ? "Administrateur" : "Utilisateur"}.`,
      });
    } catch (mutationError: any) {
      toast({
        variant: "destructive",
        title: "Échec de la mise à jour",
        description: mutationError?.message ?? "Impossible de changer le rôle.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-6 w-full max-w-xl" />
        </div>

        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="h-9 w-48 rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {[1, 2, 3].map((item) => (
              <div key={item} className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr_3rem] items-center gap-4 rounded-lg border border-border/50 p-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-8 w-8 rounded-md justify-self-end" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {[1, 2].map((item) => (
              <div key={item} className="grid grid-cols-4 items-center gap-4 rounded-lg border border-border/50 p-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Impossible de charger l’utilisateur</AlertTitle>
          <AlertDescription>{(error as Error)?.message ?? "Une erreur inconnue est survenue."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold tracking-tight">Détail utilisateur</h1>
          <p className="text-muted-foreground text-lg">Consultez le profil, les sessions et les providers d’authentification.</p>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Profil utilisateur</CardTitle>
          <CardDescription>Informations principales du compte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              {data.profile.avatarUrl ? <AvatarImage src={data.profile.avatarUrl} alt={data.profile.email || "Avatar"} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-base font-semibold">{data.profile.fullName || "Nom non renseigné"}</p>
              <p className="text-sm text-muted-foreground">{data.profile.email || "Email non renseigné"}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Rôle</p>
              <ConfirmRoleChangeDialog
                profile={{
                  id: data.profile.id,
                  email: data.profile.email,
                  full_name: data.profile.fullName,
                  avatar_url: null,
                  role: data.profile.role,
                  is_subscriber: false,
                  stripe_customer_id: null,
                  stripe_subscription_id: null,
                  subscription_status: null,
                  has_accepted_terms: false,
                  last_active_at: null,
                  createdAt: null,
                  updatedAt: null,
                } satisfies Profile}
                onConfirm={handleToggleRole}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Inscription</p>
              <p className="text-sm font-medium">{formatDateTime(data.profile.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Dernière connexion</p>
              <p className="text-sm font-medium">{formatDateTime(data.profile.lastSignInAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Dernière activité</p>
              <p className="text-sm font-medium">{formatDateTime(data.profile.lastActiveAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Sessions actives</CardTitle>
              <CardDescription>Liste des sessions actives et expirées de l’utilisateur.</CardDescription>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeAll}
              disabled={revokeAllMutation.isPending || data.sessions.length === 0}
            >
              {revokeAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
              Révoquer toutes les sessions
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {data.sessionsUnavailable ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sessions indisponibles</AlertTitle>
              <AlertDescription>
                Les sessions n’ont pas pu être chargées depuis votre projet Supabase. Vérifiez les permissions d’accès au schéma auth.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Appareil</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créée le</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sessions.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                      Aucune session trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{session.device}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{session.ipAddress || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={session.status === "active" ? "default" : "secondary"}>
                          {session.status === "active" ? "Actif" : "Expiré"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(session.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokeSessionMutation.isPending}
                          aria-label="Supprimer la session"
                        >
                          {revokeSessionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Providers d’authentification</CardTitle>
          <CardDescription>Methods de connexion actuellement liées au compte.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Provider</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Connecté le</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.providers.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                      Aucun provider trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {provider.provider === "email" ? (
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          ) : provider.provider === "google" ? (
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">{providerLabel(provider.provider)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Connecté
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(provider.connectedAt)}</TableCell>
                      <TableCell className="text-sm">
                        <div className="inline-flex items-center gap-1 text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDateTime(provider.lastSignInAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
