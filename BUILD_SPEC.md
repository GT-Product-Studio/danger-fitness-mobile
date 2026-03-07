# Danger Fitness — React Native Mobile App Build Spec

## Overview
Premium fitness tracking app for Haiden Deegan's "Danger Fitness" brand. $19.99/mo subscription. 30-day training program with real-time Bluetooth heart rate monitoring during workouts, monthly challenges with leaderboards, and live HR zone display.

**This is the primary product.** The web app (deegan-fitness.vercel.app) becomes the companion dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native with Expo SDK 55 (development build, NOT Expo Go) |
| Language | TypeScript |
| Navigation | Expo Router (file-based routing) |
| State | React Context + hooks (no Redux) |
| Backend | Supabase (existing project: `tmziujmbhxgivgsecyrv`) |
| Auth | Supabase Auth (`@supabase/supabase-js`) |
| BLE | `react-native-ble-plx` (standard BLE Heart Rate Service) |
| Storage | `expo-secure-store` (tokens), `@react-native-async-storage/async-storage` (cache) |
| Notifications | `expo-notifications` |
| Animations | `react-native-reanimated` |
| Charts | `victory-native` or `react-native-chart-kit` (HR zone charts) |
| Subscriptions | RevenueCat (handles App Store + Play Store billing) |
| Icons | `@expo/vector-icons` (Ionicons) |

### Why NOT the Polar BLE SDK
The Polar BLE SDK requires complex watch pairing (SDK mode, specific menu navigation), only works from the watch's "exercise wait view," and is Polar-only. Instead, we use **standard BLE Heart Rate Service (UUID 0x180D)** via `react-native-ble-plx`:
- Works with ANY BLE heart rate device (Polar, Garmin, Wahoo, Apple Watch, chest straps)
- No special watch setup — just enable HR broadcast
- Continuous HR streaming from any watch state
- Standard BLE spec: heart rate, RR intervals, energy expenditure, sensor contact
- Well-maintained library with Expo config plugin support

### Why NOT Expo Go
BLE requires native modules. We use Expo development builds (`expo-dev-client`) which compile custom native code while keeping the Expo developer experience (hot reload, OTA updates, EAS Build).

---

## Brand & Design System

### Colors
```
Background:     #0A0A0A (near-black)
Surface:        #141414 (cards, modals)
Surface Alt:    #1A1A1A (elevated surfaces)
Border:         #2A2A2A
Primary:        #29F000 (BRAAP neon lime green)
Primary Dark:   #22D400 (pressed/hover states)
Primary Glow:   rgba(41, 240, 0, 0.15) (subtle glow effects)
Text Primary:   #FFFFFF
Text Secondary: #A0A0A0
Text Muted:     #666666
Danger:         #FF4444
Warning:        #FFD700 (gold)
```

### HR Zone Colors
```
Z1 (50-60% max): #808080 (gray)   — Easy / Warm Up
Z2 (60-70% max): #29F000 (green)  — Fat Burn
Z3 (70-80% max): #FFD700 (gold)   — Aerobic
Z4 (80-90% max): #FF6B00 (orange) — Threshold
Z5 (90-100% max): #FF0000 (red)   — Max Effort
```

### Typography
```
Headings:  System bold / Oswald (if custom fonts loaded)
Body:      System default
Monospace: System monospace (timers, HR numbers)
```

### Design Principles
- Dark theme only (motorsport aesthetic)
- BRAAP green accents on interactive elements
- Large touch targets (48px minimum)
- Bold numbers for HR/stats (48-72pt)
- Subtle green glow on active/connected states
- Card-based layout with rounded corners (12px)
- No gradients — clean flat surfaces with border separation
- Motion: subtle, purposeful (use sparingly)

---

## Supabase Backend (EXISTING — shared with web app)

### Project Details
- **Ref:** `tmziujmbhxgivgsecyrv`
- **URL:** `https://tmziujmbhxgivgsecyrv.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteml1am1iaHhnaXZnc2VjeXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjkxMjcsImV4cCI6MjA4ODQwNTEyN30.y6DI79Xn1Zrl4PSSOPu22AjaREPN6b7NsE7jTcLibnA`

### Existing Tables (DO NOT recreate — query only)
- `workouts` — 30 days seeded (day_number 1-30)
- `exercises` — 186 exercises with blocks (cycling/moto/gym/recovery/race)
- `challenges` — Monthly challenges (March + April seeded)
- `activity_logs` — User challenge activity entries
- `challenge_leaderboard` — VIEW aggregating scores
- `profiles` — User profiles (started_at for day calculation)
- `progress` — Workout completion tracking
- `subscriptions` — Stripe subscription status
- `workout_sessions` — Workout timer sessions
- `exercise_timestamps` — Per-exercise timing data
- `wearable_connections` — OAuth wearable connections (for web AccessLink, not used in mobile BLE)

### New Table Needed: `ble_hr_samples`
```sql
CREATE TABLE ble_hr_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  heart_rate INTEGER NOT NULL,
  rr_intervals JSONB, -- array of RR intervals in ms
  hr_zone INTEGER, -- calculated zone 1-5
  device_name TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries during active workout
CREATE INDEX idx_ble_hr_session ON ble_hr_samples(session_id, timestamp);
CREATE INDEX idx_ble_hr_user_time ON ble_hr_samples(user_id, timestamp DESC);

-- RLS: users can only access own HR data
ALTER TABLE ble_hr_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own HR data" ON ble_hr_samples
  FOR ALL USING (auth.uid() = user_id);
```

### New Table: `exercise_hr_summary`
```sql
-- Aggregated HR stats per exercise (computed after workout ends)
CREATE TABLE exercise_hr_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  hr_avg INTEGER,
  hr_max INTEGER,
  hr_min INTEGER,
  hr_zone_minutes JSONB, -- {"z1": 2.5, "z2": 5.0, "z3": 3.2, ...}
  calories_estimated INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, exercise_id)
);

ALTER TABLE exercise_hr_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own HR summaries" ON exercise_hr_summary
  FOR ALL USING (auth.uid() = user_id);
```

---

## App Architecture

### File Structure (Expo Router)
```
danger-fitness-mobile/
├── app/
│   ├── _layout.tsx              # Root layout (auth provider, BLE provider)
│   ├── index.tsx                # Splash → redirect to auth or tabs
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── reset-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Bottom tab navigator
│   │   ├── index.tsx            # Home / Dashboard
│   │   ├── program.tsx          # 30-Day Program Overview
│   │   ├── challenge.tsx        # Monthly Challenge
│   │   └── settings.tsx         # Settings & Account
│   ├── workout/
│   │   ├── [day].tsx            # Workout day view (exercise list + timer)
│   │   └── live.tsx             # Active workout with live HR
│   └── onboarding/
│       ├── _layout.tsx
│       ├── welcome.tsx
│       ├── connect-device.tsx   # BLE device pairing
│       └── subscription.tsx     # Payment setup
├── components/
│   ├── ui/                      # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   └── ZoneBadge.tsx
│   ├── workout/
│   │   ├── ExerciseCard.tsx     # Single exercise with HR tracking
│   │   ├── ExerciseBlock.tsx    # Grouped exercises (cycling/moto/gym)
│   │   ├── WorkoutTimer.tsx     # Master workout timer
│   │   ├── ExerciseTimer.tsx    # Per-exercise timer
│   │   └── DayNavigation.tsx    # Prev/Next day buttons
│   ├── hr/
│   │   ├── HeartRateDisplay.tsx # Large HR number with zone color
│   │   ├── HRZoneBar.tsx        # Zone distribution bar
│   │   ├── LiveHRGraph.tsx      # Real-time scrolling HR chart
│   │   └── DeviceStatus.tsx     # BLE connection indicator
│   ├── challenge/
│   │   ├── LeaderboardList.tsx
│   │   ├── ChallengeProgress.tsx
│   │   ├── ActivityLogger.tsx
│   │   └── ScoreCard.tsx
│   └── common/
│       ├── HaidenBenchmark.tsx  # "vs Haiden" comparison
│       └── BlockIcon.tsx        # 🚴🏍️🏋️🧘🏁 icons
├── lib/
│   ├── supabase.ts              # Supabase client init
│   ├── auth.tsx                 # Auth context provider
│   ├── ble/
│   │   ├── BLEProvider.tsx      # BLE context (connection state, HR stream)
│   │   ├── heart-rate.ts        # BLE HR service parser (0x180D)
│   │   ├── device-scanner.ts    # Scan for BLE HR devices
│   │   └── hr-zones.ts          # Zone calculation from max HR
│   ├── hooks/
│   │   ├── useWorkout.ts        # Workout day data fetching
│   │   ├── useChallenge.ts      # Challenge data + leaderboard
│   │   ├── useHeartRate.ts      # Live HR stream hook
│   │   ├── useWorkoutTimer.ts   # Timer state management
│   │   └── useProfile.ts       # User profile + day calculation
│   └── constants/
│       ├── brand.ts             # Colors, brand strings
│       ├── hr-zones.ts          # Zone thresholds and colors
│       └── scoring.ts           # Challenge scoring formula
├── assets/
│   ├── images/                  # App images (Haiden photos)
│   └── fonts/                   # Custom fonts if needed
├── app.json                     # Expo config
├── eas.json                     # EAS Build config
├── tsconfig.json
└── package.json
```

---

## Screen-by-Screen Specification

### 1. Splash / Index (`app/index.tsx`)
- Check auth state
- If authenticated → redirect to `(tabs)`
- If not → redirect to `(auth)/login`
- If first launch → redirect to `onboarding/welcome`
- Show Danger Fitness logo + BRAAP green pulse animation during load

### 2. Auth Screens (`app/(auth)/`)

#### Login
- Email + password fields
- "Sign In" button (BRAAP green)
- "Don't have an account? Sign Up" link
- "Forgot password?" link
- Dark card on #0A0A0A background
- Danger Fitness logo at top

#### Register
- Full name, email, password fields
- "Create Account" button
- "Already have an account? Sign In" link
- Auto-create profile row on signup

#### Reset Password
- Email field
- "Send Reset Link" button
- Success state with instructions

### 3. Onboarding (`app/onboarding/`)

#### Welcome (3 swipeable slides)
1. **"TRAIN WITH HAIDEN"** — Hero image of Haiden, brief intro
2. **"REAL-TIME HR TRACKING"** — Connect your watch, see zones live
3. **"COMPETE MONTHLY"** — The Danger Challenge, leaderboards

#### Connect Device
- "Connect Heart Rate Monitor" header
- Scan for BLE devices button (pulsing green animation while scanning)
- List of discovered HR devices with signal strength
- Tap to connect → pairing confirmation
- "Skip for now" option
- Supported devices note: "Works with Polar, Garmin, Wahoo, and any Bluetooth heart rate monitor"

#### Subscription
- "$19.99/month" prominent display
- Feature list (program, challenges, HR tracking, leaderboard)
- "Start Training" button → RevenueCat checkout
- "Restore Purchase" link
- 7-day free trial option

### 4. Home / Dashboard (`app/(tabs)/index.tsx`)

**Top section:**
- "Day X of 30" with circular progress ring (BRAAP green)
- Today's workout title and day_type
- HR device connection status (green dot = connected, gray = disconnected)
- If connected: current resting HR display

**Today's Workout Card:**
- Workout title (e.g., "Foundation: Full Body + Road Ride")
- Exercise block summary (🚴 50mi, 🏍️ 2hr, 🏋️ 1.5hr)
- "START WORKOUT" button (large, BRAAP green, full width)
- If workout in progress: "CONTINUE WORKOUT" with elapsed time

**Monthly Challenge Card:**
- Current challenge name + days remaining
- Your score vs Haiden's benchmark (progress bar)
- Your rank on leaderboard (#X of Y)
- Tap to go to full challenge view

**Quick Stats Row:**
- Workouts completed this week
- Total training hours
- Average HR this week

### 5. Program Overview (`app/(tabs)/program.tsx`)

- "THE REGIMENT — 30 Days" header
- 4 week sections:
  - **Week 1-2: Foundation** (Days 1-14)
  - **Week 3: Build** (Days 15-21)
  - **Week 4: Intensity** (Days 22-28)
  - **Days 29-30: Peak & Taper**
- Each day as a card showing:
  - Day number + title
  - Block icons (🚴🏍️🏋️)
  - Completion checkmark if done
  - Lock icon if subscription inactive
- Tap → navigate to workout/[day]
- Current day highlighted with green border

### 6. Workout Day (`app/workout/[day].tsx`)

**Header:**
- "Day X" with day title
- Prev/Next day navigation arrows
- Back button

**Exercise List (grouped by block):**

Each block section:
- Block header with icon and color (🚴 Road Ride — green, 🏍️ Moto Practice — orange, etc.)
- HR zone badge for the block
- Exercise cards within block:
  - Exercise name, sets × reps or duration
  - Notes/instructions
  - HR zone indicator
  - Individual exercise timer (start/done buttons)

**Workout Controls (bottom sticky bar):**
- Before starting: "START WORKOUT — Connect Watch" button
  - If no BLE device connected: prompt to connect first
  - If connected: show device name + battery
- During workout:
  - Live HR display (large number, zone-colored background)
  - Elapsed time
  - Current exercise indicator
  - "FINISH WORKOUT" button
- After workout:
  - Summary card with total time, avg HR, max HR, zone breakdown
  - Per-exercise HR stats
  - "Share Results" option
  - Challenge points earned

### 7. Active Workout / Live HR (`app/workout/live.tsx`)

Full-screen workout mode:

**Top bar:**
- Elapsed time (large)
- Current exercise name
- Exercise X of Y

**Center (hero area):**
- MASSIVE heart rate number (72pt+)
- Zone color background pulse effect
- Zone label (e.g., "ZONE 3 — AEROBIC")
- BPM label

**HR Graph:**
- Scrolling real-time line chart (last 60 seconds)
- Zone color bands in background
- Current value dot

**Exercise Controls:**
- Current exercise card (name, target sets/reps)
- "NEXT EXERCISE" button
- "PREVIOUS" button
- Exercise progress dots

**Bottom:**
- "PAUSE" button
- "FINISH WORKOUT" button (with confirmation)

### 8. Challenge (`app/(tabs)/challenge.tsx`)

**Challenge Header:**
- Month name + "DANGER CHALLENGE"
- Days remaining countdown
- Start/end dates

**Your Progress:**
- Total score with breakdown:
  - 🚴 Cycling miles × 1 point
  - 🏍️ Moto hours × 25 points
  - 🏋️ Gym hours × 20 points
- Progress bar: your score vs Haiden's benchmark (1690 pts)
- % of Haiden's benchmark

**Activity Logger:**
- Quick-add buttons for each type
- Manual entry: type, value, date
- Auto-logged from workout sessions

**Leaderboard:**
- Top 10 + your position
- Each row: rank, name, avatar, score
- Your row always visible (sticky if scrolled past)
- Pull-to-refresh

### 9. Settings (`app/(tabs)/settings.tsx`)

**Account Section:**
- Profile (name, email, avatar)
- Change password
- Sign out

**Heart Rate Monitor:**
- Connected device name + battery level
- "Disconnect" / "Connect New Device" buttons
- Max HR setting (for zone calculation, default 220-age)
- HR zone thresholds (auto-calculated, editable)

**Subscription:**
- Current plan status
- Manage subscription (→ RevenueCat management)
- Restore purchases

**App:**
- Notifications on/off
- Units (miles/km)
- About / Version
- Privacy Policy / Terms

---

## BLE Heart Rate Integration (CRITICAL)

### Standard BLE Heart Rate Service
- **Service UUID:** `0x180D` (Heart Rate)
- **Characteristic UUID:** `0x2A37` (Heart Rate Measurement)
- **Characteristic UUID:** `0x2A38` (Body Sensor Location)
- **Characteristic UUID:** `0x2A39` (Heart Rate Control Point)

### Heart Rate Measurement Data Format
```
Byte 0 (Flags):
  Bit 0: HR format (0 = UINT8, 1 = UINT16)
  Bit 1-2: Sensor contact status
  Bit 3: Energy expended present
  Bit 4: RR interval present

Byte 1(-2): Heart rate value (UINT8 or UINT16)
Subsequent: Energy expended (UINT16) if flag set
Subsequent: RR intervals (UINT16, 1/1024 sec resolution) if flag set
```

### BLE Flow
1. **Scan:** Discover devices advertising HR service (0x180D)
2. **Connect:** User selects device from list
3. **Subscribe:** Start notifications on HR Measurement characteristic (0x2A37)
4. **Stream:** Parse incoming HR data packets, emit to React context
5. **Record:** Store samples to `ble_hr_samples` table (batch every 5 seconds to reduce writes)
6. **Disconnect:** Cleanup on workout end or manual disconnect

### Zone Calculation
```typescript
function getHRZone(hr: number, maxHR: number): number {
  const pct = hr / maxHR;
  if (pct >= 0.90) return 5; // Max effort
  if (pct >= 0.80) return 4; // Threshold
  if (pct >= 0.70) return 3; // Aerobic
  if (pct >= 0.60) return 2; // Fat burn
  return 1;                   // Easy
}
// Default maxHR = 220 - age (user can override in settings)
// Haiden's maxHR: 210
```

### Offline Support
- HR data stored locally first (AsyncStorage buffer)
- Batch sync to Supabase when connection available
- Workout sessions fully functional offline
- Queue challenge activity logs for sync

---

## Scoring System (same as web)
```
Score = cycling_miles × 1 + moto_hours × 25 + gym_hours × 20
Haiden's monthly benchmark: 1690 points
```

---

## Subscription (RevenueCat)

### Why RevenueCat over raw Stripe
- Handles App Store + Google Play billing (required for in-app subscriptions)
- Apple REQUIRES in-app purchase for digital content subscriptions
- Cross-platform subscription status sync
- Built-in analytics, trial management, paywall A/B testing
- Stripe handles web; RevenueCat handles mobile

### Setup
- Product ID: `danger_fitness_monthly` ($19.99/mo)
- 7-day free trial
- RevenueCat SDK: `react-native-purchases`
- Entitlement: `premium` (checked before showing workout content)

---

## Push Notifications

### Notification Types
1. **Daily Workout Reminder** — "Day X is ready. Let's go." (configurable time, default 8 AM)
2. **Challenge Update** — "You moved up to #3 on the leaderboard!"
3. **Challenge Start** — "The [Month] Danger Challenge starts today"
4. **Workout Streak** — "5 days in a row. Keep the streak alive."
5. **Watch Reminder** — "Don't forget to connect your watch before starting"

---

## Performance Considerations

### HR Data Sampling
- BLE HR typically sends 1 sample/second
- Buffer locally, batch insert to Supabase every 5 seconds (5 samples at a time)
- During workout, only render current HR + last 60 seconds of graph data
- Full HR timeline computed post-workout from stored samples

### Offline-First
- Cache today's workout data on launch
- Cache challenge data + leaderboard
- Workout sessions work fully offline
- Sync queue for any pending writes

### Image Optimization
- Use Haiden images at 2x resolution for Retina
- Lazy load program day images
- Cache aggressively with Expo Image

---

## Build & Deploy

### EAS Build Config
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### App Store Metadata
- **App Name:** Danger Fitness
- **Bundle ID:** `com.dangerfitness.app`
- **Category:** Health & Fitness
- **Age Rating:** 4+
- **Keywords:** fitness, motocross, haiden deegan, workout, heart rate, training

### Required Permissions
- Bluetooth (BLE scanning + connection)
- Notifications
- Internet access

---

## Implementation Priority

### Phase 1 — Core App (THIS BUILD)
1. Project setup (Expo, TypeScript, navigation)
2. Auth screens (login, register, reset)
3. Supabase integration (same backend)
4. Home dashboard
5. Program overview (30 days)
6. Workout day view with exercise list
7. Workout timer (start/stop per exercise)
8. Design system (all components styled)
9. Bottom tab navigation

### Phase 2 — BLE Heart Rate
10. BLE scanning + device connection
11. HR streaming + zone calculation
12. Live HR display during workout
13. HR data recording to Supabase
14. Post-workout HR summary
15. Per-exercise HR stats
16. Settings: device management, max HR

### Phase 3 — Challenge + Social
17. Monthly challenge dashboard
18. Activity logger (manual + auto from workouts)
19. Leaderboard (real-time updates)
20. Score calculation + Haiden benchmark comparison

### Phase 4 — Subscription + Polish
21. RevenueCat integration
22. Paywall + subscription management
23. Onboarding flow
24. Push notifications
25. Offline support + sync queue
26. App Store submission

---

## Test Account
- Email: `stephen@dangerfitness.com`
- Password: `DangerBoy2026!`
- User ID: `bcf8604e-069c-4bea-bb94-2f5a84cad7d5`
- Profile `started_at`: 2026-03-01

---

## Haiden Deegan Facts (for content/copy)
- Age: 20 (born Jan 10, 2006)
- From: Temecula, California
- Team: Monster Energy Yamaha Star Racing
- Titles: 2× 250cc SMX Champion, 2× AMA Motocross 250cc, 2025 AMA Supercross 250cc West
- Daily training: 50mi cycling, 2hr moto, 1.5hr gym
- HR: Peak 210 / Resting 42
- Social: ~2M Instagram, ~1.4M TikTok, YouTube @DangerBoyDeegan
- Nickname: "Danger Boy"
