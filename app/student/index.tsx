import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../components/login/AuthContext";
import { supabase } from "../../supabase.js";

// Import the actual screen components
import StudentFeedbackScreen from "./feedback";
import StudentMaterialsScreen from "./materials";
import StudentBackground from "../components/student/StudentBackground";

interface StudentDashboardProps {
  activeTab?: string;
  selectedFileId?: string;
  onTabChange?: (tab: string, fileId?: string) => void;
}

export default function StudentDashboard({
  activeTab = "dashboard",
  selectedFileId,
  onTabChange,
}: StudentDashboardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    completedSessions: 0,
    totalFiles: 0,
    recentSessions: 0,
    progressPercentage: 0,
  });
  const [studentData, setStudentData] = useState<any>(null);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);

  useEffect(() => {
    loadStudentData();
  }, [user]);

  const loadStudentData = async () => {
    try {
      if (!user?.id) return;

      // Load student data, feedback statistics, and file counts
      const [
        studentResult,
        feedbackResult,
        foldersResult,
        subfoldersResult,
        instructorsResult,
      ] = await Promise.all([
        supabase.from("students").select("*").eq("id", user.id).single(),
        supabase
          .from("feedback")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("folders").select("*"),
        supabase.from("subfolders").select("*"),
        supabase.from("instructors").select("id, name"),
      ]);

      if (studentResult.data) {
        setStudentData(studentResult.data);
      }

      // Calculate total files from student's feedback sessions (more relevant for students)
      let totalFiles = 0;
      if (feedbackResult.data) {
        feedbackResult.data.forEach((feedback: any) => {
          if (feedback.sheet_files && Array.isArray(feedback.sheet_files)) {
            totalFiles += feedback.sheet_files.length;
          }
        });
      }

      // Get recent files from feedback table (files attached to recent feedback sessions)
      let recentFeedbackFiles: any[] = [];
      if (feedbackResult.data) {
        feedbackResult.data.forEach((feedback: any) => {
          if (feedback.sheet_files && Array.isArray(feedback.sheet_files)) {
            feedback.sheet_files.forEach((file: any) => {
              recentFeedbackFiles.push({
                ...file,
                feedbackDate: feedback.created_at,
                sessionType: feedback.session_type,
                sessionNumber: feedback.session_number,
                instructorId: feedback.instructor_id,
                source: "feedback",
              });
            });
          }
        });
      }

      // Sort by feedback date and get the latest 6 files
      const sortedFeedbackFiles = recentFeedbackFiles.sort(
        (a, b) =>
          new Date(b.feedbackDate).getTime() - new Date(a.feedbackDate).getTime()
      );
      setRecentFiles(sortedFeedbackFiles.slice(0, 6));

      // Calculate feedback statistics
      if (feedbackResult.data) {
        const totalFeedback = feedbackResult.data.length;
        const validRatings = feedbackResult.data.filter(
          (f) => f.homework_rating && typeof f.homework_rating === "number" && f.homework_rating > 0
        );
        const averageRating =
          validRatings.length > 0
            ? validRatings.reduce((sum, f) => sum + Number(f.homework_rating), 0) /
              validRatings.length
            : 0;

        // Calculate recent sessions (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSessions = feedbackResult.data.filter(
          (f) => new Date(f.created_at) > thirtyDaysAgo
        ).length;

        // Calculate progress percentage (assuming target of 20 sessions)
        const progressPercentage = Math.min(100, (totalFeedback / 20) * 100);

        // Get recent feedback with instructor names
        const feedbackWithInstructors = feedbackResult.data
          .slice(0, 4)
          .map((feedback: any) => {
            const instructor = instructorsResult.data?.find(
              (inst: any) => inst.id === feedback.instructor_id
            );
            return {
              ...feedback,
              instructor_name: instructor?.name || "Unknown Instructor",
            };
          });
        setRecentFeedback(feedbackWithInstructors);

        setStats({
          totalFeedback,
          averageRating: parseFloat(averageRating.toFixed(1)),
          completedSessions: totalFeedback,
          totalFiles,
          recentSessions,
          progressPercentage: Math.round(progressPercentage),
        });
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: any) => {
    // Navigate to materials screen and pass the selected file name
    if (onTabChange) {
      onTabChange("materials", file.name);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "feedback":
        return <StudentFeedbackScreen />;
      case "materials":
        return <StudentMaterialsScreen selectedFileId={selectedFileId} />;
      default:
        return renderOriginalDashboard();
    }
  };

  const renderOriginalDashboard = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1c463a" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      );
    }

    const progressPercentage = stats.progressPercentage;

    return (
      <ScrollView
        style={styles.dashboardContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome back, {studentData?.name || user?.name}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Ready for your next music lesson?
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#1c463a" }]}>
              <Text style={styles.statIconText}>🎵</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.statValue}>{stats.totalFeedback}</Text>
            )}
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#2196F3" }]}>
              <Text style={styles.statIconText}>⭐</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.statValue}>{stats.averageRating}</Text>
            )}
            <Text style={styles.statLabel}>Homework Rating</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#4CAF50" }]}>
              <Text style={styles.statIconText}>📁</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.statValue}>{stats.totalFiles}</Text>
            )}
            <Text style={styles.statLabel}>My Files</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#FF9800" }]}>
              <Text style={styles.statIconText}>📈</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.statValue}>{stats.recentSessions}</Text>
            )}
            <Text style={styles.statLabel}>Recent Sessions</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => onTabChange && onTabChange("feedback")}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#1c463a" }]}>
                <Text style={styles.actionIconText}>📖</Text>
              </View>
              <Text style={styles.actionTitle}>View Feedback</Text>
              <Text style={styles.actionSubtitle}>
                Check your lesson feedback
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => onTabChange && onTabChange("materials")}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#2196F3" }]}>
                <Text style={styles.actionIconText}>📁</Text>
              </View>
              <Text style={styles.actionTitle}>My Materials</Text>
              <Text style={styles.actionSubtitle}>
                Access sheet music and resources
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Files from Feedback */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Lesson Materials</Text>
          <View style={styles.filesGrid}>
            {recentFiles.length > 0 ? (
              recentFiles.map((file, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.fileCard}
                  onPress={() => handleFileClick(file)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.fileIcon,
                      { backgroundColor: getFileColor(file.name) },
                    ]}
                  >
                    <Ionicons
                      name={getFileIcon(file.name)}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={styles.fileTitle} numberOfLines={2}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileSubtitle}>
                    {file.source === "feedback" 
                      ? `${file.sessionType} - Session ${file.sessionNumber}`
                      : file.folderName || "General Library"
                    }
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="folder-open-outline"
                  size={48}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.emptyStateText}>No recent files</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Feedback */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Feedback</Text>
            {recentFeedback.length > 0 && (
              <TouchableOpacity 
                style={styles.showMoreButton}
                onPress={() => onTabChange && onTabChange("feedback")}
                activeOpacity={0.7}
              >
                <Text style={styles.showMoreText}>Show More</Text>
                <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.feedbackContainer}>
            {recentFeedback.length > 0 ? (
              recentFeedback.map((feedback, index) => (
                <View key={index} style={styles.feedbackCard}>
                  <View style={styles.feedbackHeader}>
                    <View style={styles.feedbackInfo}>
                      <Text style={styles.feedbackInstructor}>
                        {feedback.instructor_name}
                      </Text>
                      <Text style={styles.feedbackDate}>
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.feedbackRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name="star"
                          size={16}
                          color={
                            star <= (feedback.comment || 0)
                              ? "#FFD700"
                              : "rgba(255,255,255,0.3)"
                          }
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.feedbackSession}>
                    {feedback.session_type} - Session {feedback.session_number}
                  </Text>
                  {feedback.feedback && (
                    <Text style={styles.feedbackText} numberOfLines={2}>
                      {feedback.feedback}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="chatbubble-outline"
                  size={48}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.emptyStateText}>No recent feedback</Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Music Journey</Text>
              <Text style={styles.progressSubtitle}>
                Keep up the great work!
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, progressPercentage)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {stats.completedSessions} sessions completed (
              {stats.progressPercentage}%)
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Helper functions for file icons and colors
  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split(".").pop();
    switch (extension) {
      case "pdf":
        return "document-text";
      case "mp3":
      case "wav":
      case "flac":
      case "aac":
      case "ogg":
        return "musical-notes";
      case "mp4":
      case "avi":
      case "mov":
      case "wmv":
      case "flv":
        return "videocam";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
        return "image";
      default:
        return "document";
    }
  };

  const getFileColor = (fileName: string) => {
    const extension = fileName.toLowerCase().split(".").pop();
    switch (extension) {
      case "pdf":
        return "#F44336"; // Red
      case "mp3":
      case "wav":
      case "flac":
      case "aac":
      case "ogg":
        return "#4CAF50"; // Green
      case "mp4":
      case "avi":
      case "mov":
      case "wmv":
      case "flv":
        return "#2196F3"; // Blue
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
        return "#FF9800"; // Orange
      default:
        return "#9E9E9E"; // Gray
    }
  };

  return (
    <View style={styles.container}>
      <StudentBackground />
      {renderContent()}
    </View>
  );
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
  dashboardContent: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
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
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    backdropFilter: "blur(10px)",
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statIconText: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 20,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    backdropFilter: "blur(10px)",
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionIconText: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 0.3,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  progressCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    backdropFilter: "blur(10px)",
  },
  progressHeader: {
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  progressSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#1c463a",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  // Recent Files Section
  filesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  fileCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    backdropFilter: "blur(8px)",
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  fileTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  fileSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  // Recent Feedback Section
  feedbackContainer: {
    gap: 12,
  },
  feedbackCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    backdropFilter: "blur(8px)",
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  feedbackInfo: {
    flex: 1,
  },
  feedbackInstructor: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  feedbackDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  feedbackRating: {
    flexDirection: "row",
    gap: 2,
  },
  feedbackSession: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  feedbackText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 18,
    fontWeight: "500",
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    backdropFilter: "blur(6px)",
  },
  emptyStateText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginTop: 12,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  // Practice Goals Section
  goalsContainer: {
    gap: 16,
  },
  goalCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  goalProgress: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4CAF50",
    letterSpacing: 0.2,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  goalProgressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  goalDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  // Section Header with Show More Button
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  showMoreText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    marginRight: 4,
  },
});
