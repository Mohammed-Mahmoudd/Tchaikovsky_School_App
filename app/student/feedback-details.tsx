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
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../supabase";

interface FeedbackDetails {
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

export default function StudentFeedbackDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [fullScreenPdf, setFullScreenPdf] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(
    new Set()
  );
  const [pdfErrors, setPdfErrors] = useState<Set<string>>(new Set());
  const [retryAttempts, setRetryAttempts] = useState<Map<string, number>>(
    new Map()
  );

  useEffect(() => {
    loadFeedbackDetails();
  }, [id]);

  const loadFeedbackDetails = async () => {
    try {
      if (!id) return;

      // Get feedback details
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("*")
        .eq("id", id)
        .single();

      if (feedbackError) throw feedbackError;

      // Get instructor name
      const { data: instructorData, error: instructorError } = await supabase
        .from("instructors")
        .select("name")
        .eq("id", feedbackData.instructor_id)
        .single();

      if (instructorError) throw instructorError;

      setFeedback({
        ...feedbackData,
        instructor_name: instructorData.name,
      });
    } catch (error) {
      console.error("Error loading feedback details:", error);
      Alert.alert("Error", "Failed to load feedback details");
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
    if (
      type.startsWith("audio/") ||
      name.toLowerCase().match(/\.(mp3|wav|flac|aac|ogg)$/i)
    ) {
      return "musical-notes";
    }
    if (
      type.startsWith("video/") ||
      name.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv)$/i)
    ) {
      return "videocam";
    }
    if (
      type.startsWith("image/") ||
      name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp)$/i)
    ) {
      return "image";
    }
    return "document";
  };

  const getFileColor = (file: any) => {
    const type = file.type || "";
    const name = file.name || "";

    if (type === "application/pdf" || name.toLowerCase().endsWith(".pdf"))
      return "#F44336";
    if (
      type.startsWith("audio/") ||
      name.toLowerCase().match(/\.(mp3|wav|flac|aac|ogg)$/i)
    )
      return "#4CAF50";
    if (
      type.startsWith("video/") ||
      name.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv)$/i)
    )
      return "#2196F3";
    if (
      type.startsWith("image/") ||
      name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp)$/i)
    )
      return "#FF9800";
    return "#9E9E9E";
  };

  // Generate PDF viewer URL with fallbacks (same as admin library)
  const getPdfViewerUrl = (fileUrl: string, attempt: number = 0): string => {
    const encodedUrl = encodeURIComponent(fileUrl);

    // Multiple fallback strategies - prioritize PDF.js viewer like instructor/materials
    const strategies = [
      `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodedUrl}`, // PDF.js viewer (primary)
      `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`, // Google Docs viewer (fallback)
      `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`, // Alternative Google viewer
      fileUrl, // Direct URL as last resort
    ];

    return strategies[Math.min(attempt, strategies.length - 1)];
  };

  const retryPdfLoad = (fileId: string, fileUrl: string) => {
    const currentAttempts = retryAttempts.get(fileId) || 0;
    if (currentAttempts < 3) {
      const newAttempts = new Map(retryAttempts);
      newAttempts.set(fileId, currentAttempts + 1);
      setRetryAttempts(newAttempts);

      // Clear error state to trigger re-render
      const newErrors = new Set(pdfErrors);
      newErrors.delete(fileId);
      setPdfErrors(newErrors);
    }
  };

  const toggleFilePreview = (fileId: string) => {
    // Prevent rapid toggling
    if (loadingPreviews.has(fileId)) return;

    const newLoading = new Set(loadingPreviews);
    newLoading.add(fileId);
    setLoadingPreviews(newLoading);

    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedFiles(newExpanded);

    // Remove loading state after a short delay
    setTimeout(() => {
      const newLoading = new Set(loadingPreviews);
      newLoading.delete(fileId);
      setLoadingPreviews(newLoading);
    }, 1000);
  };

  const renderStarsRating = (rating: number, size: number = 24) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={size}
          color="#FFD700"
        />
      ))}
    </View>
  );

  const renderFileCard = (file: any, index: number) => {
    const fileId = `${feedback?.id}-${index}`;
    const isExpanded = expandedFiles.has(fileId);
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    return (
      <View key={fileId} style={styles.fileCard}>
        <View style={styles.fileCardHeader}>
          <View
            style={[
              styles.fileIconContainer,
              { backgroundColor: getFileColor(file) },
            ]}
          >
            <Ionicons
              name={getFileIcon(file) as any}
              size={24}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.fileCardInfo}>
            <Text style={styles.fileCardName} numberOfLines={2}>
              {file.name}
            </Text>
            <Text style={styles.fileCardSize}>
              {file.size
                ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                : "Size unknown"}
            </Text>
          </View>
          <View style={styles.fileCardActions}>
            {isPdf && (
              <TouchableOpacity
                style={styles.previewButton}
                onPress={() => toggleFilePreview(fileId)}
              >
                <Ionicons
                  name={isExpanded ? "eye-off" : "eye"}
                  size={18}
                  color="#2196F3"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={() =>
                setFullScreenPdf({ url: file.url, name: file.name })
              }
            >
              <Ionicons name="expand" size={18} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline PDF Preview */}
        {isPdf && isExpanded && file.url && (
          <View style={styles.pdfPreviewContainer}>
            <View style={styles.pdfPreviewHeader}>
              <Text style={styles.pdfPreviewTitle}>Preview</Text>
              <View style={styles.pdfHeaderActions}>
                {pdfErrors.has(fileId) && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => retryPdfLoad(fileId, file.url)}
                  >
                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.pdfFullscreenButton}
                  onPress={() =>
                    setFullScreenPdf({ url: file.url, name: file.name })
                  }
                >
                  <Text style={styles.pdfFullscreenText}>Full Screen</Text>
                </TouchableOpacity>
              </View>
            </View>
            {pdfErrors.has(fileId) ? (
              <View style={styles.pdfErrorContainer}>
                <Ionicons name="warning" size={32} color="#FF9800" />
                <Text style={styles.pdfErrorTitle}>Preview Unavailable</Text>
                <Text style={styles.pdfErrorText}>
                  Unable to load PDF preview. Try the retry button or open in full screen.
                </Text>
              </View>
            ) : (
              <WebView
                key={`${fileId}-${retryAttempts.get(fileId) || 0}`}
                source={{
                  uri: getPdfViewerUrl(
                    file.url,
                    retryAttempts.get(fileId) || 0
                  ),
                }}
                style={styles.pdfPreview}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                scalesPageToFit={true}
                scrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                renderLoading={() => (
                  <View style={styles.pdfLoading}>
                    <ActivityIndicator size="small" color="#1c463a" />
                    <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
                  </View>
                )}
                onLoadStart={() => {
                  // Clear any existing errors for this file
                  const newErrors = new Set(pdfErrors);
                  newErrors.delete(fileId);
                  setPdfErrors(newErrors);
                }}
                onLoadEnd={() => {
                  // PDF loaded successfully
                }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn("WebView error: ", nativeEvent);

                  // Add to error state
                  const newErrors = new Set(pdfErrors);
                  newErrors.add(fileId);
                  setPdfErrors(newErrors);

                  // Auto-retry with different strategy
                  setTimeout(() => {
                    retryPdfLoad(fileId, file.url);
                  }, 2000);
                }}
                onNavigationStateChange={(navState) => {
                  // Prevent navigation away from the PDF viewer
                  if (navState.url !== getPdfViewerUrl(file.url, retryAttempts.get(fileId) || 0)) {
                    return false;
                  }
                }}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  const getSessionLocation = () => {
    if (!feedback) return null;

    if (
      feedback.session_type === "Online Theory" &&
      feedback.Online_Theory_Meet
    ) {
      return feedback.Online_Theory_Meet;
    }
    if (
      feedback.session_type === "Online Practice" &&
      feedback.Online_Practice_Meet
    ) {
      return feedback.Online_Practice_Meet;
    }
    if (feedback.session_type === "In Person" && feedback.In_person_Location) {
      return feedback.In_person_Location;
    }
    return null;
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
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle"
          size={64}
          color="rgba(255, 255, 255, 0.5)"
        />
        <Text style={styles.errorTitle}>Feedback Not Found</Text>
        <Text style={styles.errorSubtitle}>
          This feedback may have been deleted or is no longer available.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Session Info Card */}
          <LinearGradient
            colors={["#1c463a", "#2d5a4a"]}
            style={styles.sessionCard}
          >
            <View style={styles.sessionHeader}>
              <View style={styles.sessionBadge}>
                <Text style={styles.sessionBadgeText}>
                  Session {feedback.session_number} of{" "}
                  {feedback.session_number2}
                </Text>
              </View>
              <Text style={styles.sessionDate}>
                {new Date(feedback.created_at).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>

            <Text style={styles.sessionType}>{feedback.session_type}</Text>

            {getSessionLocation() && (
              <View style={styles.locationContainer}>
                <Ionicons
                  name="location"
                  size={16}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.locationText}>{getSessionLocation()}</Text>
              </View>
            )}

            <Text style={styles.instructorText}>
              with {feedback.instructor_name}
            </Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Course Progress</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        100,
                        (feedback.session_number / feedback.session_number2) *
                          100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {Math.round(
                  (feedback.session_number / feedback.session_number2) * 100
                )}
                % Complete
              </Text>
            </View>
          </LinearGradient>

          {/* Performance Ratings Card */}
          <View style={styles.ratingsCard}>
            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.15)",
                "rgba(255, 255, 255, 0.08)",
              ]}
              style={styles.ratingsGradient}
            >
              <View style={styles.ratingsHeader}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <Text style={styles.ratingsTitle}>Performance Ratings</Text>
              </View>

              <View style={styles.ratingsGrid}>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Overall Performance</Text>
                  {renderStarsRating(feedback.comment, 28)}
                  <Text style={styles.ratingValue}>{feedback.comment}/5</Text>
                </View>

                {feedback.homework_rating > 0 && (
                  <View style={styles.ratingItem}>
                    <Text style={styles.ratingLabel}>Homework</Text>
                    {renderStarsRating(feedback.homework_rating, 28)}
                    <Text style={styles.ratingValue}>
                      {feedback.homework_rating}/5
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Feedback Comments */}
          {feedback.feedback && (
            <View style={styles.commentCard}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.15)",
                  "rgba(255, 255, 255, 0.08)",
                ]}
                style={styles.commentGradient}
              >
                <View style={styles.commentHeader}>
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={20}
                    color="#1c463a"
                  />
                  <Text style={styles.commentTitle}>Lesson Feedback</Text>
                </View>
                <Text style={styles.commentText}>{feedback.feedback}</Text>
              </LinearGradient>
            </View>
          )}

          {/* Homework Comments */}
          {feedback.HW_comments && (
            <View style={styles.commentCard}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.15)",
                  "rgba(255, 255, 255, 0.08)",
                ]}
                style={styles.commentGradient}
              >
                <View style={styles.commentHeader}>
                  <Ionicons name="book" size={20} color="#1c463a" />
                  <Text style={styles.commentTitle}>Homework Comments</Text>
                </View>
                <Text style={styles.commentText}>{feedback.HW_comments}</Text>
              </LinearGradient>
            </View>
          )}

          {/* Study Materials */}
          {feedback.sheet_files && feedback.sheet_files.length > 0 && (
            <View style={styles.filesCard}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.15)",
                  "rgba(255, 255, 255, 0.08)",
                ]}
                style={styles.filesGradient}
              >
                <View style={styles.filesHeader}>
                  <Ionicons name="musical-notes" size={24} color="#4CAF50" />
                  <Text style={styles.filesTitle}>
                    Study Materials ({feedback.sheet_files.length})
                  </Text>
                </View>
                <Text style={styles.filesSubtitle}>
                  Sheet music and resources for this lesson
                </Text>

                {feedback.sheet_files.map((file, index) =>
                  renderFileCard(file, index)
                )}
              </LinearGradient>
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
              key={`fullscreen-${fullScreenPdf.name}-${
                retryAttempts.get("fullscreen") || 0
              }`}
              source={{
                uri: getPdfViewerUrl(
                  fullScreenPdf.url,
                  retryAttempts.get("fullscreen") || 0
                ),
              }}
              style={styles.fullScreenWebView}
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              scalesPageToFit={true}
              scrollEnabled={true}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              renderLoading={() => (
                <View style={styles.fullScreenLoading}>
                  <ActivityIndicator size="large" color="#1c463a" />
                  <Text style={styles.fullScreenLoadingText}>
                    Loading PDF...
                  </Text>
                </View>
              )}
              onLoadStart={() => {
                // Clear any existing errors for fullscreen
                const newErrors = new Set(pdfErrors);
                newErrors.delete("fullscreen");
                setPdfErrors(newErrors);
              }}
              onLoadEnd={() => {}}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn("Fullscreen WebView error: ", nativeEvent);

                // Auto-retry with different strategy for fullscreen
                setTimeout(() => {
                  const currentAttempts = retryAttempts.get("fullscreen") || 0;
                  if (currentAttempts < 3) {
                    const newAttempts = new Map(retryAttempts);
                    newAttempts.set("fullscreen", currentAttempts + 1);
                    setRetryAttempts(newAttempts);
                  }
                }, 2000);
              }}
              onNavigationStateChange={(navState) => {
                // Prevent navigation away from the PDF viewer
                if (navState.url !== getPdfViewerUrl(fullScreenPdf.url, retryAttempts.get("fullscreen") || 0)) {
                  return false;
                }
              }}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "#1c463a",
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: "#1c463a",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Session Card
  sessionCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sessionBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  sessionBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sessionDate: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  sessionType: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 8,
    fontStyle: "italic",
  },
  instructorText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    textAlign: "right",
  },

  // Ratings Card
  ratingsCard: {
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  ratingsGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  ratingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  ratingsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  ratingsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  ratingItem: {
    alignItems: "center",
    flex: 1,
  },
  ratingLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    textAlign: "center",
  },
  ratingValue: {
    fontSize: 16,
    color: "#FFD700",
    fontWeight: "700",
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 4,
  },

  // Comment Cards
  commentCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  commentGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  commentText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 22,
    fontStyle: "italic",
  },

  // Files Card
  filesCard: {
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filesGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  filesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  filesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  filesSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 16,
    marginLeft: 36,
  },

  // File Cards
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  fileCardInfo: {
    flex: 1,
  },
  fileCardName: {
    fontSize: 16,
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
    gap: 8,
  },
  previewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(33, 150, 243, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // PDF Preview
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
  pdfHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 152, 0, 0.2)",
    borderRadius: 8,
    marginRight: 8,
  },
  retryText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 4,
  },
  pdfErrorContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
  },
  pdfErrorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 8,
  },
  pdfErrorText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 16,
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
    height: 300,
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

  // Fullscreen Modal
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
});
