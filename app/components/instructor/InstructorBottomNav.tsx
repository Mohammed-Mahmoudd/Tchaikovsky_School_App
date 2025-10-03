import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

interface InstructorBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function InstructorBottomNav({
  activeTab,
  onTabChange,
}: InstructorBottomNavProps) {
  const navItems = [
    { key: "dashboard", icon: "home", label: "Dashboard" },
    { key: "students", icon: "people", label: "Students" },
    { key: "feedback", icon: "send", label: "Feedback" },
    { key: "library", icon: "library", label: "Library" },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.container}>
        <View style={styles.navContainer}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.navItem,
                activeTab === item.key && styles.navItemActive,
              ]}
              onPress={() => onTabChange(item.key)}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={
                  activeTab === item.key ? "#FFFFFF" : "rgba(255,255,255,0.6)"
                }
              />
              <Text
                style={[
                  styles.navLabel,
                  activeTab === item.key && styles.navLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#1c463a",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 4, // Minimal top spacing like top bar
    paddingBottom: 4, // Minimal bottom spacing like top bar
    backgroundColor: "transparent", // No background, color comes from SafeAreaView
  },
  navContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4, // Reduced padding for compact design
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  navLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  navLabelActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
