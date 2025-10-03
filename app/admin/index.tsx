import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../supabase.js";

const { width } = Dimensions.get("window");

interface Activity {
  id: string;
  type:
    | "student_added"
    | "feedback_submitted"
    | "file_uploaded"
    | "instructor_updated";
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  timestamp: Date;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    totalFiles: 0,
    recentFeedback: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardStats();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardStats();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch all statistics in parallel
      const [
        studentsResult,
        instructorsResult,
        foldersResult,
        subfoldersResult,
        feedbackResult,
      ] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase
          .from("instructors")
          .select("id", { count: "exact", head: true }),
        supabase.from("folders").select("files"),
        supabase.from("subfolders").select("files"),
        supabase.from("feedback").select("id", { count: "exact", head: true }),
      ]);

      // Calculate total files from folders and subfolders
      let totalFiles = 0;
      if (foldersResult.data) {
        foldersResult.data.forEach((folder) => {
          if (folder.files && Array.isArray(folder.files)) {
            totalFiles += folder.files.length;
          }
        });
      }
      if (subfoldersResult.data) {
        subfoldersResult.data.forEach((subfolder) => {
          if (subfolder.files && Array.isArray(subfolder.files)) {
            totalFiles += subfolder.files.length;
          }
        });
      }

      // Update stats
      setStats({
        totalStudents: studentsResult.count || 0,
        totalInstructors: instructorsResult.count || 0,
        totalFiles: totalFiles,
        recentFeedback: feedbackResult.count || 0,
      });

      // Load recent activity
      await loadRecentActivity();
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const activities: Activity[] = [];

      // Only show students if they have real created_at timestamps
      const { data: recentStudents } = await supabase
        .from("students")
        .select("name, instrument, id, created_at")
        .not("created_at", "is", null)
        .order("created_at", { ascending: false })
        .limit(2);

      if (recentStudents && recentStudents.length > 0) {
        recentStudents.forEach((student) => {
          // Only add if created_at exists and is valid
          if (student.created_at) {
            activities.push({
              id: `student_${student.id}`,
              type: "student_added",
              title: "New student enrolled",
              subtitle: `${student.name} - ${student.instrument}`,
              icon: "person-add",
              color: "#4CAF50",
              timestamp: new Date(student.created_at),
            });
          }
        });
      }

      // Get recent feedback (last 2)
      const { data: recentFeedback } = await supabase
        .from("feedback")
        .select(
          `
          comment,
          created_at,
          student_id,
          instructor_id,
          id,
          session_type,
          homework_rating
        `
        )
        .order("created_at", { ascending: false })
        .limit(2);

      if (recentFeedback) {
        // Get student and instructor names for each feedback
        for (const feedback of recentFeedback) {
          const [studentResult, instructorResult] = await Promise.all([
            supabase
              .from("students")
              .select("name")
              .eq("id", feedback.student_id)
              .single(),
            supabase
              .from("instructors")
              .select("name")
              .eq("id", feedback.instructor_id)
              .single(),
          ]);

          const sessionType = feedback.session_type || "lesson";
          const rating = feedback.homework_rating ? ` (${feedback.homework_rating}/5 ⭐)` : "";
          
          activities.push({
            id: `feedback_${feedback.id}`,
            type: "feedback_submitted",
            title: "Lesson feedback added",
            subtitle: `${instructorResult.data?.name || "Instructor"} reviewed ${studentResult.data?.name || "Student"}'s ${sessionType}${rating}`,
            icon: "chatbubble",
            color: "#FF9800",
            timestamp: new Date(feedback.created_at),
          });
        }
      }

      // Only show instructors if they have real created_at timestamps
      const { data: recentInstructors } = await supabase
        .from("instructors")
        .select("name, role, id, created_at")
        .not("created_at", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentInstructors && recentInstructors.length > 0) {
        const instructor = recentInstructors[0];
        // Only add if created_at exists and is valid
        if (instructor.created_at) {
          activities.push({
            id: `instructor_${instructor.id}`,
            type: "instructor_updated",
            title: "New instructor added",
            subtitle: `${instructor.name} - ${instructor.role || "Music Instructor"}`,
            icon: "school",
            color: "#2196F3",
            timestamp: new Date(instructor.created_at),
          });
        }
      }

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setRecentActivity(activities.slice(0, 5)); // Show 5 most recent activities
    } catch (error) {
      console.error("Error loading recent activity:", error);
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>System Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={32} color="#4CAF50" />
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#4CAF50"
                style={{ marginVertical: 8 }}
              />
            ) : (
              <Text style={styles.statNumber}>{stats.totalStudents}</Text>
            )}
            <Text style={styles.statLabel}>Students</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="school" size={32} color="#2196F3" />
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#2196F3"
                style={{ marginVertical: 8 }}
              />
            ) : (
              <Text style={styles.statNumber}>{stats.totalInstructors}</Text>
            )}
            <Text style={styles.statLabel}>Instructors</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="folder" size={32} color="#FF9800" />
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#FF9800"
                style={{ marginVertical: 8 }}
              />
            ) : (
              <Text style={styles.statNumber}>{stats.totalFiles}</Text>
            )}
            <Text style={styles.statLabel}>Files</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="chatbubbles" size={32} color="#9C27B0" />
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#9C27B0"
                style={{ marginVertical: 8 }}
              />
            ) : (
              <Text style={styles.statNumber}>{stats.recentFeedback}</Text>
            )}
            <Text style={styles.statLabel}>Total Feedback</Text>
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
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activityContainer}>
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              loadDashboardStats();
              setLastRefresh(new Date());
            }}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.lastRefreshText}>
          Last updated: {lastRefresh.toLocaleTimeString()}
        </Text>
        <View style={styles.activityCard}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1c463a" />
              <Text style={styles.loadingText}>Loading recent activity...</Text>
            </View>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <View
                key={activity.id}
                style={[
                  styles.activityItem,
                  index === recentActivity.length - 1 &&
                    styles.lastActivityItem,
                ]}
              >
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={activity.icon as any}
                    size={20}
                    color={activity.color}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activitySubtitle}>
                    {activity.subtitle} • {formatTimeAgo(activity.timestamp)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="time-outline"
                size={48}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.emptyText}>No recent activity</Text>
            </View>
          )}
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
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
    letterSpacing: 0.4,
    textShadowColor: "rgba(28, 70, 58, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statsContainer: {
    marginBottom: 28,
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
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 8,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 0.2,
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
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  action3DContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
    overflow: "hidden",
    backgroundColor: "rgba(28,70,58,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  canvas3D: {
    width: 64,
    height: 64,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 18,
    fontWeight: "500",
    letterSpacing: 0.1,
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
  lastActivityItem: {
    borderBottomWidth: 0,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    marginTop: 12,
    fontWeight: "600",
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  lastRefreshText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 16,
    fontWeight: "500",
    fontStyle: "italic",
  },
});
