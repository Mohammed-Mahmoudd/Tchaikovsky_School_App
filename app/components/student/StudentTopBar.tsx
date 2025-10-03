import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

interface StudentTopBarProps {
  studentName: string;
  instrument: string;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function StudentTopBar({
  studentName,
  instrument,
  onLogout,
  activeTab = "dashboard",
  onTabChange,
}: StudentTopBarProps) {
  const pathname = usePathname();

  const getScreenTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard";
      case "feedback":
        return "My Feedback";
      case "materials":
        return "My Materials";
      default:
        return "Student Portal";
    }
  };

  const isOnDashboard = activeTab === "dashboard";

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {!isOnDashboard && onTabChange && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onTabChange("dashboard")}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>{getScreenTitle()}</Text>
          <Text style={styles.subtitle}>
            {studentName} • {instrument}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 50, // Add top padding for status bar
    paddingBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  titleContainer: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
    letterSpacing: 0.2,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  navigationPills: {
    flexDirection: "row",
    marginRight: 16,
  },
  navPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  navPillText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 4,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
});
