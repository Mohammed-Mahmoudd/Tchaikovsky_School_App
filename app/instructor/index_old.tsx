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
import { useAuth } from "../components/login/AuthContext";

const { width } = Dimensions.get("window");

interface Student {
  id: number;
  name: string;
  instrument: string;
  avatar?: string;
  color?: string;
}

interface RecentFeedback {
  id: number;
  student_name: string;
  session_type: string;
  homework_rating: number;
  created_at: string;
}

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myStudents: 0,
    totalFeedback: 0,
    thisWeekFeedback: 0,
    averageRating: 0,
  });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadInstructorData();
    }
  }, [user]);

  const loadInstructorData = async () => {
    try {
      setLoading(true);
      const instructorId = user?.id;

      // Get students assigned to this instructor
      const { data: students } = await supabase
        .from("students")
        .select("id, name, instrument, avatar, color")
        .or(
          `online_instructor_id.eq.${instructorId},theory_instructor_id.eq.${instructorId},in_person_id.eq.${instructorId},second_inperson_id.eq.${instructorId}`
        );

      // Get feedback given by this instructor
      const { data: feedback } = await supabase
        .from("feedback")
        .select("id, student_id, homework_rating, created_at, session_type")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false });

      // Calculate stats
      const myStudents = students?.length || 0;
      const totalFeedback = feedback?.length || 0;

      // This week's feedback
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekFeedback =
        feedback?.filter((f) => new Date(f.created_at) > oneWeekAgo).length ||
        0;

      // Average rating
      const ratingsWithValues =
        feedback?.filter((f) => f.homework_rating) || [];
      const averageRating =
        ratingsWithValues.length > 0
          ? ratingsWithValues.reduce((sum, f) => sum + f.homework_rating, 0) /
            ratingsWithValues.length
          : 0;

      setStats({
        myStudents,
        totalFeedback,
        thisWeekFeedback,
        averageRating: Math.round(averageRating * 10) / 10,
      });

      // Set recent students (last 4)
      setRecentStudents(students?.slice(0, 4) || []);

      // Set recent feedback with student names
      if (feedback && feedback.length > 0) {
        const recentFeedbackWithNames = await Promise.all(
          feedback.slice(0, 3).map(async (f) => {
            const student = students?.find((s) => s.id === f.student_id);
            return {
              ...f,
              student_name: student?.name || "Unknown Student",
            };
          })
        );
        setRecentFeedback(recentFeedbackWithNames);
      }
    } catch (error) {
      console.error("Error loading instructor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  const getStudentInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome back, {user?.name}!</Text>
        <Text style={styles.welcomeSubtitle}>
          Ready to inspire your students today?
        </Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Teaching Overview</Text>
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
              <Text style={styles.statNumber}>{stats.myStudents}</Text>
            )}
            <Text style={styles.statLabel}>My Students</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="chatbubbles" size={32} color="#2196F3" />
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#2196F3"
                style={{ marginVertical: 8 }}
              />
            ) : (
              <Text style={styles.statNumber}>{stats.totalFeedback}</Text>
            )}
            <Text style={styles.statLabel}>Total Feedback</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="calendar" size={32} color="#FF9800" />
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#FF9800"
                style={{ marginVertical: 8 }}
              />
            ) : (
              <Text style={styles.statNumber}>{stats.thisWeekFeedback}</Text>
            )}
            <Text style={styles.statLabel}>This Week</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="star" size={32} color="#9C27B0" />
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#9C27B0"
                style={{ marginVertical: 8 }}
              />
            ) : (
              <Text style={styles.statNumber}>{stats.averageRating}</Text>
            )}
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/instructor/students" as any)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="people" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>View Students</Text>
            <Text style={styles.actionSubtitle}>
              See all your students and their progress
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/instructor/feedback" as any)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="create" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>Add Feedback</Text>
            <Text style={styles.actionSubtitle}>
              Provide feedback for recent lessons
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/instructor/library" as any)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="library" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>Music Library</Text>
            <Text style={styles.actionSubtitle}>
              Browse and share musical resources
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Students */}
      <View style={styles.studentsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Students</Text>
          <TouchableOpacity
            onPress={() => router.push("/instructor/students" as any)}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.studentsGrid}>
          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" />
          ) : recentStudents.length > 0 ? (
            recentStudents.map((student) => (
              <View key={student.id} style={styles.studentCard}>
                <View
                  style={[
                    styles.studentAvatar,
                    { backgroundColor: student.color || "#4CAF50" },
                  ]}
                >
                  <Text style={styles.studentInitials}>
                    {getStudentInitials(student.name)}
                  </Text>
                </View>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentInstrument}>
                  {student.instrument}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No students assigned yet</Text>
          )}
        </View>
      </View>

      {/* Recent Feedback */}
      <View style={styles.feedbackContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Feedback</Text>
          <TouchableOpacity
            onPress={() => router.push("/instructor/feedback" as any)}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.feedbackCard}>
          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" />
          ) : recentFeedback.length > 0 ? (
            recentFeedback.map((feedback, index) => (
              <View
                key={feedback.id}
                style={[
                  styles.feedbackItem,
                  index === recentFeedback.length - 1 &&
                    styles.lastFeedbackItem,
                ]}
              >
                <View style={styles.feedbackIcon}>
                  <Ionicons name="chatbubble" size={20} color="#2E7D32" />
                </View>
                <View style={styles.feedbackContent}>
                  <Text style={styles.feedbackTitle}>
                    {feedback.session_type || "Lesson"} Feedback
                  </Text>
                  <Text style={styles.feedbackSubtitle}>
                    {feedback.student_name} • {feedback.homework_rating}/5 ⭐ •{" "}
                    {formatTimeAgo(feedback.created_at)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No feedback given yet</Text>
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
  welcomeContainer: {
    marginBottom: 32,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 20,
    letterSpacing: 0.5,
    textShadowColor: "rgba(46, 125, 50, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  viewAllText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
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
  studentsContainer: {
    marginBottom: 40,
  },
  studentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  studentCard: {
    width: (width - 64) / 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  studentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  studentInitials: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  studentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  studentInstrument: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  feedbackContainer: {
    marginBottom: 40,
  },
  feedbackCard: {
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
  feedbackItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  feedbackIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  feedbackSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  lastFeedbackItem: {
    borderBottomWidth: 0,
  },
  emptyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
    padding: 20,
  },
});
