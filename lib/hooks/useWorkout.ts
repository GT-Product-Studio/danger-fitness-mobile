import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../auth";

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  block: string;
  sets?: number;
  reps?: string;
  duration?: string;
  notes?: string;
  hr_zone?: number;
  order_index: number;
}

export interface Workout {
  id: string;
  day_number: number;
  title: string;
  day_type: string;
  description?: string;
}

export function useWorkout(dayNumber: number) {
  const { user } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkout = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get user's training level
    const { data: profile } = await supabase
      .from("profiles")
      .select("training_level")
      .eq("id", user.id)
      .single();
    const level = profile?.training_level || "grom";

    const { data: w } = await supabase
      .from("workouts")
      .select("*")
      .eq("day_number", dayNumber)
      .eq("level", level)
      .single();

    if (w) {
      setWorkout(w);
      const { data: exs } = await supabase
        .from("exercises")
        .select("*")
        .eq("workout_id", w.id)
        .order("order_index");
      setExercises(exs || []);
    }
    setLoading(false);
  }, [dayNumber, user]);

  useEffect(() => {
    fetchWorkout();
  }, [fetchWorkout]);

  const exercisesByBlock = exercises.reduce<Record<string, Exercise[]>>(
    (acc, ex) => {
      const block = ex.block || "other";
      if (!acc[block]) acc[block] = [];
      acc[block].push(ex);
      return acc;
    },
    {}
  );

  return { workout, exercises, exercisesByBlock, loading, refetch: fetchWorkout };
}

export function useWorkoutCompletion() {
  const { user } = useAuth();
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("progress")
      .select("day_number")
      .eq("user_id", user.id);
    setCompletedDays(data?.map((d) => d.day_number) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  return { completedDays, loading, refetch: fetchCompletions };
}
