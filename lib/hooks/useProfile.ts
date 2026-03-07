import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../auth";

export interface Profile {
  id: string;
  full_name: string;
  started_at: string;
  avatar_url?: string;
  max_hr?: number;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const currentDay = (() => {
    if (!profile?.started_at) return 1;
    const start = new Date(profile.started_at);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(Math.max(diffDays, 1), 30);
  })();

  return { profile, loading, currentDay, refetch: fetchProfile };
}
