# TASK: Build Phase 2 — BLE Heart Rate Integration

Read BUILD_SPEC.md for full context. This is the Danger Fitness React Native mobile app.

## What to Build

### 1. BLE Heart Rate Service (`lib/ble/`)

**`lib/ble/heart-rate.ts`** — BLE HR data parser
- Parse standard BLE Heart Rate Measurement characteristic (UUID 0x2A37)
- Handle both UINT8 and UINT16 HR formats (check bit 0 of flags byte)
- Extract RR intervals when present (bit 4 of flags)
- Extract energy expended when present (bit 3 of flags)
- Export types: `HeartRateData { hr: number, rrIntervals: number[], energyExpended?: number, sensorContact: boolean }`

**`lib/ble/device-scanner.ts`** — Device discovery
- Scan for BLE devices advertising Heart Rate Service (UUID 0x180D)
- Return discovered devices with: id, name, rssi (signal strength)
- Auto-stop scan after 15 seconds
- Handle Bluetooth permission requests (iOS + Android)
- Export: `scanForHRDevices(): Promise<BLEDevice[]>`, `stopScan(): void`

**`lib/ble/BLEProvider.tsx`** — React Context for BLE state
- Context providing: connectionState, connectedDevice, currentHR, currentZone, hrHistory (last 60 samples), isScanning
- Methods: startScan(), connect(deviceId), disconnect(), startHRStream(), stopHRStream()
- Auto-reconnect if connection drops during workout
- Store last connected device ID in AsyncStorage for auto-reconnect on app launch
- Calculate HR zone using getHRZone() from lib/constants/brand.ts
- Keep rolling 60-second HR history for the live graph

**`lib/ble/hr-zones.ts`** — Zone calculation utilities
- getZoneForHR(hr, maxHR) → zone number 1-5
- getZoneColor(zone) → color string
- getZoneLabel(zone) → "Easy", "Fat Burn", etc.
- getTimeInZones(samples) → { z1: seconds, z2: seconds, ... }
- Default maxHR = 190 (user configurable in settings)

### 2. HR Display Components (`components/hr/`)

**`components/hr/HeartRateDisplay.tsx`**
- LARGE heart rate number (60pt+ font, monospace)
- Background pulses/glows with zone color
- Shows zone label below ("ZONE 3 — AEROBIC")
- Animated heart icon that pulses with each beat
- If no device connected, shows "--" with "Connect Watch" prompt
- If connected but not streaming, shows last known HR grayed out

**`components/hr/HRZoneBar.tsx`**
- Horizontal bar showing time distribution across zones
- 5 colored segments (Z1 gray, Z2 green, Z3 gold, Z4 orange, Z5 red)
- Shows percentage or minutes in each zone
- Used in workout summary and per-exercise stats

**`components/hr/LiveHRGraph.tsx`**
- Scrolling line chart showing last 60 seconds of HR data
- X-axis: time (scrolling left)
- Y-axis: HR value (auto-scaling)
- Zone color bands in background (horizontal stripes at zone boundaries)
- Line color changes based on current zone
- Smooth animation as new data points arrive
- Use react-native-svg for drawing (install it)

**`components/hr/DeviceStatus.tsx`**
- Small indicator showing BLE device status
- States: disconnected (gray dot), connecting (pulsing yellow), connected (solid green dot + device name), streaming (pulsing green dot + HR value)
- Tap to open device connection sheet
- Shows battery level if available

### 3. Device Connection Screen (`app/connect-device.tsx`)

- Full screen for scanning and connecting BLE HR devices
- "Scan for Devices" button with pulsing animation while scanning
- List of discovered devices showing: name, signal strength (RSSI bars), type icon
- Tap device to connect
- Connection progress indicator
- Success state with device info (name, battery if available)
- "Skip for now" option
- "Supported Devices" section listing compatible watches/straps
- Remember last connected device for auto-reconnect

### 4. Live Workout Screen (`app/workout/live.tsx`)

Full-screen active workout mode with live HR:

**Layout:**
- Top: elapsed time (large), exercise X of Y
- Center: MASSIVE heart rate number (72pt), zone-colored background, zone label
- Middle: LiveHRGraph (last 60 seconds)
- Bottom: current exercise card + NEXT/PREVIOUS buttons

**Features:**
- Receives workout data (exercises) and BLE HR stream
- Tracks time per exercise
- Records HR samples to local state (batch to Supabase later)
- Exercise navigation (next/previous/skip)
- Pause/resume workout
- "FINISH WORKOUT" button with confirmation modal
- Post-workout summary: total time, avg HR, max HR, zone breakdown (HRZoneBar), per-exercise HR stats
- On finish: batch insert HR samples to `ble_hr_samples` table, compute and store `exercise_hr_summary` rows

### 5. Update Existing Screens

**Update `app/workout/[day].tsx`:**
- Add DeviceStatus indicator at top
- "START WORKOUT" button checks BLE connection
- If connected: navigates to `workout/live` with exercise data
- If not connected: shows prompt to connect device first (with link to connect-device screen)
- Still allow starting without HR device (just no HR data)

**Update `app/(tabs)/index.tsx` (Dashboard):**
- Add DeviceStatus component showing current BLE connection
- If connected and not in workout, show current resting HR

**Update `app/(tabs)/settings.tsx`:**
- Add "Heart Rate Monitor" section
- Show connected device name or "Not Connected"
- "Connect Device" / "Disconnect" buttons
- Max HR input field (default 190, used for zone calculation)
- Save maxHR to AsyncStorage

### 6. Install Dependencies

Run: `npm install react-native-svg --legacy-peer-deps`

## Design Rules
- Dark theme: background #0A0A0A, surface #141414, primary #29F000
- HR number: massive (60-72pt), monospace font, zone-colored
- Zone colors: Z1=#808080, Z2=#29F000, Z3=#FFD700, Z4=#FF6B00, Z5=#FF0000
- Animations: subtle green glow on connected state, pulsing heart icon
- Import colors from `lib/constants/brand.ts` (COLORS, HR_ZONES, getHRZone, getHRZoneColor)
- Import supabase from `lib/supabase.ts`

## When Done

Run:
```
npm install react-native-svg --legacy-peer-deps
npx tsc --noEmit
git add -A && git commit -m "Phase 2: BLE heart rate — scanner, live HR display, workout mode, zone tracking" && git push origin main
openclaw system event --text "Done: Danger Fitness Phase 2 complete — BLE heart rate scanning, device connection, live HR display with zone colors, live workout screen with HR graph, per-exercise HR tracking, zone time breakdown. Works with Polar, Garmin, Wahoo, any BLE HR device." --mode now
```
