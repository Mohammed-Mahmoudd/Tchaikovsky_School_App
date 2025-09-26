import { Stack } from "expo-router";
import { AuthProvider } from "./components/login/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false, // Remove the header/app bar completely
          contentStyle: { backgroundColor: 'transparent' }, // Transparent background
        }}
      />
    </AuthProvider>
  );
}
