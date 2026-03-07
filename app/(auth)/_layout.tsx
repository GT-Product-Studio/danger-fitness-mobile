import { Stack } from "expo-router";
import { COLORS } from "../../lib/constants/brand";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: "slide_from_right",
      }}
    />
  );
}
