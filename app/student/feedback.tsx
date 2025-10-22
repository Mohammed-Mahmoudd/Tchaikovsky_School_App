import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../supabase";
import { useAuth } from "../components/login/AuthContext";
import { useRouter } from "expo-router";

// Tchaikovsky School Themed Background Component with musical lighting
const TchaikovskyThemedBackground = () => {
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth fade in animation
    Animated.timing(opacityAnim, {
      toValue: 0.3,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      // Start continuous animations after fade in
      
      // Continuous rotation animation - ultra smooth
      const rotationAnimation = Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 35000, // Very slow for smooth movement
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      );

      // Gentle breathing scale animation
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.92,
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );

      // Gentle opacity pulsing
      const opacityAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 6000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.2,
            duration: 6000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );

      // Pulse animation for lighting effects
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.circle),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.circle),
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );

      // Floating animation
      const floatAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );

      rotationAnimation.start();
      scaleAnimation.start();
      opacityAnimation.start();
      pulseAnimation.start();
      floatAnimation.start();
    });

    return () => {
      rotationAnim.stopAnimation();
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
      pulseAnim.stopAnimation();
      floatAnim.stopAnimation();
    };
  }, []);

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 20],
  });

  return (
    <View style={styles.lightingContainer}>
      {/* Tchaikovsky School Green Light Orbs */}
      <Animated.View
        style={[
          styles.lightOrb,
          styles.lightOrb1,
          {
            transform: [
              { rotate: rotation },
              { scale: scaleAnim },
              { translateY: floatY },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(28, 70, 58, 0.4)",
            "rgba(76, 175, 80, 0.3)",
            "rgba(28, 70, 58, 0.1)",
          ]}
          style={styles.lightGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.lightOrb,
          styles.lightOrb2,
          {
            transform: [
              { rotate: rotation },
              { scale: pulseScale },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(76, 175, 80, 0.35)",
            "rgba(129, 199, 132, 0.25)",
            "rgba(28, 70, 58, 0.15)",
          ]}
          style={styles.lightGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.lightOrb,
          styles.lightOrb3,
          {
            transform: [
              { rotate: rotation },
              { scale: scaleAnim },
              { translateY: floatY },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(165, 214, 167, 0.3)",
            "rgba(76, 175, 80, 0.2)",
            "rgba(28, 70, 58, 0.1)",
          ]}
          style={styles.lightGradient}
        />
      </Animated.View>

      {/* Musical Ambient Light Overlay */}
      <View style={styles.ambientOverlay}>
        <LinearGradient
          colors={[
            "rgba(28, 70, 58, 0.08)",
            "rgba(76, 175, 80, 0.12)",
            "rgba(28, 70, 58, 0.05)",
          ]}
          style={styles.ambientGradient}
        />
      </View>

      {/* Musical Spotlight Effects */}
      <Animated.View
        style={[
          styles.spotlight,
          styles.spotlight1,
          {
            opacity: pulseAnim,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(76, 175, 80, 0.25)",
            "rgba(129, 199, 132, 0.1)",
            "transparent",
          ]}
          style={styles.spotlightGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.spotlight,
          styles.spotlight2,
          {
            opacity: pulseAnim,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(165, 214, 167, 0.2)",
            "rgba(76, 175, 80, 0.08)",
            "transparent",
          ]}
          style={styles.spotlightGradient}
        />
      </Animated.View>

      {/* Floating Musical Notes */}
      <Animated.View
        style={[
          styles.musicalNote,
          styles.note1,
          {
            transform: [
              { translateY: floatY },
              { rotate: rotation },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <Ionicons name="musical-note" size={24} color="rgba(76, 175, 80, 0.3)" />
      </Animated.View>

      <Animated.View
        style={[
          styles.musicalNote,
          styles.note2,
          {
            transform: [
              { translateY: floatY },
              { scale: pulseScale },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <Ionicons name="musical-notes" size={20} color="rgba(129, 199, 132, 0.4)" />
      </Animated.View>

      <Animated.View
        style={[
          styles.musicalNote,
          styles.note3,
          {
            transform: [
              { translateY: floatY },
              { rotate: rotation },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <Ionicons name="musical-note" size={18} color="rgba(165, 214, 167, 0.35)" />
      </Animated.View>
    </View>
  );
};

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
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const feedbackRefs = useRef<{ [key: string]: View | null }>({});
  const [loading, setLoading] = useState(true);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackData[]>([]);
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
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  
  // Lightweight navigation state
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    loadFeedbackHistory();
  }, []);

  // Handle highlighting from dashboard navigation
  useEffect(() => {
    if (params.highlightId && feedbackHistory.length > 0) {
      const highlightId = params.highlightId as string;
      setHighlightedId(highlightId);

      // Scroll to the highlighted feedback after a short delay
      setTimeout(() => {
        const feedbackRef = feedbackRefs.current[highlightId];
        if (feedbackRef && scrollViewRef.current) {
          feedbackRef.measureLayout(
            scrollViewRef.current as any,
            (x, y) => {
              scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
            },
            () => {}
          );
        }
      }, 500);

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedId(null);
      }, 3000);
    }
  }, [params.highlightId, feedbackHistory]);

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
      const instructorIds = [
        ...new Set(feedbackData.map((f) => f.instructor_id).filter(Boolean)),
      ];

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
        instructor_name:
          instructorMap[feedback.instructor_id] || "Unknown Instructor",
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
              size={20}
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
                  size={16}
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
              <Ionicons name="expand" size={16} color="#4CAF50" />
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

  // Fast navigation function
  const navigateToFeedbackDetails = (feedbackId: number) => {
    if (isNavigating) return; // Prevent double taps
    
    setIsNavigating(true);
    console.log("Navigating to feedback details:", feedbackId);
    router.push(`/student/feedback-details?id=${feedbackId}`);
    
    // Reset navigation state quickly
    setTimeout(() => setIsNavigating(false), 100);
  };

  const renderFeedbackCard = (feedback: FeedbackData) => {
    const isHighlighted = highlightedId === feedback.id.toString();

    return (
      <TouchableOpacity
        key={feedback.id}
        style={[styles.feedbackCard, isHighlighted && styles.highlightedCard]}
        onPress={() => navigateToFeedbackDetails(feedback.id)}
        activeOpacity={0.8}
        delayPressIn={0} // Instant response
        disabled={isNavigating} // Prevent double taps
        ref={(ref) => {
          feedbackRefs.current[feedback.id.toString()] = ref;
        }}
      >
        <LinearGradient
          colors={["rgba(0, 0, 0, 0.7)", "rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0.6)"]}
          style={[styles.feedbackGradient, isHighlighted && styles.highlightedCard]}
        >
          <View style={styles.compactHeader}>
            <Text style={styles.sessionTitle}>
              Session {feedback.session_number}
            </Text>
            <Text style={styles.compactDate}>
              {new Date(feedback.created_at).toLocaleDateString()}
            </Text>
          </View>

          {/* Main Content Row */}
          <View style={styles.mainContentRow}>
            {/* Left: Performance Rating */}
            <View style={styles.performanceSection}>
              <Text style={styles.performanceLabel}>Performance</Text>
              <View style={styles.compactStars}>
                {renderStarsRating(feedback.comment)}
              </View>
            </View>

            {/* Right: Homework Rating (if exists) */}
            {feedback.homework_rating > 0 && (
              <View style={styles.homeworkSection}>
                <Text style={styles.homeworkLabel}>Homework</Text>
                <View style={styles.compactStars}>
                  {renderStarsRating(feedback.homework_rating)}
                </View>
              </View>
            )}
          </View>

          {/* Essential Comments Only */}
          {feedback.feedback && (
            <View style={styles.essentialComment}>
              <Text style={styles.essentialCommentText} numberOfLines={2}>
                {feedback.feedback}
              </Text>
            </View>
          )}

          {/* Files Count (if any) */}
          {feedback.sheet_files && feedback.sheet_files.length > 0 && (
            <View style={styles.filesIndicator}>
              <Ionicons name="musical-note" size={16} color="#4CAF50" />
              <Text style={styles.filesCount}>
                {feedback.sheet_files.length} study file
                {feedback.sheet_files.length > 1 ? "s" : ""}
              </Text>
            </View>
          )}

          {/* Instructor Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.compactInstructor}>
              by {feedback.instructor_name}
            </Text>
            <View style={styles.clickIndicator}>
              <Text style={styles.clickText}>TAP TO VIEW</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

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
    const validRatings = feedbackHistory.filter((f) => {
      console.log(
        `Feedback ${f.id}: comment=${
          f.comment
        } (type: ${typeof f.comment}), homework_rating=${f.homework_rating}`
      );

      // Convert to number if it's a string
      const commentValue =
        typeof f.comment === "string" ? parseFloat(f.comment) : f.comment;

      // Only include ratings that are between 1-5 (star ratings)
      const hasValidComment =
        commentValue &&
        commentValue >= 1 &&
        commentValue <= 5 &&
        !isNaN(commentValue);
      console.log(`Comment value: ${commentValue}, Valid: ${hasValidComment}`);
      return hasValidComment;
    });

    console.log("Valid ratings found:", validRatings.length);
    console.log(
      "Valid ratings data:",
      validRatings.map((f) => ({ id: f.id, comment: f.comment }))
    );

    const averageRating =
      validRatings.length > 0
        ? validRatings.reduce((sum, f) => {
            const commentValue =
              typeof f.comment === "string" ? parseFloat(f.comment) : f.comment;
            return sum + commentValue;
          }, 0) / validRatings.length
        : 0;

    console.log("Calculated average rating:", averageRating);

    // Calculate homework average
    const validHomeworkRatings = feedbackHistory.filter(
      (f) => f.homework_rating && f.homework_rating > 0
    );

    console.log("Valid homework ratings found:", validHomeworkRatings.length);

    const homeworkAverage =
      validHomeworkRatings.length > 0
        ? validHomeworkRatings.reduce((sum, f) => sum + f.homework_rating, 0) /
          validHomeworkRatings.length
        : 0;

    console.log("Calculated homework average:", homeworkAverage);

    const totalFiles = feedbackHistory.reduce(
      (sum, f) => sum + (f.sheet_files?.length || 0),
      0
    );

    console.log("Total files:", totalFiles);
    console.log("=== END DEBUG ===");

    // Recent sessions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSessions = feedbackHistory.filter(
      (f) => new Date(f.created_at) >= thirtyDaysAgo
    ).length;

    return (
      <LinearGradient colors={["#1c463a", "#2d5a4a"]} style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Ionicons name="book" size={24} color="#FFFFFF" />
          <Text style={styles.statsTitle}>Your Learning Progress</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalFiles}</Text>
            <Text style={styles.statLabel}>Study Files</Text>
            <Ionicons
              name="folder-open"
              size={16}
              color="rgba(255,255,255,0.8)"
              style={styles.statIcon}
            />
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{homeworkAverage.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Homework Avg</Text>
            <View style={styles.miniStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={
                    star <= Math.round(homeworkAverage)
                      ? "star"
                      : "star-outline"
                  }
                  size={12}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {averageRating > 0 ? averageRating.toFixed(1) : "N/A"}
            </Text>
            <Text style={styles.statLabel}>Performance Avg</Text>
            {averageRating > 0 && (
              <View style={styles.miniStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={
                      star <= Math.round(averageRating)
                        ? "star"
                        : "star-outline"
                    }
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
              <Ionicons
                name="trending-up"
                size={16}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.insightText}>
                {validRatings.length} rated sessions completed
              </Text>
            </View>
          )}
          {validHomeworkRatings.length > 0 && (
            <View style={styles.insightItem}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="rgba(255,255,255,0.8)"
              />
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TchaikovskyThemedBackground />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {renderStats()}

          <Text style={styles.sectionTitle}>Feedback History</Text>

          {feedbackHistory.length > 0 ? (
            feedbackHistory.map(renderFeedbackCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="book-outline"
                size={64}
                color="rgba(255, 255, 255, 0.3)"
              />
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
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    overflow: "hidden",
  },
  highlightedCard: {
    borderWidth: 2,
    borderColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  feedbackGradient: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(20px)",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },

  // Compact Feedback Card Styles
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sessionBadge: {
    backgroundColor: "#1c463a",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  compactDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  mainContentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  performanceSection: {
    flex: 1,
    alignItems: "center",
  },
  performanceLabel: {
    fontSize: 11,
    color: "rgba(76, 175, 80, 0.9)",
    marginBottom: 4,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  homeworkSection: {
    flex: 1,
    alignItems: "center",
  },
  homeworkLabel: {
    fontSize: 11,
    color: "rgba(33, 150, 243, 0.9)",
    marginBottom: 4,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  compactStars: {
    flexDirection: "row",
  },
  essentialComment: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
  },
  essentialCommentText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 18,
    fontStyle: "italic",
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  filesIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  filesCount: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 6,
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
    height: 200,
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
  // New styles for enhanced clickable cards
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  clickIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.4)",
    backdropFilter: "blur(10px)",
  },
  clickText: {
    fontSize: 10,
    color: "#FFFFFF",
    marginRight: 4,
    fontWeight: "700",
    letterSpacing: 0.8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  compactInstructor: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    fontStyle: "italic",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // White Lighting Background Styles
  lightingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  lightOrb: {
    position: "absolute",
    borderRadius: 300,
    overflow: "hidden",
  },
  lightOrb1: {
    width: 500,
    height: 500,
    top: -150,
    right: -150,
  },
  lightOrb2: {
    width: 350,
    height: 350,
    bottom: 150,
    left: -100,
  },
  lightOrb3: {
    width: 280,
    height: 280,
    top: "45%",
    right: -90,
  },
  lightGradient: {
    flex: 1,
    borderRadius: 300,
  },
  ambientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ambientGradient: {
    flex: 1,
  },
  spotlight: {
    position: "absolute",
    borderRadius: 200,
    overflow: "hidden",
  },
  spotlight1: {
    width: 400,
    height: 400,
    top: "20%",
    left: -100,
  },
  spotlight2: {
    width: 300,
    height: 300,
    bottom: "30%",
    right: -80,
  },
  spotlightGradient: {
    flex: 1,
    borderRadius: 200,
  },
  musicalNote: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  note1: {
    top: "25%",
    left: "15%",
  },
  note2: {
    top: "60%",
    right: "20%",
  },
  note3: {
    top: "40%",
    left: "75%",
  },
});
