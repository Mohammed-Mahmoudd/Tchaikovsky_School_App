import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router, usePathname } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../components/login/AuthContext";
import { StudentBottomNav } from "../components/student/StudentBottomNav";
import StudentBackground from "../components/student/StudentBackground";

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Redirect if not student
    if (!user || user.userType !== "student") {
      router.replace("/");
      return;
    }

    setStudentData(user);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const getActiveTab = () => {
    if (pathname === "/student/feedback") return "feedback";
    if (pathname.includes("/materials")) return "materials";
    // feedback-details should not be part of bottom navigation
    if (pathname.includes("/feedback-details")) return "none";
    return "dashboard";
  };

  const handleTabChange = (tab: string) => {
    // Prevent navigation to same tab for better performance
    const currentTab = getActiveTab();
    if (currentTab === tab) return;
    
    // Use replace instead of push for faster navigation and better memory management
    switch (tab) {
      case "dashboard":
        router.replace("/student");
        break;
      case "feedback":
        router.replace("/student/feedback");
        break;
      case "materials":
        router.replace("/student/materials");
        break;
    }
  };

  if (!studentData) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        <StudentBackground />
        <View style={styles.contentContainer}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
              animation: "none", // Disable animations for faster navigation
              animationDuration: 0, // Instant transitions
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="feedback" />
            <Stack.Screen name="feedback-details" />
            <Stack.Screen name="materials" />
          </Stack>
        </View>
        <StudentBottomNav
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  contentContainer: {
    flex: 1,
  },
});
