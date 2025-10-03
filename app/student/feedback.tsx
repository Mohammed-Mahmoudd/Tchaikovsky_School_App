import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import { supabase } from "../../supabase";
import { useAuth } from "../components/login/AuthContext";

interface FeedbackData {
  id: number;
  student_id: number;
  comment: number;
  homework_rating: number;
  created_at: string;
  session_type: string;
  session_number: number;
  session_number2: number;
  feedback?: string;
  HW_comments?: string;
  Online_Theory_Meet?: string;
  Online_Practice_Meet?: string;
  In_person_Location?: string;
  sheet_files: any[];
  instructor_name?: string;
}

export default function StudentFeedbackScreen() {
  const { user } = useAuth();
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [fullScreenPdf, setFullScreenPdf] = useState<{url: string, name: string} | null>(null);

  useEffect(() => {
    loadFeedbackHistory();
  }, []);

  const loadFeedbackHistory = async () => {
    try {
      if (!user?.id) return;

      // First get feedback data
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (feedbackError) throw feedbackError;
      
      console.log("Feedback data loaded:", feedbackData?.length, "records");
      console.log("Sample feedback:", feedbackData?.[0]);

      // Get unique instructor IDs
      const instructorIds = [...new Set(feedbackData.map(f => f.instructor_id).filter(Boolean))];
      
      // Get instructor names
      const { data: instructorsData, error: instructorsError } = await supabase
        .from("instructors")
        .select("id, name")
        .in("id", instructorIds);

      if (instructorsError) throw instructorsError;

      // Create instructor lookup map
      const instructorMap = instructorsData.reduce((acc, instructor) => {
        acc[instructor.id] = instructor.name;
        return acc;
      }, {} as Record<number, string>);

      const feedbackWithInstructors = feedbackData.map((feedback: any) => ({
        ...feedback,
        instructor_name: instructorMap[feedback.instructor_id] || "Unknown Instructor",
      }));

      setFeedbackHistory(feedbackWithInstructors);
    } catch (error) {
      console.error("Error loading feedback history:", error);
      Alert.alert("Error", "Failed to load your feedback");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file: any) => {
    const type = file.type || "";
    const name = file.name || "";
    
    if (type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
      return "document-text";
    }
    if (type.startsWith("audio/") || name.toLowerCase().match(/\.(mp3|wav|flac|aac|ogg)$/i)) {
      return "musical-notes";
    }
    if (type.startsWith("video/") || name.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv)$/i)) {
      return "videocam";
    }
    if (type.startsWith("image/") || name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp)$/i)) {
      return "image";
    }
    return "document";
  };

  const getFileColor = (file: any) => {
    const type = file.type || "";
    const name = file.name || "";
    
    if (type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) return "#F44336";
    if (type.startsWith("audio/") || name.toLowerCase().match(/\.(mp3|wav|flac|aac|ogg)$/i)) return "#4CAF50";
    if (type.startsWith("video/") || name.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv)$/i)) return "#2196F3";
    if (type.startsWith("image/") || name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp)$/i)) return "#FF9800";
    return "#9E9E9E";
  };

  const toggleFilePreview = (fileId: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedFiles(newExpanded);
  };

  const renderStarsRating = (rating: number) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={16}
          color="#FFD700"
        />
      ))}
    </View>
  );

  const renderFileCard = (file: any, index: number, feedbackId: number) => {
    const fileId = `${feedbackId}-${index}`;
    const isExpanded = expandedFiles.has(fileId);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    return (
      <View key={fileId} style={styles.fileCard}>
        <View style={styles.fileCardHeader}>
          <View style={[styles.fileIconContainer, { backgroundColor: getFileColor(file) }]}>
            <Ionicons name={getFileIcon(file) as any} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.fileCardInfo}>
            <Text style={styles.fileCardName} numberOfLines={2}>{file.name}</Text>
            <Text style={styles.fileCardSize}>
              {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "Size unknown"}
            </Text>
          </View>
          <View style={styles.fileCardActions}>
            {isPdf && (
              <TouchableOpacity
                style={styles.previewButton}
                onPress={() => toggleFilePreview(fileId)}
              >
                <Ionicons name={isExpanded ? "eye-off" : "eye"} size={16} color="#2196F3" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={() => setFullScreenPdf({ url: file.url, name: file.name })}
            >
              <Ionicons name="expand" size={16} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline PDF Preview */}
        {isPdf && isExpanded && file.url && (
          <View style={styles.pdfPreviewContainer}>
            <View style={styles.pdfPreviewHeader}>
              <Text style={styles.pdfPreviewTitle}>Preview</Text>
              <TouchableOpacity
                style={styles.pdfFullscreenButton}
                onPress={() => setFullScreenPdf({ url: file.url, name: file.name })}
              >
                <Text style={styles.pdfFullscreenText}>Full Screen</Text>
              </TouchableOpacity>
            </View>
            <WebView
              source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(file.url)}` }}
              style={styles.pdfPreview}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.pdfLoading}>
                  <ActivityIndicator size="small" color="#1c463a" />
                  <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
                </View>
              )}
            />
          </View>
        )}
      </View>
    );
  };

  const renderFeedbackCard = (feedback: FeedbackData) => (
    <View key={feedback.id} style={styles.feedbackCard}>
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.08)"]}
        style={styles.feedbackGradient}
      >
        {/* Header */}
        <View style={styles.feedbackHeader}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionType}>{feedback.session_type}</Text>
            <Text style={styles.sessionNumber}>Session {feedback.session_number}</Text>
          </View>
          <Text style={styles.feedbackDate}>
            {new Date(feedback.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Instructor */}
        <Text style={styles.instructorName}>by {feedback.instructor_name}</Text>

        {/* Ratings */}
        <View style={styles.ratingsContainer}>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Performance</Text>
            {renderStarsRating(feedback.comment)}
          </View>
          {feedback.homework_rating > 0 && (
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>Homework</Text>
              {renderStarsRating(feedback.homework_rating)}
            </View>
          )}
        </View>

        {/* Comments */}
        {feedback.feedback && (
          <View style={styles.commentSection}>
            <Text style={styles.commentTitle}>Lesson Feedback</Text>
            <Text style={styles.commentText}>{feedback.feedback}</Text>
          </View>
        )}

        {feedback.HW_comments && (
          <View style={styles.commentSection}>
            <Text style={styles.commentTitle}>Homework Comments</Text>
            <Text style={styles.commentText}>{feedback.HW_comments}</Text>
          </View>
        )}

        {/* Files */}
        {feedback.sheet_files && feedback.sheet_files.length > 0 && (
          <View style={styles.filesSection}>
            <View style={styles.filesSectionHeader}>
              <Ionicons name="folder-open" size={20} color="#4CAF50" />
              <Text style={styles.filesSectionTitle}>
                Attached Files ({feedback.sheet_files.length})
              </Text>
            </View>
            {feedback.sheet_files.map((file, index) => 
              renderFileCard(file, index, feedback.id)
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const renderStats = () => {
    const totalSessions = feedbackHistory.length;
    
    // Debug logging
    console.log("=== FEEDBACK STATS DEBUG ===");
    console.log("Total feedback records:", totalSessions);
    console.log("Sample feedback data:", feedbackHistory.slice(0, 2));
    
    // Debug all possible rating fields
    if (feedbackHistory.length > 0) {
      const sample = feedbackHistory[0];
      console.log("=== SAMPLE FEEDBACK FIELDS ===");
      console.log("comment:", sample.comment);
      console.log("homework_rating:", sample.homework_rating);
      console.log("rating:", (sample as any).rating);
      console.log("general_rating:", (sample as any).general_rating);
      console.log("performance_rating:", (sample as any).performance_rating);
      console.log("stars:", (sample as any).stars);
      console.log("All keys:", Object.keys(sample));
      console.log("=== END SAMPLE ===");
    }
    
    // Calculate average rating only from valid ratings (1-5 stars)
    const validRatings = feedbackHistory.filter(f => {
      console.log(`Feedback ${f.id}: comment=${f.comment} (type: ${typeof f.comment}), homework_rating=${f.homework_rating}`);
      
      // Convert to number if it's a string
      const commentValue = typeof f.comment === 'string' ? parseFloat(f.comment) : f.comment;
      
      // Only include ratings that are between 1-5 (star ratings)
      const hasValidComment = commentValue && commentValue >= 1 && commentValue <= 5 && !isNaN(commentValue);
      console.log(`Comment value: ${commentValue}, Valid: ${hasValidComment}`);
      return hasValidComment;
    });
    
    console.log("Valid ratings found:", validRatings.length);
    console.log("Valid ratings data:", validRatings.map(f => ({ id: f.id, comment: f.comment })));
    
    const averageRating = validRatings.length > 0 
      ? validRatings.reduce((sum, f) => {
          const commentValue = typeof f.comment === 'string' ? parseFloat(f.comment) : f.comment;
          return sum + commentValue;
        }, 0) / validRatings.length 
      : 0;
    
    console.log("Calculated average rating:", averageRating);
    
    // Calculate homework average
    const validHomeworkRatings = feedbackHistory.filter(f => f.homework_rating && f.homework_rating > 0);
    
    console.log("Valid homework ratings found:", validHomeworkRatings.length);
    
    const homeworkAverage = validHomeworkRatings.length > 0
      ? validHomeworkRatings.reduce((sum, f) => sum + f.homework_rating, 0) / validHomeworkRatings.length
      : 0;
    
    console.log("Calculated homework average:", homeworkAverage);
    
    const totalFiles = feedbackHistory.reduce((sum, f) => sum + (f.sheet_files?.length || 0), 0);
    
    console.log("Total files:", totalFiles);
    console.log("=== END DEBUG ===");
    
    // Recent sessions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSessions = feedbackHistory.filter(
      f => new Date(f.created_at) >= thirtyDaysAgo
    ).length;

    return (
      <LinearGradient
        colors={["#1c463a", "#2d5a4a"]}
        style={styles.statsCard}
      >
        <View style={styles.statsHeader}>
          <Ionicons name="book" size={24} color="#FFFFFF" />
          <Text style={styles.statsTitle}>Your Learning Progress</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalFiles}</Text>
            <Text style={styles.statLabel}>Study Files</Text>
            <Ionicons name="folder-open" size={16} color="rgba(255,255,255,0.8)" style={styles.statIcon} />
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{homeworkAverage.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Homework Avg</Text>
            <View style={styles.miniStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(homeworkAverage) ? "star" : "star-outline"}
                  size={12}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{averageRating > 0 ? averageRating.toFixed(1) : "N/A"}</Text>
            <Text style={styles.statLabel}>Performance Avg</Text>
            {averageRating > 0 && (
              <View style={styles.miniStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(averageRating) ? "star" : "star-outline"}
                    size={12}
                    color="#FFD700"
                  />
                ))}
              </View>
            )}
            {averageRating === 0 && (
              <Text style={styles.noRatingText}>No ratings yet</Text>
            )}
          </View>
        </View>

        {/* Additional insights */}
        <View style={styles.insightsContainer}>
          <View style={styles.insightItem}>
            <Ionicons name="calendar" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.insightText}>
              {recentSessions} sessions in the last 30 days
            </Text>
          </View>
          {validRatings.length > 0 && (
            <View style={styles.insightItem}>
              <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.insightText}>
                {validRatings.length} rated sessions completed
              </Text>
            </View>
          )}
          {validHomeworkRatings.length > 0 && (
            <View style={styles.insightItem}>
              <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.insightText}>
                {validHomeworkRatings.length} homework assignments reviewed
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c463a" />
        <Text style={styles.loadingText}>Loading your feedback...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderStats()}
          
          <Text style={styles.sectionTitle}>Feedback History</Text>
          
          {feedbackHistory.length > 0 ? (
            feedbackHistory.map(renderFeedbackCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyTitle}>No feedback yet</Text>
              <Text style={styles.emptySubtitle}>
                Your instructor feedback will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fullscreen PDF Modal */}
      <Modal
        visible={fullScreenPdf !== null}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.fullScreenContainer}>
          <View style={styles.fullScreenHeader}>
            <Text style={styles.fullScreenTitle}>{fullScreenPdf?.name}</Text>
            <TouchableOpacity onPress={() => setFullScreenPdf(null)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {fullScreenPdf && (
            <WebView
              source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fullScreenPdf.url)}` }}
              style={styles.fullScreenWebView}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.fullScreenLoading}>
                  <ActivityIndicator size="large" color="#1c463a" />
                  <Text style={styles.fullScreenLoadingText}>Loading PDF...</Text>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  statsCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    textAlign: "center",
  },
  miniStars: {
    flexDirection: "row",
    marginTop: 4,
  },
  statIcon: {
    marginTop: 4,
  },
  noRatingText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
    fontStyle: "italic",
  },
  insightsContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    paddingTop: 16,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  insightText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginLeft: 8,
    fontWeight: "500",
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
  feedbackCard: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  feedbackGradient: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionType: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  sessionNumber: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  feedbackDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  instructorName: {
    fontSize: 14,
    color: "#1c463a",
    fontWeight: "600",
    marginBottom: 16,
    fontStyle: "italic",
  },
  ratingsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  ratingItem: {
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
    fontWeight: "600",
  },
  starsContainer: {
    flexDirection: "row",
  },
  commentSection: {
    marginBottom: 16,
  },
  commentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 8,
  },
  filesSection: {
    marginTop: 16,
  },
  filesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  filesSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  fileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  fileCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  fileIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  fileCardInfo: {
    flex: 1,
  },
  fileCardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  fileCardSize: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  fileCardActions: {
    flexDirection: "row",
  },
  previewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(33, 150, 243, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  fullscreenButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  pdfPreviewContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  pdfPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1c463a",
  },
  pdfPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pdfFullscreenButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
  },
  pdfFullscreenText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pdfPreview: {
    height: 200,
  },
  pdfLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  pdfLoadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  fullScreenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1c463a",
    paddingTop: 50,
  },
  fullScreenTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 16,
  },
  fullScreenWebView: {
    flex: 1,
  },
  fullScreenLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  fullScreenLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
});
