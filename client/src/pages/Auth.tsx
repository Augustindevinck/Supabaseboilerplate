import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isLogin = location === "/login";

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Bon retour !", description: "Connexion réussie." });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
          }
        });
        if (error) throw error;
        toast({ title: "Compte créé", description: "Veuillez vérifier vos emails pour confirmer votre inscription." });
        setLocation("/login");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl shadow-black/5 border-border/60">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-display font-bold text-center">
            {isLogin ? "Bon retour parmi nous" : "Créer un compte"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Entrez vos identifiants pour vous connecter" : "Entrez votre email pour commencer"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              type="button"
              variant="outline" 
              className="w-full h-11 text-base font-semibold"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              data-testid="button-google-auth"
            >
              <SiGoogle className="mr-2 h-5 w-5" />
              {isLogin ? "Se connecter avec Google" : "S'inscrire avec Google"}
            </Button>

            <Separator className="my-4" />

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                  data-testid="input-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20" 
                disabled={isLoading}
                data-testid="button-auth-submit"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Se connecter" : "S'inscrire"}
              </Button>
            </form>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="link" 
            onClick={() => setLocation(isLogin ? "/register" : "/login")}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
