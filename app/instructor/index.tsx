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

// Note: Individual screens are now handled by Expo Router navigation

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

interface InstructorDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function InstructorDashboard({
  activeTab = "dashboard",
  onTabChange,
}: InstructorDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myStudents: 0,
    totalFeedback: 0,
    totalSessions: 0,
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

      // Total sessions (same as total feedback since each feedback represents a session)
      const totalSessions = feedback?.length || 0;

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
        totalSessions,
        averageRating: Math.round(averageRating * 10) / 10,
      });

      // Set recent students (last 4)
      setRecentStudents(students?.slice(0, 4) || []);

      // Get recent feedback with student names
      if (feedback && feedback.length > 0) {
        const recentFeedbackWithNames = await Promise.all(
          feedback.slice(0, 3).map(async (f) => {
            const { data: student } = await supabase
              .from("students")
              .select("name, instrument")
              .eq("id", f.student_id)
              .single();

            return {
              ...f,
              student_name: student?.name || "Unknown Student",
              student_instrument: student?.instrument || "Unknown Instrument",
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

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleStudentFeedback = (student: any) => {
    router.push({
      pathname: "/instructor/feedback",
      params: { 
        selectedStudentId: student.id.toString(),
        selectedStudentName: student.name,
        selectedStudentInstrument: student.instrument,
        selectedStudentColor: student.color || "#4CAF50"
      }
    });
  };

  const handleFeedbackHistory = (feedback: any) => {
    router.push({
      pathname: "/instructor/feedback-history",
      params: { 
        selectedFeedbackId: feedback.id.toString(),
        studentId: feedback.student_id.toString(),
        studentName: feedback.student_name,
        studentInstrument: feedback.student_instrument,
        scrollToFeedback: "true"
      }
    });
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statHeader}>
          <Ionicons name={icon} size={24} color={color} />
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Text style={styles.statValue}>{value}</Text>
        )}
      </View>
    </View>
  );

  const QuickActionCard = ({ title, subtitle, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={28} color="#FFFFFF" />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDashboard = () => (
    <ScrollView
      style={styles.dashboardContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome back, {user?.name}!</Text>
        <Text style={styles.welcomeSubtitle}>
          Ready to inspire your students today?
        </Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          title="My Students"
          value={stats.myStudents}
          icon="people"
          color="#1c463a"
        />
        <StatCard
          title="Total Feedback"
          value={stats.totalFeedback}
          icon="chatbubbles"
          color="#2196F3"
        />
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions}
          icon="school"
          color="#FF9800"
        />
        <StatCard
          title="Avg Rating"
          value={stats.averageRating}
          icon="star"
          color="#4CAF50"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard
            title="Send Feedback"
            subtitle="Give feedback to students"
            icon="send"
            color="#1c463a"
            onPress={() => router.push("/instructor/feedback")}
          />
          <QuickActionCard
            title="My Students"
            subtitle="View and manage students"
            icon="people"
            color="#2196F3"
            onPress={() => router.push("/instructor/students")}
          />
          <QuickActionCard
            title="Music Library"
            subtitle="Browse sheet music files"
            icon="library"
            color="#9C27B0"
            onPress={() => router.push("/instructor/library")}
          />
        </View>
      </View>

      {/* Recent Students */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Students</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push("/instructor/students")}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
          </TouchableOpacity>
        </View>
        {recentStudents.length > 0 ? (
          <View style={styles.studentsGrid}>
            {recentStudents.map((student) => (
              <TouchableOpacity 
                key={student.id} 
                style={styles.studentCard}
                onPress={() => handleStudentFeedback(student)}
              >
                <View
                  style={[
                    styles.studentAvatar,
                    { backgroundColor: student.color || "#1c463a" },
                  ]}
                >
                  <Text style={styles.studentInitial}>
                    {student.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.studentName} numberOfLines={1}>
                  {student.name}
                </Text>
                <Text style={styles.studentInstrument} numberOfLines={1}>
                  {student.instrument}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="people-outline"
              size={48}
              color="rgba(255,255,255,0.3)"
            />
            <Text style={styles.emptyStateText}>No students assigned yet</Text>
          </View>
        )}
      </View>

      {/* Recent Feedback */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Feedback</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push("/instructor/feedback-history")}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
          </TouchableOpacity>
        </View>
        {recentFeedback.length > 0 ? (
          <View style={styles.feedbackList}>
            {recentFeedback.map((feedback) => (
              <TouchableOpacity 
                key={feedback.id} 
                style={styles.feedbackCard}
                onPress={() => handleFeedbackHistory(feedback)}
              >
                <View style={styles.feedbackHeader}>
                  <Text style={styles.feedbackStudent}>
                    {feedback.student_name}
                  </Text>
                  <Text style={styles.feedbackTime}>
                    {formatTimeAgo(feedback.created_at)}
                  </Text>
                </View>
                <View style={styles.feedbackDetails}>
                  <Text style={styles.feedbackType}>
                    {feedback.session_type}
                  </Text>
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name="star"
                        size={14}
                        color={
                          star <= feedback.homework_rating
                            ? "#FFD700"
                            : "rgba(255,255,255,0.3)"
                        }
                      />
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color="rgba(255,255,255,0.3)"
            />
            <Text style={styles.emptyStateText}>No feedback sent yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c463a" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return <View style={styles.container}>{renderDashboard()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statContent: {
    alignItems: "center",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 20,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  actionsGrid: {
    flexDirection: "column",
    gap: 16,
    paddingHorizontal: 8,
  },
  actionCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    minHeight: 80,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionContent: {
    flex: 1,
    alignItems: "flex-start",
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.3,
    textAlign: "left",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    textAlign: "left",
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  studentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  studentCard: {
    flex: 1,
    minWidth: (width - 80) / 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  studentInitial: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  studentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  studentInstrument: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    fontWeight: "500",
  },
  feedbackList: {
    gap: 12,
  },
  feedbackCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  feedbackStudent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  feedbackTime: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  feedbackDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feedbackType: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
    marginTop: 12,
    fontWeight: "500",
  },
  // Tab Content Styles
  tabContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  tabTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tabSubtitle: {
    fontSize: 17,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  dashboardContent: {
    flex: 1,
  },
  
  // Section Header Styles
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(76,175,80,0.15)",
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.3)",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    marginRight: 4,
  },
});
