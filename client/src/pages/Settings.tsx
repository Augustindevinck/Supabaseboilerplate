import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Shield } from "lucide-react";

export default function Settings() {
  const { user, profile } = useAuth();
  const { updateProfile } = useProfile();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertProfileSchema.pick({ full_name: true })),
    defaultValues: {
      full_name: profile?.full_name || "",
    },
  });

  const onSubmit = async (data: { full_name: string | null }) => {
    if (!user) return;
    try {
      await updateProfile({ id: user.id, updates: { full_name: data.full_name || "" } });
      toast({ title: "Profil mis à jour", description: "Vos modifications ont été enregistrées." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre compte et vos préférences.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>Mettez à jour vos informations de profil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom Complet</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean Dupont" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Label>Adresse Email</Label>
                    <Input value={user?.email || ""} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié.</p>
                  </div>
                </div>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer les modifications
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {profile?.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Statut du Compte</CardTitle>
              <CardDescription>Consultez vos permissions d'accès.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium capitalize">Rôle : Administrateur</p>
                  <p className="text-sm text-muted-foreground">
                    Vous avez un accès administratif complet à la plateforme.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
