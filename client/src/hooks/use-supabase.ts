import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Profile, UpdateProfileRequest } from "@shared/schema";
import { useAuth } from "./use-auth";

/**
 * Hook for fetching and managing the current user's profile
 */
export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<Profile | null>({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateProfileRequest }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profile", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  return {
    ...query,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteProfile: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for fetching all profiles (Admin only)
 */
export function useProfiles() {
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
