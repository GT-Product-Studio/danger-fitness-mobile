import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../lib/auth";
import { BLEProvider } from "../lib/ble/BLEProvider";
import { COLORS } from "../lib/constants/brand";

export default function RootLayout() {
  return (
    <AuthProvider>
      <BLEProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
            animation: "slide_from_right",
          }}
        />
      </BLEProvider>
    </AuthProvider>
  );
}
