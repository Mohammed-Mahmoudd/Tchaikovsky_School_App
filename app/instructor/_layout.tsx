import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router, usePathname } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../components/login/AuthContext";
import { InstructorTopBar } from "../components/instructor/InstructorTopBar";
import { InstructorBottomNav } from "../components/instructor/InstructorBottomNav";
import InstructorBackground from "../components/instructor/InstructorBackground";

export default function InstructorLayout() {
  const { user, logout } = useAuth();
  const [instructorData, setInstructorData] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Redirect if not instructor
    if (!user || user.userType !== "instructor") {
      router.replace("/");
      return;
    }

    setInstructorData(user);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const getActiveTab = () => {
    if (pathname === "/instructor/feedback") return "feedback";
    if (pathname.includes("/students")) return "students";
    if (pathname.includes("/library")) return "library";
    // feedback-history should not be part of bottom navigation
    if (pathname.includes("/feedback-history")) return "none";
    return "dashboard";
  };

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case "dashboard":
        router.push("/instructor");
        break;
      case "feedback":
        router.push("/instructor/feedback");
        break;
      case "students":
        router.push("/instructor/students");
        break;
      case "library":
        router.push("/instructor/library");
        break;
    }
  };

  if (!instructorData) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        <InstructorBackground />
        <InstructorTopBar
          instructorName={instructorData.name || "Instructor"}
          role={instructorData.role || "Music Instructor"}
          onLogout={handleLogout}
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
        />
        <View style={styles.contentContainer}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
        </View>
        <InstructorBottomNav
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
    backgroundColor: "#000000", // Black to match background and eliminate color bleeding
  },
  contentContainer: {
    flex: 1,
  },
});
