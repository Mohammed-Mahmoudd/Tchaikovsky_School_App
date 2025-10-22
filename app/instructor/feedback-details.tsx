import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../supabase.js";

interface FeedbackDetails {
  id: number;
  student_id: number;
  instructor_id: number;
  comment: number;
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
  student_name?: string;
  student_instrument?: string;
}

export default function FeedbackDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [feedback, setFeedback] = useState<FeedbackDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullScreenPdf, setFullScreenPdf] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [expandedPreviews, setExpandedPreviews] = useState<Set<string>>(
    new Set()
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadFeedbackDetails();
    }
  }, [id]);

  const loadFeedbackDetails = async () => {
    try {
      setLoading(true);

      // Get feedback details first
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("*")
        .eq("id", id)
        .single();

      if (feedbackError) {
        console.error("Error loading feedback:", feedbackError);
        return;
      }

      if (feedbackData) {
        // Get student info separately
        const { data: studentData } = await supabase
          .from("students")
          .select("name, instrument")
          .eq("id", feedbackData.student_id)
          .single();

        // Get instructor info separately
        const { data: instructorData } = await supabase
          .from("instructors")
          .select("name")
          .eq("id", feedbackData.instructor_id)
          .single();

        setFeedback({
          ...feedbackData,
          student_name: studentData?.name || "Unknown Student",
          student_instrument: studentData?.instrument || "Unknown Instrument",
          instructor_name: instructorData?.name || "Unknown Instructor",
        });
      }
    } catch (error) {
      console.error("Error loading feedback details:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePreview = (fileId: string) => {
    const newExpanded = new Set(expandedPreviews);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedPreviews(newExpanded);
  };

  const handleDeleteFeedback = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from("feedback")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting feedback:", error);
        alert("Failed to delete feedback. Please try again.");
        return;
      }

      // Success - navigate back and trigger refresh
      setShowDeleteModal(false);
      
      // Navigate back to feedback history with refresh parameter
      router.push({
        pathname: "/instructor/feedback-history",
        params: { 
          studentId: feedback?.student_id,
          refresh: Date.now().toString() // Force refresh with timestamp
        }
      });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("Failed to delete feedback. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditFeedback = () => {
    // Navigate to dedicated edit feedback page
    router.push({
      pathname: "/instructor/edit-feedback",
      params: { 
        feedbackId: id
      }
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name="star"
        size={20}
        color={index < rating ? "#FFD700" : "rgba(255,255,255,0.3)"}
      />
    ));
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
    if (type === "pdf") return "#F44336";
    if (type === "audio") return "#4CAF50";
    if (type === "video") return "#2196F3";
    return "#9E9E9E";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c463a" />
        <Text style={styles.loadingText}>Loading feedback details...</Text>
      </View>
    );
  }

  if (!feedback) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Feedback Not Found</Text>
        </View>
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
          <Text style={styles.headerTitle}>Feedback Details</Text>
          <Text style={styles.headerSubtitle}>
            {feedback.student_name} • {feedback.student_instrument}
          </Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditFeedback}
          >
            <Ionicons name="create" size={20} color="#4CAF50" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Ionicons name="trash" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Session Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="calendar" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.sectionTitle}>Session Information</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons
                  name={
                    feedback.session_type === "Online Theory"
                      ? "school"
                      : feedback.session_type === "Online Practice"
                      ? "musical-notes"
                      : "location"
                  }
                  size={18}
                  color="#2196F3"
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Session Type</Text>
                <Text style={styles.infoValue}>{feedback.session_type}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="trending-up" size={18} color="#FF9800" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Session Progress</Text>
                <Text style={styles.infoValue}>
                  Session {feedback.session_number} of{" "}
                  {feedback.session_number2}
                </Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(
                            100,
                            (feedback.session_number /
                              feedback.session_number2) *
                              100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(
                      (feedback.session_number / feedback.session_number2) * 100
                    )}
                    %
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar-outline" size={18} color="#9C27B0" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(feedback.created_at).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="person" size={18} color="#4CAF50" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Instructor</Text>
                <Text style={styles.infoValue}>{feedback.instructor_name}</Text>
              </View>
            </View>

            {/* Session Location/Meeting Info */}
            {feedback.Online_Theory_Meet && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Theory Meeting:</Text>
                <Text style={styles.infoValue}>
                  {feedback.Online_Theory_Meet}
                </Text>
              </View>
            )}
            {feedback.Online_Practice_Meet && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Practice Meeting:</Text>
                <Text style={styles.infoValue}>
                  {feedback.Online_Practice_Meet}
                </Text>
              </View>
            )}
            {feedback.In_person_Location && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>
                  {feedback.In_person_Location}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Ratings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
            </View>
            <Text style={styles.sectionTitle}>Performance Ratings</Text>
          </View>
          <View style={styles.ratingsCard}>
            <View style={styles.ratingCard}>
              <View style={styles.ratingIconContainer}>
                <Ionicons name="star" size={24} color="#FFD700" />
              </View>
              <View style={styles.ratingContent}>
                <Text style={styles.ratingLabel}>General Performance</Text>
                <View style={styles.starsContainer}>
                  {renderStars(feedback.comment || 0)}
                  <Text style={styles.ratingValue}>
                    ({feedback.comment || 0}/5)
                  </Text>
                </View>
                <Text style={styles.ratingDescription}>
                  {feedback.comment >= 4
                    ? "Excellent performance!"
                    : feedback.comment >= 3
                    ? "Good progress"
                    : feedback.comment >= 2
                    ? "Needs improvement"
                    : "Keep practicing"}
                </Text>
              </View>
            </View>

            {feedback.homework_rating && (
              <View style={styles.ratingCard}>
                <View style={styles.ratingIconContainer}>
                  <Ionicons name="book" size={24} color="#4CAF50" />
                </View>
                <View style={styles.ratingContent}>
                  <Text style={styles.ratingLabel}>Homework Rating</Text>
                  <View style={styles.starsContainer}>
                    {renderStars(feedback.homework_rating)}
                    <Text style={styles.ratingValue}>
                      ({feedback.homework_rating}/5)
                    </Text>
                  </View>
                  <Text style={styles.ratingDescription}>
                    {feedback.homework_rating >= 4
                      ? "Outstanding homework!"
                      : feedback.homework_rating >= 3
                      ? "Well done"
                      : feedback.homework_rating >= 2
                      ? "Good effort"
                      : "More practice needed"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Feedback Comments */}
        {(feedback.feedback || feedback.HW_comments) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback Comments</Text>

            {feedback.feedback && (
              <View style={styles.commentCard}>
                <Text style={styles.commentTitle}>General Feedback:</Text>
                <Text style={styles.commentText}>{feedback.feedback}</Text>
              </View>
            )}

            {feedback.HW_comments && (
              <View style={styles.commentCard}>
                <Text style={styles.commentTitle}>Homework Comments:</Text>
                <Text style={styles.commentText}>{feedback.HW_comments}</Text>
              </View>
            )}
          </View>
        )}

        {/* Attached Files */}
        {feedback.sheet_files && feedback.sheet_files.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Attached Files ({feedback.sheet_files.length})
            </Text>
            {feedback.sheet_files.map((file: any, index: number) => {
              const isPdf =
                file.type === "pdf" || file.name.toLowerCase().endsWith(".pdf");
              const fileId = `${file.name}-${index}`;

              return (
                <View key={index} style={styles.fileCard}>
                  <View style={styles.fileHeader}>
                    <View
                      style={[
                        styles.fileIcon,
                        {
                          backgroundColor: getFileColor(
                            file.type || "",
                            file.name
                          ),
                        },
                      ]}
                    >
                      <Ionicons
                        name={getFileIcon(file.type || "", file.name) as any}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>{file.name}</Text>
                      {file.size && (
                        <Text style={styles.fileSize}>
                          {(file.size / 1024).toFixed(1)} KB
                        </Text>
                      )}
                    </View>
                    <View style={styles.fileActions}>
                      {isPdf && file.url && (
                        <TouchableOpacity
                          style={styles.previewButton}
                          onPress={() => togglePreview(fileId)}
                        >
                          <Ionicons
                            name={
                              expandedPreviews.has(fileId) ? "eye-off" : "eye"
                            }
                            size={18}
                            color="#2196F3"
                          />
                        </TouchableOpacity>
                      )}
                      {isPdf && file.url && (
                        <TouchableOpacity
                          style={[styles.viewButton, { marginLeft: 8 }]}
                          onPress={() =>
                            setFullScreenPdf({ url: file.url, name: file.name })
                          }
                        >
                          <Ionicons name="expand" size={18} color="#4CAF50" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Inline PDF Preview */}
                  {isPdf && file.url && expandedPreviews.has(fileId) && (
                    <View style={styles.pdfPreviewContainer}>
                      <View style={styles.pdfPreviewHeader}>
                        <Text style={styles.pdfPreviewTitle}>PDF Preview</Text>
                        <TouchableOpacity
                          style={styles.pdfFullscreenButton}
                          onPress={() =>
                            setFullScreenPdf({ url: file.url, name: file.name })
                          }
                        >
                          <Ionicons name="expand" size={16} color="#FFFFFF" />
                          <Text style={styles.pdfFullscreenText}>
                            Full Screen
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.pdfPreviewWrapper}>
                        <WebView
                          source={{
                            uri: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
                              file.url
                            )}`,
                          }}
                          style={styles.pdfPreview}
                          startInLoadingState={true}
                          renderLoading={() => (
                            <View style={styles.pdfPreviewLoading}>
                              <ActivityIndicator size="small" color="#1c463a" />
                              <Text style={styles.pdfPreviewLoadingText}>
                                Loading PDF...
                              </Text>
                            </View>
                          )}
                          onError={(error) => {
                            console.error("PDF preview error:", error);
                          }}
                          scrollEnabled={true}
                          scalesPageToFit={true}
                          javaScriptEnabled={true}
                          domStorageEnabled={true}
                          allowsInlineMediaPlayback={true}
                          mixedContentMode="compatibility"
                          originWhitelist={["*"]}
                          userAgent="Mozilla/5.0 (compatible; PDF Viewer)"
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Full Screen PDF Modal */}
      <Modal
        visible={fullScreenPdf !== null}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {fullScreenPdf && (
          <View style={styles.fullScreenContainer}>
            <View style={styles.fullScreenHeader}>
              <Text style={styles.fullScreenTitle}>{fullScreenPdf.name}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setFullScreenPdf(null)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <WebView
              source={{
                uri: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
                  fullScreenPdf.url
                )}`,
              }}
              style={styles.fullScreenWebView}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.pdfLoading}>
                  <ActivityIndicator size="large" color="#1c463a" />
                  <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
                </View>
              )}
            />
          </View>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={32} color="#F44336" />
              <Text style={styles.deleteModalTitle}>Delete Feedback</Text>
            </View>
            
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete this feedback? This action cannot be undone.
            </Text>
            
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmDeleteButton, isDeleting && styles.disabledButton]}
                onPress={handleDeleteFeedback}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(76,175,80,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(244,67,54,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    lineHeight: 22,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    marginRight: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    minWidth: 35,
  },
  ratingsCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  ratingRow: {
    marginBottom: 16,
  },
  ratingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  ratingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  ratingContent: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ratingDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontStyle: "italic",
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingValue: {
    fontSize: 14,
    color: "#FFD700",
    fontWeight: "600",
    marginLeft: 8,
  },
  commentCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  commentTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  fileCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  fileActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(33,150,243,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(76,175,80,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  // PDF Preview Styles
  pdfPreviewContainer: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pdfPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(28,70,58,0.8)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  pdfPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pdfFullscreenButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pdfFullscreenText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  pdfPreviewWrapper: {
    height: 300,
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
    backgroundColor: "#FFFFFF",
  },
  pdfPreviewLoadingText: {
    color: "#1c463a",
    fontSize: 14,
    marginTop: 8,
    fontWeight: "500",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  fullScreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#1c463a",
  },
  fullScreenTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenWebView: {
    flex: 1,
  },
  pdfLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  pdfLoadingText: {
    color: "#1c463a",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },

  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  deleteModalContainer: {
    backgroundColor: "#1c463a",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  deleteModalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 12,
    textAlign: "center",
  },
  deleteModalText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: "#F44336",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 8,
    alignItems: "center",
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
