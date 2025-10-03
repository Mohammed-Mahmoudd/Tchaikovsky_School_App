import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";

interface AdminTopBarProps {
  adminName: string;
  onLogout: () => void;
}

export function AdminTopBar({ adminName, onLogout }: AdminTopBarProps) {
  const pathname = usePathname();

  const getScreenTitle = () => {
    switch (pathname) {
      case "/admin/users":
        return "User Management";
      case "/admin/files":
        return "File Management";
      case "/admin/feedback":
        return "Feedback Overview";
      case "/admin/settings":
        return "System Settings";
      default:
        return "Admin Dashboard";
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: onLogout },
    ]);
  };

  const renderBackButton = () => {
    if (pathname === "/admin" || pathname === "/admin/") return null;

    return (
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/admin" as any)}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#1c463a", "#0d2e24"]} style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.leftSection}>
            {renderBackButton()}
            <View style={styles.titleContainer}>
              <Text style={styles.screenTitle}>{getScreenTitle()}</Text>
              <Text style={styles.adminLabel}>Administrator</Text>
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

        {/* Navigation Pills - Only show on dashboard */}
        {(pathname === "/admin" || pathname === "/admin/") && (
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navPill, styles.navPillActive]}
              onPress={() => router.push("/admin" as any)}
            >
              <Ionicons name="home" size={16} color="#FFFFFF" />
              <Text style={styles.navPillTextActive}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navPill}
              onPress={() => router.push("/admin/users" as any)}
            >
              <Ionicons name="people" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.navPillText}>Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navPill}
              onPress={() => router.push("/admin/files" as any)}
            >
              <Ionicons name="folder" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.navPillText}>Files</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navPill}
              onPress={() => router.push("/admin/feedback" as any)}
            >
              <Ionicons
                name="chatbubbles"
                size={16}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.navPillText}>Feedback</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#1c463a",
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    marginBottom: 20,
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
  adminLabel: {
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
  adminInfo: {
    alignItems: "flex-end",
    marginRight: 16,
  },
  welcomeText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  adminName: {
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
  navigationContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  navPillActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  navPillText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 4,
    fontWeight: "600",
  },
  navPillTextActive: {
    fontSize: 10,
    color: "#FFFFFF",
    marginLeft: 4,
    fontWeight: "700",
  },
});
