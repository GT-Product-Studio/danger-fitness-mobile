import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../auth";
import { BRAND } from "../constants/brand";

export interface Challenge {
  id: string;
  name: string;
  month: string;
  start_date: string;
  end_date: string;
  description?: string;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  total_score: number;
  cycling_miles: number;
  moto_hours: number;
  gym_hours: number;
  rank?: number;
}

export interface ActivityLog {
  id: string;
  challenge_id: string;
  user_id: string;
  activity_type: string;
  value: number;
  logged_at: string;
}

export function useChallenge() {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userScore, setUserScore] = useState<LeaderboardEntry | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenge = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get current/active challenge
    const now = new Date().toISOString();
    const { data: challenges } = await supabase
      .from("challenges")
      .select("*")
      .lte("start_date", now)
      .gte("end_date", now)
      .limit(1);

    const active = challenges?.[0] || null;
    setChallenge(active);

    if (active) {
      // Fetch leaderboard
      const { data: lb } = await supabase
        .from("challenge_leaderboard")
        .select("*")
        .eq("challenge_id", active.id)
        .order("total_score", { ascending: false })
        .limit(20);

      const ranked = (lb || []).map((entry, i) => ({ ...entry, rank: i + 1 }));
      setLeaderboard(ranked);
      setUserScore(ranked.find((e) => e.user_id === user.id) || null);

      // Fetch user's activity logs
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("challenge_id", active.id)
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false });

      setActivityLogs(logs || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const logActivity = async (
    activityType: string,
    value: number
  ): Promise<{ error: Error | null }> => {
    if (!user || !challenge) return { error: new Error("No active challenge") };
    const { error } = await supabase.from("activity_logs").insert({
      challenge_id: challenge.id,
      user_id: user.id,
      activity_type: activityType,
      value,
      logged_at: new Date().toISOString(),
    });
    if (!error) await fetchChallenge();
    return { error: error as Error | null };
  };

  const daysRemaining = challenge
    ? Math.max(
        0,
        Math.ceil(
          (new Date(challenge.end_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const haidenPct = userScore
    ? Math.min(1, userScore.total_score / BRAND.scoring.haidenBenchmark)
    : 0;

  return {
    challenge,
    leaderboard,
    userScore,
    activityLogs,
    loading,
    daysRemaining,
    haidenPct,
    logActivity,
    refetch: fetchChallenge,
  };
}
