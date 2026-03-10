import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants/brand";
import { ZoneBadge } from "../ui/ZoneBadge";
import type { Exercise } from "../../lib/hooks/useWorkout";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExerciseCardProps {
  exercise: Exercise;
  isActive?: boolean;
}

// Exercise detail database — maps exercise names to in-depth info
const EXERCISE_DETAILS: Record<string, {
  muscles: string;
  motoWhy: string;
  tips: string[];
  rest: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}> = {
  // Upper Push
  "Barbell Bench Press": { muscles: "Chest, Triceps, Front Delts", motoWhy: "Upper body pushing power for bike control through whoops and ruts", tips: ["Plant feet flat, arch slightly", "Lower to mid-chest", "Drive through the floor with your legs"], rest: "90-120s", difficulty: "Intermediate" },
  "Incline Dumbbell Press": { muscles: "Upper Chest, Shoulders, Triceps", motoWhy: "Builds the shelf of muscle across your upper chest that braces against the bike", tips: ["30° incline — no higher", "Let dumbbells touch at the top", "Control the negative for 2-3 seconds"], rest: "60-90s", difficulty: "Intermediate" },
  "Overhead Press": { muscles: "Shoulders, Triceps, Upper Chest, Core", motoWhy: "Direct transfer to pushing the bars and handling G-forces on jumps", tips: ["Brace core like you're about to take a hit", "Press straight up, not forward", "Lock out fully at the top"], rest: "90-120s", difficulty: "Intermediate" },
  "Cable Fly": { muscles: "Chest (inner + outer)", motoWhy: "Builds the squeezing strength needed for holding the bike through corners", tips: ["Slight bend in elbows throughout", "Squeeze hard at peak contraction for 1 sec", "Control the stretch — don't let it pull you"], rest: "60s", difficulty: "Beginner" },
  "Tricep Dips": { muscles: "Triceps, Chest, Shoulders", motoWhy: "Lockout strength for controlling the bike when arms are extended", tips: ["Lean slightly forward for more chest", "Stay upright for more triceps", "Don't go past 90° if shoulders hurt"], rest: "60-90s", difficulty: "Intermediate" },
  "Push-Ups": { muscles: "Chest, Triceps, Core", motoWhy: "Functional pushing pattern — same muscles that keep you stable on the bike", tips: ["Full range: chest to ground", "Keep body rigid like a plank", "Exhale on the push, inhale down"], rest: "45-60s", difficulty: "Beginner" },
  "Dumbbell Bench Press": { muscles: "Chest, Triceps, Stabilizers", motoWhy: "Unilateral stability — each arm works independently like on the bike", tips: ["Touch dumbbells at the top", "Don't bounce off the chest", "Keep wrists straight, neutral grip OK"], rest: "60-90s", difficulty: "Beginner" },
  "Dumbbell Shoulder Press": { muscles: "Shoulders, Triceps, Upper Traps", motoWhy: "Shoulder endurance for holding your body up on the bike over long motos", tips: ["Seated for stability, standing for core", "Press up and slightly inward", "Don't arch your back excessively"], rest: "60-90s", difficulty: "Beginner" },
  "Tricep Pushdown": { muscles: "Triceps", motoWhy: "Arm endurance — fights the pump that makes you lose grip", tips: ["Keep elbows pinned to sides", "Full extension at the bottom", "Slow negative for extra burn"], rest: "45-60s", difficulty: "Beginner" },
  "Push Press": { muscles: "Shoulders, Triceps, Legs, Core", motoWhy: "Explosive overhead power — simulates absorbing landings with your arms", tips: ["Use leg drive to initiate", "Lock out overhead, then lower controlled", "It's a power move, not strict press"], rest: "90-120s", difficulty: "Advanced" },

  // Lower Body
  "Barbell Back Squat": { muscles: "Quads, Glutes, Hamstrings, Core", motoWhy: "King of leg exercises — builds the leg drive you need to grip the bike and absorb landings", tips: ["Below parallel or it doesn't count", "Drive your knees out over your toes", "Breathe at the top, brace, then descend"], rest: "120-180s", difficulty: "Intermediate" },
  "Romanian Deadlift": { muscles: "Hamstrings, Glutes, Lower Back", motoWhy: "Posterior chain strength — the muscles that keep you standing on the pegs", tips: ["Push hips back like closing a door", "Bar stays close to legs, slight knee bend", "Feel the hamstring stretch, then squeeze up"], rest: "90-120s", difficulty: "Intermediate" },
  "Walking Lunges": { muscles: "Quads, Glutes, Hamstrings, Balance", motoWhy: "Single-leg stability mirrors how you weight the pegs through turns", tips: ["Long stride, back knee to the ground", "Keep torso upright", "Don't let the front knee cave inward"], rest: "60-90s", difficulty: "Beginner" },
  "Leg Press": { muscles: "Quads, Glutes, Hamstrings", motoWhy: "High-volume leg work without spinal loading — great after heavy squats", tips: ["Feet high = more hamstring, low = more quad", "Don't lock knees at the top", "Full range — hips shouldn't lift off the pad"], rest: "60-90s", difficulty: "Beginner" },
  "Calf Raises": { muscles: "Calves (Gastrocnemius, Soleus)", motoWhy: "Standing on the pegs for 35+ minutes means calves need serious endurance", tips: ["Full stretch at the bottom, pause", "Squeeze at the top for 2 seconds", "Straight legs for gastroc, bent for soleus"], rest: "45-60s", difficulty: "Beginner" },
  "Goblet Squat": { muscles: "Quads, Glutes, Core", motoWhy: "Teaches proper squat depth and upright posture — foundational movement", tips: ["Hold dumbbell at chest, elbows inside knees", "Sit deep, push knees out", "Keep chest tall throughout"], rest: "60s", difficulty: "Beginner" },
  "Dumbbell RDL": { muscles: "Hamstrings, Glutes", motoWhy: "Builds the posterior chain without needing heavy barbell loads", tips: ["Hinge at hips, not lower back", "Keep dumbbells close to shins", "Stop when you feel a deep hamstring stretch"], rest: "60s", difficulty: "Beginner" },
  "Bodyweight Lunges": { muscles: "Quads, Glutes, Balance", motoWhy: "Functional single-leg strength for peg control and cornering", tips: ["Step forward, drop back knee", "Push off front foot to return", "Keep core braced throughout"], rest: "45s", difficulty: "Beginner" },
  "Front Squat": { muscles: "Quads, Upper Back, Core", motoWhy: "Forces upright posture under load — builds the riding position strength", tips: ["Elbows HIGH — that's the whole game", "Go deep, keep torso vertical", "If elbows drop, the lift fails"], rest: "120-180s", difficulty: "Advanced" },
  "Bulgarian Split Squat": { muscles: "Quads, Glutes, Balance", motoWhy: "Unilateral leg strength + hip flexibility — both critical for moto", tips: ["Rear foot elevated on bench", "Drop straight down, don't lean forward", "Most of your weight on the front leg"], rest: "60-90s", difficulty: "Intermediate" },

  // Pull
  "Deadlift": { muscles: "Entire Posterior Chain, Grip, Core", motoWhy: "The ultimate full-body strength builder — directly translates to bike control", tips: ["Set up with bar over mid-foot", "Chest up, hips back, pull the slack out", "Drive through the floor, don't pull with your back"], rest: "180-300s", difficulty: "Advanced" },
  "Weighted Pull-Ups": { muscles: "Lats, Biceps, Forearms, Core", motoWhy: "Pulling strength for handling the bike on rough terrain and holding on through braking bumps", tips: ["Full dead hang at the bottom", "Pull elbows to your pockets", "Add weight via belt or weighted vest"], rest: "90-120s", difficulty: "Advanced" },
  "Barbell Row": { muscles: "Back, Biceps, Rear Delts", motoWhy: "Row strength = the ability to pull the bike back after it kicks", tips: ["Hinge at 45°, keep back flat", "Pull to lower chest", "Squeeze shoulder blades at the top"], rest: "90s", difficulty: "Intermediate" },
  "Face Pull": { muscles: "Rear Delts, Rotator Cuff, Traps", motoWhy: "Counteracts the forward shoulder position from riding — injury prevention", tips: ["Pull to your face, not your chest", "External rotate at the end", "Light weight, high reps — this is rehab work"], rest: "45-60s", difficulty: "Beginner" },
  "Dumbbell Curl": { muscles: "Biceps, Forearms", motoWhy: "Arm endurance — your biceps absorb vibration all moto long", tips: ["No swinging — strict form", "Squeeze at the top for 1 second", "Control the negative — that's where strength is built"], rest: "45-60s", difficulty: "Beginner" },
  "Dumbbell Deadlift": { muscles: "Posterior Chain, Grip", motoWhy: "Learn the hip hinge pattern safely before progressing to barbell", tips: ["Dumbbells at sides, hinge at hips", "Keep back neutral, chest up", "Squeeze glutes at the top"], rest: "60-90s", difficulty: "Beginner" },
  "Lat Pulldown": { muscles: "Lats, Biceps, Rear Delts", motoWhy: "Builds the pulling strength for pull-ups and bike control", tips: ["Wide grip, lean slightly back", "Pull to upper chest", "Don't use momentum — control it"], rest: "60s", difficulty: "Beginner" },
  "Seated Cable Row": { muscles: "Mid Back, Lats, Biceps", motoWhy: "Postural strength — keeps you from collapsing forward on the bike", tips: ["Pull to lower sternum", "Squeeze shoulder blades together for 2 sec", "Keep torso stationary — no rocking"], rest: "60s", difficulty: "Beginner" },

  // Power
  "Power Clean": { muscles: "Full Body — Hips, Traps, Shoulders, Core", motoWhy: "The most moto-specific lift — explosive hip extension is how you attack jumps", tips: ["Start position like a deadlift", "Triple extension: ankles, knees, hips", "Catch at shoulders with elbows high and fast"], rest: "120-180s", difficulty: "Advanced" },
  "Dumbbell Snatch": { muscles: "Full Body — Shoulders, Hips, Core", motoWhy: "Explosive single-arm power — mimics the asymmetric forces on the bike", tips: ["One fluid motion from floor to overhead", "Drive with hips, not arms", "Catch with locked arm, slight squat"], rest: "90s", difficulty: "Advanced" },
  "Kettlebell Swing": { muscles: "Glutes, Hamstrings, Core, Shoulders", motoWhy: "Hip power + cardiovascular conditioning — the moto rider's best friend", tips: ["It's a hip hinge, not a squat", "Snap hips forward explosively", "Arms are just along for the ride"], rest: "45-60s", difficulty: "Beginner" },
  "Dumbbell Front Squat": { muscles: "Quads, Core, Upper Back", motoWhy: "Upright squat pattern builds riding posture under fatigue", tips: ["Dumbbells at shoulders, elbows up", "Stay upright — that's the point", "Go deep, drive through heels"], rest: "60-90s", difficulty: "Beginner" },
  "Dumbbell Push Press": { muscles: "Shoulders, Triceps, Legs", motoWhy: "Teaches legs + upper body coordination under load", tips: ["Dip and drive with legs", "Lock out fully overhead", "Lower controlled to shoulders"], rest: "60s", difficulty: "Beginner" },
  "Step-Ups": { muscles: "Quads, Glutes", motoWhy: "Single-leg drive — same pattern as pushing down on the pegs", tips: ["Step onto a bench-height surface", "Drive through the heel of the top foot", "Don't push off with the bottom foot"], rest: "60s", difficulty: "Beginner" },

  // Core
  "Plank Hold": { muscles: "Transverse Abs, Obliques, Shoulders", motoWhy: "Core stability keeps you centered on the bike — everything connects through your midsection", tips: ["Squeeze glutes and brace abs", "Don't let hips sag or pike up", "Breathe normally — don't hold your breath"], rest: "45-60s", difficulty: "Beginner" },
  "Cable Woodchop": { muscles: "Obliques, Transverse Abs, Shoulders", motoWhy: "Rotational power for cornering — you twist your entire body through every turn", tips: ["Rotate from core, not arms", "Feet planted, pivot at hips", "Control the return — that's the work"], rest: "45-60s", difficulty: "Intermediate" },
  "Hanging Leg Raise": { muscles: "Lower Abs, Hip Flexors, Grip", motoWhy: "Lower ab strength + grip endurance — two-for-one moto builder", tips: ["Minimize swing — controlled movement", "Curl hips at the top, not just legs", "Straight legs = harder, bent knees = easier"], rest: "60s", difficulty: "Intermediate" },
  "Dead Bug": { muscles: "Deep Core, Transverse Abs", motoWhy: "Teaches your core to stabilize while limbs move — exactly what happens on the bike", tips: ["Press low back firmly into the floor", "Extend opposite arm and leg slowly", "Exhale as you extend, inhale as you return"], rest: "30-45s", difficulty: "Beginner" },
  "Ab Wheel Rollout": { muscles: "Rectus Abs, Obliques, Lats, Shoulders", motoWhy: "Anti-extension strength — stops your back from collapsing under G-forces", tips: ["Roll out as far as you can control", "Keep core braced the entire time", "Start from knees, progress to standing"], rest: "60s", difficulty: "Advanced" },
  "Anti-Rotation Press": { muscles: "Obliques, Transverse Abs, Shoulders", motoWhy: "Anti-rotation = staying stable when the bike tries to throw you sideways", tips: ["Cable or band at chest height", "Press arms straight out and hold", "Resist the pull — don't let it twist you"], rest: "45s", difficulty: "Intermediate" },
  "Russian Twist": { muscles: "Obliques, Hip Flexors", motoWhy: "Rotational endurance — your core rotates hundreds of times per moto", tips: ["Feet off ground, lean back 45°", "Touch the weight to each side", "Move with control, not speed"], rest: "45s", difficulty: "Beginner" },
  "Bicycle Crunches": { muscles: "Rectus Abs, Obliques", motoWhy: "Combines crunch + rotation — mimics the dynamic core demands of riding", tips: ["Slow and controlled — no rushing", "Elbow to opposite knee, fully extend other leg", "Keep lower back pressed to floor"], rest: "30-45s", difficulty: "Beginner" },
  "Plank Shoulder Tap": { muscles: "Core, Shoulders, Anti-Rotation", motoWhy: "Dynamic stability — core has to fight rotation while arms are busy, just like riding", tips: ["Minimize hip rocking", "Wider feet = easier, narrow = harder", "Tap opposite shoulder with control"], rest: "45s", difficulty: "Beginner" },

  // Grip
  "Farmer's Walk": { muscles: "Forearms, Traps, Core, Grip", motoWhy: "The #1 grip exercise for riders — builds the endurance to hold on for 35 minutes", tips: ["Heavy dumbbells, shoulders back and down", "Walk with purpose — no shuffling", "Squeeze the handles as hard as you can"], rest: "60-90s", difficulty: "Beginner" },
  "Wrist Roller": { muscles: "Forearm Flexors + Extensors", motoWhy: "Directly fights arm pump — the most common performance killer in moto", tips: ["Roll up AND down — both directions matter", "Keep arms extended in front", "Light weight, high reps — endurance is the goal"], rest: "60s", difficulty: "Beginner" },
  "Dead Hang": { muscles: "Forearms, Grip, Lats, Shoulders", motoWhy: "Pure grip endurance + shoulder decompression after heavy lifting", tips: ["Full dead hang, relax shoulders", "Focus only on gripping the bar", "Aim to add 5 seconds each week"], rest: "60s", difficulty: "Beginner" },
  "Tennis Ball Squeeze": { muscles: "Hand + Finger Flexors", motoWhy: "Low-intensity grip work you can do anywhere — recovery day grip maintenance", tips: ["Squeeze and hold 3-5 seconds", "Work each finger individually too", "Do this while watching TV — easy volume"], rest: "30s", difficulty: "Beginner" },

  // HIIT
  "Box Jumps": { muscles: "Quads, Glutes, Calves, Explosiveness", motoWhy: "Explosive lower body power — the same fast-twitch fibers you use on race starts", tips: ["Land softly on top of the box", "Step down, don't jump down (save your knees)", "Reset fully between reps"], rest: "60-90s", difficulty: "Intermediate" },
  "Battle Ropes": { muscles: "Shoulders, Core, Cardio", motoWhy: "Upper body cardio endurance — simulates the sustained arm effort of racing", tips: ["Create big waves, not small wiggles", "Keep core tight, slight squat position", "Alternate arms or slam both together"], rest: "30-45s", difficulty: "Intermediate" },
  "Burpees": { muscles: "Full Body, Cardio", motoWhy: "The most hated and most effective full-body conditioning move", tips: ["Chest to the ground at the bottom", "Explosive jump at the top", "Keep a rhythm — don't stop between reps"], rest: "45-60s", difficulty: "Beginner" },
  "Jump Squats": { muscles: "Quads, Glutes, Calves", motoWhy: "Explosive leg power for jump faces and getting out of corners", tips: ["Squat to parallel, then explode up", "Land soft — absorb with your legs", "Arms help drive the jump"], rest: "45-60s", difficulty: "Beginner" },
  "Mountain Climbers": { muscles: "Core, Hip Flexors, Shoulders, Cardio", motoWhy: "Combines core stability with cardio intensity — mimics the chaos of racing", tips: ["Hands under shoulders, flat back", "Drive knees to chest fast", "Don't let hips pike up"], rest: "30-45s", difficulty: "Beginner" },

  // Cycling
  "Road Cycling": { muscles: "Quads, Hamstrings, Glutes, Calves, Cardio", motoWhy: "Haiden's #1 conditioning method — builds the aerobic base that carries you through long motos", tips: ["Maintain zone 2-3 heart rate for endurance", "Cadence 80-90 RPM for efficiency", "Fuel properly — this is a long effort"], rest: "N/A", difficulty: "Intermediate" },

  // Moto
  "Track Session — Moto Practice": { muscles: "Full Body, Cardio, Mental Focus", motoWhy: "Nothing replaces seat time — this IS the sport", tips: ["Focus on consistency, not speed", "Work on one technique per session", "Hydrate between motos — you're losing more fluid than you think"], rest: "5-10 min between motos", difficulty: "Intermediate" },
  "Start Practice": { muscles: "Reaction Time, Upper Body, Grip", motoWhy: "Holeshots win races — Haiden is one of the best starters in the sport", tips: ["React to the gate, don't anticipate", "Body position: forward, elbows up", "Smooth throttle control off the line"], rest: "Full recovery between starts", difficulty: "Advanced" },

  // Recovery
  "Foam Roll — Full Body": { muscles: "All major muscle groups", motoWhy: "Breaks up fascial adhesions from the bike's vibration and impact forces", tips: ["Spend 30-60 seconds per muscle group", "Slow rolls — stop and hold on tender spots", "Breathe deeply — don't tense up against it"], rest: "N/A", difficulty: "Beginner" },
  "Hip Flexor Stretch": { muscles: "Hip Flexors, Psoas", motoWhy: "Riding position shortens hip flexors — this counteracts that", tips: ["Deep lunge, squeeze the glute", "Push hips forward gently", "Hold 45-60 seconds minimum"], rest: "N/A", difficulty: "Beginner" },
  "Pigeon Pose": { muscles: "Glutes, Hip External Rotators, Piriformis", motoWhy: "Opens the hips for better bike control and reduces lower back stress", tips: ["Keep hips square to the ground", "Walk hands forward for deeper stretch", "Breathe into the tight spots"], rest: "N/A", difficulty: "Beginner" },
  "Light Cycling": { muscles: "Legs, Cardio (Recovery)", motoWhy: "Active recovery — flushes waste products from muscles faster than sitting still", tips: ["Zone 1 only — this should feel easy", "Keep HR under 125 bpm", "Spin easy, think of it as meditation"], rest: "N/A", difficulty: "Beginner" },
  "Easy Walk or Light Cycling": { muscles: "Legs, Cardio (Recovery)", motoWhy: "Active recovery — keeps blood flowing to repair muscle damage", tips: ["Super easy effort — conversation pace", "Fresh air + movement = better recovery", "15-20 minutes is plenty"], rest: "N/A", difficulty: "Beginner" },
  "Yoga Flow": { muscles: "Full Body Flexibility, Balance", motoWhy: "Flexibility + mindfulness — riders who stretch perform better and get hurt less", tips: ["Sun salutations are a great starting sequence", "Don't force any position", "Focus on breathing, not depth"], rest: "N/A", difficulty: "Beginner" },
  "Full Body Stretch": { muscles: "All Major Muscle Groups", motoWhy: "Maintaining range of motion for optimal bike position", tips: ["Hold each stretch 30-60 seconds", "Never bounce — steady hold", "Hit every muscle group, not just the sore ones"], rest: "N/A", difficulty: "Beginner" },
  "Diaphragmatic Breathing": { muscles: "Diaphragm, Parasympathetic Nervous System", motoWhy: "Activates recovery mode — switches your body from 'fight' to 'repair'", tips: ["4 seconds in through nose", "7 seconds hold", "8 seconds out through mouth"], rest: "N/A", difficulty: "Beginner" },
  "Epsom Salt Bath or Cold Plunge": { muscles: "Full Body Recovery", motoWhy: "Reduces inflammation and muscle soreness — Haiden's recovery protocol", tips: ["Cold plunge: 3-5 min max, 50-59°F", "Epsom bath: 2 cups salt, 15-20 min, warm", "Don't cold plunge immediately after strength training"], rest: "N/A", difficulty: "Beginner" },
  "Cat-Cow Stretch": { muscles: "Spine, Core, Hip Flexors", motoWhy: "Spinal mobility — counteracts the locked riding position", tips: ["Arch on inhale (cow), round on exhale (cat)", "Move slowly through the full range", "Feel each vertebra moving"], rest: "N/A", difficulty: "Beginner" },
  "90/90 Hip Stretch": { muscles: "Hip Internal + External Rotators", motoWhy: "Full hip rotation range = better cornering position on the bike", tips: ["Front leg at 90°, back leg at 90°", "Sit tall, lean forward gently", "Switch sides — you'll feel a big difference"], rest: "N/A", difficulty: "Beginner" },
  "Band Pull-Apart": { muscles: "Rear Delts, Rhomboids, Traps", motoWhy: "Shoulder health maintenance — prevents the rounded posture from riding", tips: ["Light band, arms straight in front", "Pull apart to chest level", "Squeeze shoulder blades together"], rest: "30s", difficulty: "Beginner" },
  "Wrist Circles + Flexion/Extension": { muscles: "Wrist Flexors + Extensors", motoWhy: "Pre-race wrist prep — warms the tendons that take a beating on the track", tips: ["10 circles each direction", "Full flexion and extension holds", "Do this before EVERY ride"], rest: "N/A", difficulty: "Beginner" },
  "Light Walk": { muscles: "General Movement", motoWhy: "Easy movement to keep loose without adding training stress", tips: ["No rush — easy pace", "Great time for mental visualization", "Stay hydrated"], rest: "N/A", difficulty: "Beginner" },
  "Foam Roll": { muscles: "All Major Muscle Groups", motoWhy: "Breaks up tension from the week's training", tips: ["Focus on your sorest areas", "Slow rolls, hold on knots", "10 minutes is enough"], rest: "N/A", difficulty: "Beginner" },

  // Race
  "Dynamic Warm-Up": { muscles: "Full Body Activation", motoWhy: "Raises core temperature and primes the nervous system before racing", tips: ["Start easy, build intensity", "Include leg swings, arm circles, high knees", "You should be lightly sweating by the end"], rest: "N/A", difficulty: "Beginner" },
  "Activation — Band Walks": { muscles: "Glutes, Hip Abductors", motoWhy: "Fires up the glutes before they need to grip the bike for 35 minutes", tips: ["Mini band above knees", "Stay low in a half-squat", "10-15 steps each direction"], rest: "30s", difficulty: "Beginner" },
  "Activation — Bodyweight Squats": { muscles: "Quads, Glutes", motoWhy: "Wakes up the legs before race effort", tips: ["15 reps, moderate tempo", "Full depth", "Focus on breathing and calming nerves"], rest: "N/A", difficulty: "Beginner" },
  "Sprint Intervals": { muscles: "Fast-Twitch Fibers, Nervous System", motoWhy: "Activates your nervous system for explosive race starts", tips: ["10 seconds ALL OUT", "Full recovery between sprints", "This is activation, not a workout"], rest: "50s", difficulty: "Intermediate" },
  "Practice/Qualifying": { muscles: "Full Body, Focus", motoWhy: "Learn the track, find the fastest lines, build confidence", tips: ["First laps: learn the track at 70%", "Build up speed gradually", "Find your reference points for corners"], rest: "Between sessions", difficulty: "Intermediate" },
  "Practice Laps": { muscles: "Full Body, Focus", motoWhy: "Track familiarization — smooth is fast", tips: ["Focus on being smooth, not fast", "Pick lines and commit", "Take mental notes on what feels good"], rest: "Between sessions", difficulty: "Beginner" },
  "Race — Moto 1": { muscles: "Everything — Full Send", motoWhy: "THIS IS IT. Everything you trained for.", tips: ["Execute your start — don't freeze", "Ride your own race the first 5 minutes", "Be smart with passes — the race is long"], rest: "Full recovery", difficulty: "Advanced" },
  "Race — Moto 2": { muscles: "Everything + Mental Toughness", motoWhy: "Second moto is where champions are made — dig deep", tips: ["Reset mentally — Moto 1 is done", "Hydrate and fuel between motos", "Fatigue will hit — push through it"], rest: "N/A", difficulty: "Advanced" },
  "Race Simulation": { muscles: "Full Body, Cardio, Mental", motoWhy: "Practice racing at high intensity — builds race fitness without a gate drop", tips: ["15-20 minutes at race pace", "Push yourself — track your heart rate", "Practice passing imaginary riders"], rest: "N/A", difficulty: "Intermediate" },
  "Recovery Between Motos": { muscles: "Recovery", motoWhy: "How you recover between motos determines Moto 2 performance", tips: ["Sip water + electrolytes constantly", "Light stretching — don't sit down", "Visualize Moto 2 — stay sharp mentally"], rest: "N/A", difficulty: "Beginner" },
  "Post-Race Cool Down": { muscles: "Full Body Recovery", motoWhy: "Brings heart rate down gradually — prevents blood pooling and dizziness", tips: ["Light jog or walk for 5 minutes", "Full body stretch focusing on arms and legs", "Start hydrating and fueling immediately"], rest: "N/A", difficulty: "Beginner" },
  "Post-Race Stretch": { muscles: "Full Body", motoWhy: "Prevents stiffness and speeds recovery after racing", tips: ["Hit every major muscle group", "Hold 30-60 seconds each", "Drink water while stretching"], rest: "N/A", difficulty: "Beginner" },
};

function getDefaultDetail(exercise: Exercise) {
  return {
    muscles: exercise.block === "gym" ? "Multiple muscle groups" : exercise.block === "core" ? "Core muscles" : exercise.block === "grip" ? "Forearms & grip" : "Full body",
    motoWhy: "Builds the fitness foundation that translates directly to faster lap times and longer motos",
    tips: [exercise.notes || "Focus on form before adding weight"],
    rest: "60s",
    difficulty: "Intermediate" as const,
  };
}

export function ExerciseCard({ exercise, isActive }: ExerciseCardProps) {
  const [done, setDone] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = React.useRef(0);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const toggleTimer = useCallback(() => {
    if (timerRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setTimerRunning(false);
    } else {
      startRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
      setTimerRunning(true);
    }
  }, [timerRunning, elapsed]);

  const markDone = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerRunning(false);
    setDone(true);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const detail = exercise.sets
    ? `${exercise.sets} × ${exercise.reps || exercise.duration || "—"}`
    : exercise.duration || "";

  const info = EXERCISE_DETAILS[exercise.name] || getDefaultDetail(exercise);
  const diffColor = info.difficulty === "Advanced" ? COLORS.danger : info.difficulty === "Intermediate" ? COLORS.warning : COLORS.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleExpand}
      style={[
        styles.card,
        isActive && styles.active,
        done && styles.done,
        expanded && styles.expanded,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={[styles.name, done && styles.nameComplete]}>
            {exercise.name}
          </Text>
          {detail ? (
            <Text style={styles.detail}>{detail}</Text>
          ) : null}
        </View>
        {exercise.hr_zone ? (
          <ZoneBadge zone={exercise.hr_zone} compact />
        ) : null}
        {done && (
          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
        )}
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={COLORS.textMuted}
          style={{ marginLeft: 4 }}
        />
      </View>

      {/* Collapsed: just show notes */}
      {!expanded && exercise.notes ? (
        <Text style={styles.notes} numberOfLines={1}>{exercise.notes}</Text>
      ) : null}

      {/* Expanded detail */}
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          {/* Muscles + Difficulty */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="body" size={14} color={COLORS.primary} />
              <Text style={styles.metaText}>{info.muscles}</Text>
            </View>
            <View style={[styles.diffBadge, { borderColor: diffColor + "66" }]}>
              <Text style={[styles.diffText, { color: diffColor }]}>{info.difficulty}</Text>
            </View>
          </View>

          {/* Why for Moto */}
          <View style={styles.motoSection}>
            <Text style={styles.motoLabel}>🏍️ WHY THIS MATTERS FOR MOTO</Text>
            <Text style={styles.motoText}>{info.motoWhy}</Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsLabel}>💡 FORM TIPS</Text>
            {info.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Rest */}
          {info.rest !== "N/A" && (
            <View style={styles.restRow}>
              <Ionicons name="timer" size={14} color={COLORS.textMuted} />
              <Text style={styles.restText}>Rest: {info.rest} between sets</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.controls}>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        <View style={styles.buttons}>
          {!done && (
            <TouchableOpacity
              style={[styles.timerBtn, timerRunning && styles.timerBtnActive]}
              onPress={(e) => { e.stopPropagation(); toggleTimer(); }}
            >
              <Ionicons
                name={timerRunning ? "pause" : "play"}
                size={16}
                color={timerRunning ? COLORS.warning : COLORS.primary}
              />
            </TouchableOpacity>
          )}
          {!done && (
            <TouchableOpacity style={styles.doneBtn} onPress={(e) => { e.stopPropagation(); markDone(); }}>
              <Ionicons name="checkmark" size={16} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  active: {
    borderColor: COLORS.primary,
  },
  done: {
    opacity: 0.6,
  },
  expanded: {
    borderColor: COLORS.primary + "44",
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  nameComplete: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  detail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
    fontStyle: "italic",
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    flex: 1,
    paddingRight: 12,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  diffBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diffText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  motoSection: {
    backgroundColor: "rgba(255, 107, 0, 0.08)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.orange,
  },
  motoLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.orange,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  motoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  tipsSection: {
    marginBottom: 12,
  },
  tipsLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
    paddingLeft: 4,
  },
  tipBullet: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    flex: 1,
  },
  restRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  restText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  timer: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  timerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  timerBtnActive: {
    backgroundColor: COLORS.warning + "33",
  },
  doneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
