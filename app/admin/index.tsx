import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    totalFiles: 0,
    recentFeedback: 0,
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    // TODO: Load actual stats from Supabase
    setStats({
      totalStudents: 45,
      totalInstructors: 12,
      totalFiles: 128,
      recentFeedback: 23,
    });
  };

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>System Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{stats.totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="school" size={32} color="#2196F3" />
            <Text style={styles.statNumber}>{stats.totalInstructors}</Text>
            <Text style={styles.statLabel}>Instructors</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="folder" size={32} color="#FF9800" />
            <Text style={styles.statNumber}>{stats.totalFiles}</Text>
            <Text style={styles.statLabel}>Files</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="chatbubbles" size={32} color="#9C27B0" />
            <Text style={styles.statNumber}>{stats.recentFeedback}</Text>
            <Text style={styles.statLabel}>Recent Feedback</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/admin/users" as any)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="people" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>Manage Users</Text>
            <Text style={styles.actionSubtitle}>
              Create, edit, and manage student & instructor accounts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/admin/files" as any)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="cloud-upload" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>File Management</Text>
            <Text style={styles.actionSubtitle}>
              Upload, organize, and manage musical files
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/admin/feedback" as any)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="chatbubbles" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>View Feedback</Text>
            <Text style={styles.actionSubtitle}>
              Monitor all instructor feedback to students
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/admin/settings" as any)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="settings" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>System Settings</Text>
            <Text style={styles.actionSubtitle}>
              Configure app settings and permissions
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="person-add" size={20} color="#4CAF50" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>New student registered</Text>
              <Text style={styles.activitySubtitle}>
                Emma Johnson - Piano • 2 hours ago
              </Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="cloud-upload" size={20} color="#2196F3" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Files uploaded</Text>
              <Text style={styles.activitySubtitle}>
                Bach Inventions Collection • 5 hours ago
              </Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="chatbubble" size={20} color="#FF9800" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Feedback submitted</Text>
              <Text style={styles.activitySubtitle}>
                John Smith reviewed Sarah's lesson • 1 day ago
              </Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="school" size={20} color="#9C27B0" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Instructor updated</Text>
              <Text style={styles.activitySubtitle}>
                Maria Garcia - Profile updated • 2 days ago
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 20,
    letterSpacing: 0.5,
    textShadowColor: "rgba(28, 70, 58, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statsContainer: {
    marginBottom: 40,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  statCard: {
    width: (width - 64) / 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  actionsContainer: {
    marginBottom: 40,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  actionCard: {
    width: (width - 64) / 2,
    backgroundColor: "rgba(28,70,58,0.4)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#1c463a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 18,
    fontWeight: "500",
  },
  activityContainer: {
    marginBottom: 40,
  },
  activityCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  activitySubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
});
