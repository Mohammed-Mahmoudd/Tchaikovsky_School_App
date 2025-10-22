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
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../supabase.js";
import { useAuth } from "../components/login/AuthContext";

interface Student {
  id: number;
  name: string;
  instrument: string;
  color?: string;
}

interface FeedbackHistory {
  id: number;
  student_id: number;
  instructor_id: number;
  comment: number; // stars rating for general comment
  homework_rating: number;
  HW_comments?: string;
  feedback?: string;
  session_type: string;
  session_number: number;
  session_number2: number;
  sheet?: string;
  sheet_files: any[];
  Online_Theory_Meet?: string;
  Online_Practice_Meet?: string;
  In_person_Location?: string;
  created_at: string;
  instructor_name?: string;
}

export default function FeedbackHistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [fullScreenPdf, setFullScreenPdf] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(
    null
  );
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    if (params.studentId) {
      loadStudentInfo();
      loadFeedbackHistory();
    }

    // Handle selected feedback ID from navigation params
    if (params.selectedFeedbackId) {
      setSelectedFeedbackId(params.selectedFeedbackId as string);
    }
  }, [params.studentId, params.selectedFeedbackId]);

  // Listen for refresh parameter to reload data after deletion
  useEffect(() => {
    if (params.refresh && params.studentId) {
      console.log("Refreshing feedback history after deletion");
      loadFeedbackHistory();
    }
  }, [params.refresh]);

  // Scroll to selected feedback after data loads
  useEffect(() => {
    if (
      selectedFeedbackId &&
      feedbackHistory.length > 0 &&
      params.scrollToFeedback === "true"
    ) {
      const feedbackIndex = feedbackHistory.findIndex(
        (feedback) => feedback.id.toString() === selectedFeedbackId
      );

      if (feedbackIndex !== -1) {
        // Delay scroll to ensure layout is complete
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: feedbackIndex * 200, // Approximate height per feedback card
            animated: true,
          });
        }, 500);
      }
    }
  }, [selectedFeedbackId, feedbackHistory, params.scrollToFeedback]);

  const loadStudentInfo = async () => {
    try {
      // Create student object from params
      if (params.studentId && params.studentName) {
        setStudent({
          id: parseInt(params.studentId as string),
          name: params.studentName as string,
          instrument: (params.studentInstrument as string) || "Unknown",
          color: (params.studentColor as string) || "#4CAF50",
        });
      }
    } catch (error) {
      console.error("Error setting student info:", error);
    }
  };

  const loadFeedbackHistory = async () => {
    try {
      setLoading(true);
      const studentId = params.studentId;

      // First, get the feedback data - ONLY from current instructor
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("*")
        .eq("student_id", studentId)
        .eq("instructor_id", user?.id) // Filter by current instructor ID
        .order("created_at", { ascending: false });

      if (feedbackError) throw feedbackError;

      // Then get instructor names separately
      const feedbackWithInstructor = await Promise.all(
        (feedbackData || []).map(async (feedback) => {
          let instructorName = "Unknown Instructor";

          if (feedback.instructor_id) {
            const { data: instructorData } = await supabase
              .from("instructors")
              .select("name")
              .eq("id", feedback.instructor_id)
              .single();

            if (instructorData) {
              instructorName = instructorData.name;
            }
          }

          return {
            ...feedback,
            instructor_name: instructorName,
          };
        })
      );

      setFeedbackHistory(feedbackWithInstructor);
    } catch (error) {
      console.error("Error loading feedback history:", error);
      Alert.alert("Error", "Failed to load feedback history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (type: string, name: string) => {
    if (type === "pdf" || name.toLowerCase().endsWith(".pdf")) {
      return "document-text";
    }
    if (
      type === "audio" ||
      name.toLowerCase().match(/\.(mp3|wav|flac|aac|ogg)$/i)
    ) {
      return "musical-notes";
    }
    if (
      type === "video" ||
      name.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv)$/i)
    ) {
      return "videocam";
    }
    return "document";
  };

  const getFileColor = (type: string, name: string) => {
    if (type === "pdf" || name.toLowerCase().endsWith(".pdf")) {
      return "#F44336";
    }
    if (
      type === "audio" ||
      name.toLowerCase().match(/\.(mp3|wav|flac|aac|ogg)$/i)
    ) {
      return "#4CAF50";
    }
    if (
      type === "video" ||
      name.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv)$/i)
    ) {
      return "#2196F3";
    }
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

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name="star"
            size={16}
            color={star <= rating ? "#FFD700" : "rgba(255,255,255,0.3)"}
          />
        ))}
      </View>
    );
  };

  const renderFeedbackCard = (feedback: FeedbackHistory) => (
    <View
      key={feedback.id}
      style={[
        styles.compactFeedbackCard,
        selectedFeedbackId === feedback.id.toString() &&
          styles.selectedFeedbackCard,
      ]}
    >
      {/* Visual Header with Icon */}
      <View style={styles.compactHeader}>
        <View style={styles.sessionTypeContainer}>
          <View style={styles.sessionIcon}>
            <Ionicons 
              name={
                feedback.session_type === "Online Theory" ? "school" :
                feedback.session_type === "Online Practice" ? "musical-notes" :
                "location"
              } 
              size={16} 
              color="#4CAF50" 
            />
          </View>
          <Text style={styles.compactSessionType}>{feedback.session_type}</Text>
        </View>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={12} color="rgba(255,255,255,0.6)" />
          <Text style={styles.compactDate}>
            {new Date(feedback.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Visual Rating Section */}
      <View style={styles.compactRating}>
        <View style={styles.ratingIconContainer}>
          <Ionicons name="trophy" size={14} color="#FFD700" />
        </View>
        <View style={styles.compactStars}>
          {renderStars(feedback.comment || 0)}
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.compactRatingValue}>{feedback.comment || 0}/5</Text>
        </View>
      </View>

      {/* Visual Feedback Text */}
      {feedback.feedback && (
        <View style={styles.compactFeedback}>
          <View style={styles.feedbackIconContainer}>
            <Ionicons name="chatbubble-ellipses" size={12} color="rgba(255,255,255,0.6)" />
          </View>
          <Text style={styles.compactFeedbackText} numberOfLines={2}>
            {feedback.feedback}
          </Text>
        </View>
      )}

      {/* View Details Button */}
      <TouchableOpacity 
        style={styles.viewDetailsButton}
        onPress={() => router.push({
          pathname: "/instructor/feedback-details",
          params: { id: feedback.id.toString() }
        })}
      >
        <Ionicons name="information-circle" size={16} color="#4CAF50" />
        <Text style={styles.viewDetailsText}>View More Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c463a" />
        <Text style={styles.loadingText}>Loading feedback history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Feedback History</Text>
          {student && (
            <Text style={styles.headerSubtitle}>
              {student.name} • {student.instrument}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {feedbackHistory.length > 0 ? (
          <>
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>
                Total Feedback Sessions: {feedbackHistory.length}
              </Text>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {(() => {
                      // Filter out null, undefined, and zero ratings
                      const validRatings = feedbackHistory.filter(
                        (f) =>
                          f.comment !== null &&
                          f.comment !== undefined &&
                          f.comment > 0 &&
                          !isNaN(f.comment)
                      );

                      if (validRatings.length === 0) return "0.0";

                      const sum = validRatings.reduce(
                        (total, f) => total + Number(f.comment),
                        0
                      );
                      const average = sum / validRatings.length;

                      return average.toFixed(1);
                    })()}
                  </Text>
                  <Text style={styles.statLabel}>Avg General Rating</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {
                      feedbackHistory.filter(
                        (f) => f.homework_rating && f.homework_rating > 0
                      ).length
                    }
                  </Text>
                  <Text style={styles.statLabel}>Homework Sessions</Text>
                </View>
              </View>
            </View>

            <View style={styles.historyContainer}>
              <Text style={styles.sectionTitle}>Feedback History</Text>
              {feedbackHistory.map(renderFeedbackCard)}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color="rgba(255,255,255,0.3)"
            />
            <Text style={styles.emptyTitle}>No Feedback History</Text>
            <Text style={styles.emptyText}>
              No feedback has been recorded for this student yet.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Full Screen PDF Modal */}
      {fullScreenPdf && (
        <Modal
          visible={fullScreenPdf !== null}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <View style={styles.fullScreenContainer}>
            <View style={styles.fullScreenHeader}>
              <Text style={styles.fullScreenTitle}>{fullScreenPdf.name}</Text>
              <TouchableOpacity
                style={styles.fullScreenCloseButton}
                onPress={() => setFullScreenPdf(null)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <WebView
              source={{
                uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                  fullScreenPdf.url
                )}`,
              }}
              style={styles.fullScreenWebView}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.fullScreenLoading}>
                  <ActivityIndicator size="large" color="#1c463a" />
                  <Text style={styles.fullScreenLoadingText}>
                    Loading PDF...
                  </Text>
                </View>
              )}
              onError={(error: any) => {
                console.error("PDF fullscreen error:", error);
              }}
              scrollEnabled={true}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
            />
          </View>
        </Modal>
      )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  summaryContainer: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4CAF50",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  historyContainer: {
    marginBottom: 40,
  },
  feedbackCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  feedbackInfo: {
    flex: 1,
  },
  sessionType: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4CAF50",
    marginBottom: 4,
  },
  feedbackDate: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  sessionNumbers: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 4,
  },
  studentName: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: 6,
  },
  sessionLocation: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
    fontStyle: "italic",
    marginTop: 2,
  },
  instructorInfo: {
    alignItems: "flex-end",
  },
  instructorName: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  ratingsContainer: {
    marginBottom: 16,
  },
  ratingItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    minWidth: 120,
  },
  starsContainer: {
    flexDirection: "row",
    marginHorizontal: 8,
  },
  ratingValue: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  commentSection: {
    marginBottom: 12,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  commentText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
    fontWeight: "500",
  },
  filesSection: {
    marginTop: 8,
  },
  filesLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  filesList: {
    gap: 6,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  fileName: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  // Enhanced Files Section Styles
  filesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  fileCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  fileCardHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    marginBottom: 2,
  },
  fileCardSize: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  fileCardActions: {
    flexDirection: "row",
    gap: 8,
  },
  previewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(33, 150, 243, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  // PDF Preview Styles
  pdfPreviewContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pdfPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(28, 70, 58, 0.8)",
  },
  pdfPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pdfFullscreenButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pdfFullscreenText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  pdfPreviewWrapper: {
    height: 200,
    backgroundColor: "#FFFFFF",
  },
  pdfPreview: {
    flex: 1,
  },
  pdfPreviewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  pdfPreviewLoadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#1c463a",
    fontWeight: "500",
  },
  // Fullscreen Modal Styles
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
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 16,
  },
  fullScreenCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  fullScreenLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#1c463a",
    fontWeight: "600",
  },

  // Selected Feedback Highlighting
  selectedFeedbackCard: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },

  // Compact Feedback Card Styles
  compactFeedbackCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sessionTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sessionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(76,175,80,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.3)",
  },
  compactSessionType: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  compactDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginLeft: 4,
  },
  compactRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,215,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  compactStars: {
    flexDirection: "row",
    marginRight: 12,
    gap: 2,
  },
  ratingBadge: {
    backgroundColor: "rgba(255,215,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  compactRatingValue: {
    fontSize: 12,
    color: "#FFD700",
    fontWeight: "700",
  },
  compactFeedback: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "rgba(255,255,255,0.3)",
  },
  feedbackIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 1,
  },
  compactFeedbackText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
    lineHeight: 20,
    flex: 1,
    fontWeight: "400",
  },

  // View Details Button Styles
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.3)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  viewDetailsText: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
    marginHorizontal: 6,
  },
});
