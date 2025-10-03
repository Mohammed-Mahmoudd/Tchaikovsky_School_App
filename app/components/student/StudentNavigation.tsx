import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

interface StudentNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function StudentNavigation({ activeTab = "dashboard", onTabChange }: StudentNavigationProps) {
  const pathname = usePathname();

  return (
    <View style={styles.navigationContainer}>
      <TouchableOpacity
        style={[styles.navPill, activeTab === "dashboard" && styles.navPillActive]}
        onPress={() => onTabChange?.("dashboard")}
      >
        <Ionicons 
          name="home" 
          size={16} 
          color={activeTab === "dashboard" ? "#FFFFFF" : "rgba(255,255,255,0.7)"} 
        />
        <Text style={activeTab === "dashboard" ? styles.navPillTextActive : styles.navPillText}>
          Dashboard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navPill, activeTab === "feedback" && styles.navPillActive]}
        onPress={() => onTabChange?.("feedback")}
      >
        <Ionicons 
          name="book" 
          size={16} 
          color={activeTab === "feedback" ? "#FFFFFF" : "rgba(255,255,255,0.7)"} 
        />
        <Text style={activeTab === "feedback" ? styles.navPillTextActive : styles.navPillText}>
          Feedback
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navPill, activeTab === "materials" && styles.navPillActive]}
        onPress={() => onTabChange?.("materials")}
      >
        <Ionicons 
          name="folder" 
          size={16} 
          color={activeTab === "materials" ? "#FFFFFF" : "rgba(255,255,255,0.7)"} 
        />
        <Text style={activeTab === "materials" ? styles.navPillTextActive : styles.navPillText}>
          Materials
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navigationContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 6,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
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
    backgroundColor: "#1c463a",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
