import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";

interface InstructorTopBarProps {
  instructorName: string;
  role: string;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function InstructorTopBar({
  instructorName,
  role,
  onLogout,
  activeTab = "dashboard",
  onTabChange,
}: InstructorTopBarProps) {
  const pathname = usePathname();

  const getScreenTitle = () => {
    switch (activeTab) {
      case "students":
        return "My Students";
      case "feedback":
        return "Send Feedback";
      case "library":
        return "Music Library";
      default:
        return "Instructor Dashboard";
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: onLogout },
    ]);
  };

  const renderBackButton = () => {
    // Only show back button when not on dashboard tab and onTabChange is available
    if (!onTabChange || activeTab === "dashboard") return null;

    return (
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => onTabChange("dashboard")}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.leftSection}>
            {renderBackButton()}
            <Image
              source={require("../../../assets/appLogowithoutbarckground.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.titleContainer}>
              <Text style={styles.screenTitle}>{getScreenTitle()}</Text>
              <Text style={styles.instructorLabel}>
                {role || "Music Instructor"}
              </Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#1c463a", // Color only in SafeAreaView
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 4, // Minimal top spacing
    paddingBottom: 4, // Minimal bottom spacing for compact height
    backgroundColor: "transparent", // No background, color comes from SafeAreaView
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 0,
    marginBottom: 0, // Removed margin bottom
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  instructorLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  instructorInfo: {
    alignItems: "flex-end",
    marginRight: 16,
  },
  welcomeText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  instructorName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
});
