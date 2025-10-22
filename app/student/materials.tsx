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

// 3D Background Component with expo-three
const ModernBackground = () => {
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Smooth fade in animation
    Animated.timing(opacityAnim, {
      toValue: 0.4,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      // Start continuous animations after fade in

      // Continuous rotation animation - smooth and seamless
      const rotationAnimation = Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 30000, // Even slower for ultra-smooth movement
          easing: Easing.linear, // Linear easing for seamless rotation
          useNativeDriver: true,
        }),
        { iterations: -1 } // Infinite loop
      );

      // Breathing scale animation with smooth easing
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 6000,
            easing: Easing.inOut(Easing.sin), // Smooth sine wave easing
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 6000,
            easing: Easing.inOut(Easing.sin), // Smooth sine wave easing
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 } // Infinite loop
      );

      // Gentle opacity pulsing with smooth transitions
      const opacityAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.45,
            duration: 5000,
            easing: Easing.inOut(Easing.quad), // Smooth quadratic easing
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.35,
            duration: 5000,
            easing: Easing.inOut(Easing.quad), // Smooth quadratic easing
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 } // Infinite loop
      );

      rotationAnimation.start();
      scaleAnimation.start();
      opacityAnimation.start();
    });

    return () => {
      rotationAnim.stopAnimation();
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, []);

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.backgroundContainer}>
      {/* Animated Orbs */}
      <Animated.View
        style={[
          styles.animatedOrb,
          styles.orb1,
          {
            transform: [{ rotate: rotation }, { scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(28, 70, 58, 0.8)",
            "rgba(76, 175, 80, 0.6)",
            "rgba(28, 70, 58, 0.4)",
          ]}
          style={styles.orbGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.animatedOrb,
          styles.orb2,
          {
            transform: [{ rotate: rotation }, { scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(33, 150, 243, 0.6)",
            "rgba(76, 175, 80, 0.4)",
            "rgba(28, 70, 58, 0.3)",
          ]}
          style={styles.orbGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.animatedOrb,
          styles.orb3,
          {
            transform: [{ rotate: rotation }, { scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(76, 175, 80, 0.5)",
            "rgba(28, 70, 58, 0.3)",
            "rgba(0, 0, 0, 0.2)",
          ]}
          style={styles.orbGradient}
        />
      </Animated.View>

      {/* Lighting Effects */}
      <View style={styles.lightingOverlay}>
        <LinearGradient
          colors={[
            "rgba(28, 70, 58, 0.1)",
            "rgba(0, 0, 0, 0.3)",
            "rgba(28, 70, 58, 0.1)",
          ]}
          style={styles.lightingGradient}
        />
      </View>
    </View>
  );
};

interface MaterialFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  uploadedAt: string;
  sessionNumber: number;
  sessionType: string;
  instructorName: string;
  feedbackId: number;
}

interface StudentMaterialsScreenProps {
  selectedFileId?: string;
}

export default function StudentMaterialsScreen({
  selectedFileId,
}: StudentMaterialsScreenProps = {}) {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const [materials, setMaterials] = useState<MaterialFile[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<MaterialFile[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [fullScreenPdf, setFullScreenPdf] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [filePositions, setFilePositions] = useState<Record<string, number>>(
    {}
  );
  const [fileLoadingStates, setFileLoadingStates] = useState<
    Record<string, "loading" | "loaded" | "error">
  >({});
  const [fileValidationCache, setFileValidationCache] = useState<
    Record<string, boolean>
  >({});
  const [pdfRetryCount, setPdfRetryCount] = useState<Record<string, number>>(
    {}
  );
  const [pdfLoadErrors, setPdfLoadErrors] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    loadMaterials();
  }, []);
  useEffect(() => {
    filterMaterialsByDate();
  }, [materials, selectedDateFilter]);

  useEffect(() => {
    // Auto-expand the selected file if provided (from navigation params or prop)
    const fileIdToExpand = Array.isArray(params.selectedFileId)
      ? params.selectedFileId[0]
      : params.selectedFileId || selectedFileId;
    const fileNameToExpand = Array.isArray(params.selectedFileName)
      ? params.selectedFileName[0]
      : params.selectedFileName;

    if (
      fileIdToExpand &&
      materials.length > 0 &&
      filteredMaterials.length > 0
    ) {
      // Find the material by ID or name
      let fileToExpand = filteredMaterials.find((m) => m.id === fileIdToExpand);

      // If not found by ID, try to find by name
      if (!fileToExpand && fileNameToExpand) {
        fileToExpand = filteredMaterials.find(
          (m) => m.name === fileNameToExpand
        );
      }

      // If still not found, try partial name matching
      if (!fileToExpand && fileNameToExpand) {
        fileToExpand = filteredMaterials.find(
          (m) =>
            m.name.toLowerCase().includes(fileNameToExpand.toLowerCase()) ||
            fileNameToExpand.toLowerCase().includes(m.name.toLowerCase())
        );
      }

      if (fileToExpand) {
        // For PDFs, validate and expand with preview
        if (fileToExpand.type === "PDF") {
          const autoExpandFile = async () => {
            const isValid = await validateAndPreloadFile(
              fileToExpand.url,
              fileToExpand.id
            );

            if (isValid) {
              setExpandedFiles(new Set([fileToExpand.id]));

              // Scroll to the file after a short delay to ensure rendering is complete
              setTimeout(() => {
                const fileIndex = filteredMaterials.findIndex(
                  (m) => m.id === fileToExpand.id
                );
                if (fileIndex !== -1 && scrollViewRef.current) {
                  // Estimate scroll position (each file card is approximately 250px + margins)
                  const estimatedPosition = fileIndex * 300 + 200; // 200px for stats/filters
                  scrollViewRef.current.scrollTo({
                    y: estimatedPosition,
                    animated: true,
                  });
                }
              }, 800); // Increased delay to account for validation
            } else {
              // Show error message if auto-selected file is invalid
              setTimeout(() => {
                Alert.alert(
                  "File Preview Error",
                  `The selected file "${
                    fileNameToExpand || fileIdToExpand
                  }" cannot be previewed. It may be corrupted or temporarily unavailable.`,
                  [{ text: "OK" }]
                );
              }, 1000);
            }
          };

          autoExpandFile();
        } else {
          // For non-PDF files, just scroll to the file without expanding
          setTimeout(() => {
            const fileIndex = filteredMaterials.findIndex(
              (m) => m.id === fileToExpand.id
            );
            if (fileIndex !== -1 && scrollViewRef.current) {
              const estimatedPosition = fileIndex * 300 + 200;
              scrollViewRef.current.scrollTo({
                y: estimatedPosition,
                animated: true,
              });
            }
          }, 500);
        }
      }
    }
  }, [
    params.selectedFileId,
    params.selectedFileName,
    selectedFileId,
    materials,
    filteredMaterials,
  ]);

  // Function to validate and preload file with enhanced PDF checking
  const validateAndPreloadFile = async (
    fileUrl: string,
    fileId: string
  ): Promise<boolean> => {
    // Check cache first
    if (fileValidationCache[fileId] !== undefined) {
      return fileValidationCache[fileId];
    }

    setFileLoadingStates((prev) => ({ ...prev, [fileId]: "loading" }));

    try {
      // Test if file is accessible
      const response = await fetch(fileUrl, { method: "HEAD" });
      const isValid = response.ok && response.status === 200;

      if (isValid) {
        // For PDFs, also test if PDF.js viewer can handle it
        const isPdf = fileUrl.toLowerCase().includes(".pdf");
        if (isPdf) {
          const pdfJsUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
            fileUrl
          )}`;
          try {
            const pdfJsResponse = await fetch(pdfJsUrl, { method: "HEAD" });
            const pdfJsValid = pdfJsResponse.ok;

            setFileValidationCache((prev) => ({
              ...prev,
              [fileId]: pdfJsValid,
            }));
            setFileLoadingStates((prev) => ({
              ...prev,
              [fileId]: pdfJsValid ? "loaded" : "error",
            }));

            return pdfJsValid;
          } catch (pdfJsError) {
            console.error(`PDF.js viewer error for ${fileId}:`, pdfJsError);
            setFileValidationCache((prev) => ({ ...prev, [fileId]: false }));
            setFileLoadingStates((prev) => ({ ...prev, [fileId]: "error" }));
            return false;
          }
        }
      }

      // Update cache and loading state
      setFileValidationCache((prev) => ({ ...prev, [fileId]: isValid }));
      setFileLoadingStates((prev) => ({
        ...prev,
        [fileId]: isValid ? "loaded" : "error",
      }));

      return isValid;
    } catch (error) {
      console.error(`Error validating file ${fileId}:`, error);
      setFileValidationCache((prev) => ({ ...prev, [fileId]: false }));
      setFileLoadingStates((prev) => ({ ...prev, [fileId]: "error" }));
      return false;
    }
  };

  // Instant toggle without validation
  const toggleFilePreview = (fileId: string) => {
    const newExpanded = new Set(expandedFiles);

    if (newExpanded.has(fileId)) {
      // Close the preview
      newExpanded.delete(fileId);
    } else {
      // Open the preview immediately
      newExpanded.add(fileId);
    }
    setExpandedFiles(newExpanded);
  };

  // Function to handle PDF load errors and retry
  const handlePdfError = (materialId: string, materialUrl: string) => {
    const currentRetries = pdfRetryCount[materialId] || 0;

    if (currentRetries < 2) {
      // Allow up to 2 retries
      setPdfRetryCount((prev) => ({
        ...prev,
        [materialId]: currentRetries + 1,
      }));

      // Retry after a short delay
      setTimeout(() => {
        setPdfLoadErrors((prev) => ({ ...prev, [materialId]: false }));
      }, 1000);
    } else {
      // Mark as permanently failed
      setPdfLoadErrors((prev) => ({ ...prev, [materialId]: true }));
      Alert.alert(
        "PDF Loading Error",
        "This PDF cannot be displayed. The file may be corrupted or incompatible with the preview system.",
        [
          { text: "OK" },
          {
            text: "Try Fullscreen",
            onPress: () =>
              setFullScreenPdf({ url: materialUrl, name: "PDF Document" }),
          },
        ]
      );
    }
  };

  // Function to get alternative PDF URL with cache busting
  const getPdfUrl = (originalUrl: string, materialId: string) => {
    const retries = pdfRetryCount[materialId] || 0;
    const cacheBuster = retries > 0 ? `&t=${Date.now()}` : "";
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
      originalUrl
    )}${cacheBuster}`;
  };

  const loadMaterials = async () => {
    try {
      if (!user?.id) return;

      // Load feedback with files
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select(
          `
          id,
          session_number,
          session_type,
          sheet_files,
          created_at,
          instructor_id
        `
        )
        .eq("student_id", user.id)
        .not("sheet_files", "is", null)
        .order("created_at", { ascending: false });

      if (feedbackError) throw feedbackError;

      console.log("Materials data loaded:", feedbackData?.length, "records");
      console.log("Sample feedback with files:", feedbackData?.[0]);

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

      // Process files from feedback
      const allMaterials: MaterialFile[] = [];

      feedbackData.forEach((feedback: any) => {
        if (feedback.sheet_files && Array.isArray(feedback.sheet_files)) {
          feedback.sheet_files.forEach((file: any, index: number) => {
            allMaterials.push({
              id: file.id || `${feedback.id}-${index}`,
              name: file.name || `File ${index + 1}`,
              url: file.url || "",
              type: getFileTypeFromFile(file),
              size: file.size,
              uploadedAt: feedback.created_at,
              sessionNumber: feedback.session_number,
              sessionType: feedback.session_type,
              instructorName:
                instructorMap[feedback.instructor_id] || "Unknown",
              feedbackId: feedback.id,
            });
          });
        }
      });

      setMaterials(allMaterials);
    } catch (error) {
      console.error("Error loading materials:", error);
      Alert.alert("Error", "Failed to load your materials");
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeFromFile = (file: any): string => {
    const type = file.type || "";
    const name = file.name || "";

    if (type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
      return "PDF";
    }
    if (
      type.startsWith("image/") ||
      name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp)$/i)
    ) {
      return "Image";
    }
    if (
      type.startsWith("audio/") ||
      name.toLowerCase().match(/\.(mp3|wav|aac|ogg|flac)$/i)
    ) {
      return "Audio";
    }
    if (
      type.startsWith("video/") ||
      name.toLowerCase().match(/\.(mp4|mov|avi|wmv|flv)$/i)
    ) {
      return "Video";
    }
    if (
      type.includes("document") ||
      name.toLowerCase().match(/\.(doc|docx)$/i)
    ) {
      return "Document";
    }
    return "File";
  };

  const getFileIcon = (type: string): string => {
    switch (type) {
      case "PDF":
        return "document-text";
      case "Image":
        return "image";
      case "Audio":
        return "musical-notes";
      case "Video":
        return "videocam";
      case "Document":
        return "document";
      default:
        return "attach";
    }
  };

  const getFileColor = (type: string): string => {
    switch (type) {
      case "PDF":
        return "#F44336";
      case "Image":
        return "#4CAF50";
      case "Audio":
        return "#9C27B0";
      case "Video":
        return "#2196F3";
      case "Document":
      default:
        return "#9E9E9E";
    }
  };

  const filterMaterialsByDate = () => {
    let filtered = materials;

    if (selectedDateFilter !== "all") {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      if (selectedDateFilter === "recent") {
        // Show files from last 2 weeks
        filtered = filtered.filter(
          (material) => new Date(material.uploadedAt) >= twoWeeksAgo
        );
      } else if (selectedDateFilter === "older") {
        // Show files older than 2 weeks
        filtered = filtered.filter(
          (material) => new Date(material.uploadedAt) < twoWeeksAgo
        );
      }
    }

    setFilteredMaterials(filtered);
  };

  const renderDateFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
      >
        {[
          { key: "all", label: "All Files" },
          { key: "recent", label: "Recent (2 weeks)" },
          { key: "older", label: "Older" },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedDateFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedDateFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterText,
                selectedDateFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMaterialCard = (material: MaterialFile) => {
    const isExpanded = expandedFiles.has(material.id);
    const isPdf = material.type === "PDF";

    // Check if this is the file that was selected from dashboard
    const fileIdFromDashboard = Array.isArray(params.selectedFileId)
      ? params.selectedFileId[0]
      : params.selectedFileId;
    const fileNameFromDashboard = Array.isArray(params.selectedFileName)
      ? params.selectedFileName[0]
      : params.selectedFileName;
    const isSelectedFromDashboard =
      (fileIdFromDashboard && material.id === fileIdFromDashboard) ||
      (fileNameFromDashboard && material.name === fileNameFromDashboard);

    return (
      <View
        key={material.id}
        style={[
          styles.materialCard,
          isSelectedFromDashboard && styles.materialCardSelected,
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.7)",
            "rgba(0, 0, 0, 0.5)",
            "rgba(0, 0, 0, 0.6)",
          ]}
          style={styles.materialGradient}
        >
          <View style={styles.materialHeader}>
            <View
              style={[
                styles.fileIcon,
                { backgroundColor: getFileColor(material.type) },
              ]}
            >
              <Ionicons
                name={getFileIcon(material.type) as any}
                size={28}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.materialInfo}>
              <Text style={styles.materialName} numberOfLines={2}>
                {material.name}
              </Text>
              <Text style={styles.materialType}>
                {material.type}{" "}
                {material.size
                  ? `• ${(material.size / 1024 / 1024).toFixed(1)} MB`
                  : ""}
              </Text>
            </View>
            <View style={styles.materialActions}>
              {isPdf && (
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => toggleFilePreview(material.id)}
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
                  setFullScreenPdf({ url: material.url, name: material.name })
                }
              >
                <Ionicons name="expand" size={16} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.materialFooter}>
            <View style={styles.sessionInfo}>
              <Ionicons name="book" size={14} color="#1c463a" />
              <Text style={styles.sessionText}>
                Session {material.sessionNumber} - {material.sessionType}
              </Text>
            </View>
            <View style={styles.instructorInfo}>
              <Ionicons
                name="person"
                size={14}
                color="rgba(255, 255, 255, 0.6)"
              />
              <Text style={styles.instructorText}>
                {material.instructorName}
              </Text>
            </View>
          </View>

          <Text style={styles.uploadDate}>
            Shared {new Date(material.uploadedAt).toLocaleDateString()}
          </Text>

          {/* Inline PDF Preview */}
          {isPdf && isExpanded && material.url && (
            <View style={styles.pdfPreviewContainer}>
              <View style={styles.pdfPreviewHeader}>
                <Text style={styles.pdfPreviewTitle}>Preview</Text>
                <TouchableOpacity
                  style={styles.pdfFullscreenButton}
                  onPress={() =>
                    setFullScreenPdf({ url: material.url, name: material.name })
                  }
                >
                  <Text style={styles.pdfFullscreenText}>Full Screen</Text>
                </TouchableOpacity>
              </View>
              {pdfLoadErrors[material.id] ? (
                <View style={styles.pdfError}>
                  <Ionicons name="warning" size={32} color="#F44336" />
                  <Text style={styles.pdfErrorText}>PDF Preview Failed</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                      setPdfLoadErrors((prev) => ({
                        ...prev,
                        [material.id]: false,
                      }));
                      setPdfRetryCount((prev) => ({
                        ...prev,
                        [material.id]: 0,
                      }));
                    }}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <WebView
                  key={`${material.id}-${pdfRetryCount[material.id] || 0}`}
                  source={{ uri: getPdfUrl(material.url, material.id) }}
                  style={styles.pdfPreview}
                  startInLoadingState={true}
                  onError={() => handlePdfError(material.id, material.url)}
                  onHttpError={() => handlePdfError(material.id, material.url)}
                  scrollEnabled={true}
                  scalesPageToFit={true}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsInlineMediaPlayback={true}
                  mixedContentMode="compatibility"
                  originWhitelist={["*"]}
                  userAgent="Mozilla/5.0 (compatible; PDF Viewer)"
                  onLoadEnd={(event) => {
                    // Check if the WebView loaded successfully but shows blank content
                    if (event.nativeEvent.loading === false) {
                      setTimeout(() => {
                        // This is a workaround to detect blank PDF loads
                        // In a real app, you might want to inject JavaScript to check content
                      }, 2000);
                    }
                  }}
                  renderLoading={() => (
                    <View style={styles.pdfLoading}>
                      <ActivityIndicator size="small" color="#1c463a" />
                      <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
                    </View>
                  )}
                  renderError={() => (
                    <View style={styles.pdfError}>
                      <Ionicons name="warning" size={32} color="#F44336" />
                      <Text style={styles.pdfErrorText}>
                        Failed to load PDF
                      </Text>
                    </View>
                  )}
                />
              )}
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  const renderStats = () => {
    const totalFiles = materials.length;
    const fileTypes = materials.reduce((acc, material) => {
      acc[material.type] = (acc[material.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <LinearGradient colors={["#1c463a", "#2d5a4a"]} style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Ionicons name="folder-open" size={24} color="#FFFFFF" />
          <Text style={styles.statsTitle}>Your Study Materials</Text>
        </View>
        <Text style={styles.statsSubtitle}>
          {totalFiles} files shared by your instructors
        </Text>

        <View style={styles.typeStats}>
          {Object.entries(fileTypes)
            .slice(0, 4)
            .map(([type, count]) => (
              <View key={type} style={styles.typeStat}>
                <Text style={styles.typeCount}>{count}</Text>
                <Text style={styles.typeLabel}>{type}</Text>
              </View>
            ))}
        </View>
      </LinearGradient>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c463a" />
        <Text style={styles.loadingText}>Loading your materials...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ModernBackground />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {renderStats()}
          {renderDateFilter()}

          {filteredMaterials.length > 0 ? (
            filteredMaterials.map(renderMaterialCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="folder-open-outline"
                size={64}
                color="rgba(255, 255, 255, 0.3)"
              />
              <Text style={styles.emptyTitle}>No materials found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedDateFilter !== "all"
                  ? "No files found for the selected time period"
                  : "Your instructors haven't shared any files yet"}
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
              source={{
                uri: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
                  fullScreenPdf.url
                )}`,
              }}
              style={styles.fullScreenWebView}
              startInLoadingState={true}
              scrollEnabled={true}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mixedContentMode="compatibility"
              originWhitelist={["*"]}
              userAgent="Mozilla/5.0 (compatible; PDF Viewer)"
              renderLoading={() => (
                <View style={styles.fullScreenLoading}>
                  <ActivityIndicator size="large" color="#1c463a" />
                  <Text style={styles.fullScreenLoadingText}>
                    Loading PDF...
                  </Text>
                </View>
              )}
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
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  statsSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 20,
  },
  typeStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  typeStat: {
    alignItems: "center",
  },
  typeCount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },
  materialCard: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    overflow: "hidden",
  },
  materialCardSelected: {
    borderWidth: 2,
    borderColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  materialGradient: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(20px)",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  materialHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  fileIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  materialType: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  materialActions: {
    flexDirection: "row",
  },
  previewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(33, 150, 243, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.5)",
    backdropFilter: "blur(10px)",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  previewButtonLoading: {
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    opacity: 0.7,
  },
  previewButtonError: {
    backgroundColor: "rgba(244, 67, 54, 0.2)",
  },
  fullscreenButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(76, 175, 80, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.5)",
    backdropFilter: "blur(10px)",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  materialFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sessionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sessionText: {
    fontSize: 12,
    color: "rgba(76, 175, 80, 0.9)",
    marginLeft: 6,
    fontWeight: "700",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  instructorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  instructorText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginLeft: 6,
    fontWeight: "600",
    fontStyle: "italic",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  uploadDate: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
    fontStyle: "italic",
    fontWeight: "500",
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pdfPreviewContainer: {
    marginTop: 16,
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
    paddingHorizontal: 32,
  },
  filterContainer: {
    marginBottom: 24,
  },
  filterScrollView: {
    flexDirection: "row",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterButtonActive: {
    backgroundColor: "#1c463a",
    borderColor: "#1c463a",
  },
  filterText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  // PDF Error Styles
  pdfError: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
  },
  pdfErrorText: {
    fontSize: 14,
    color: "#F44336",
    marginTop: 8,
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#F44336",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  // Modern 3D Background Styles
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  animatedOrb: {
    position: "absolute",
    borderRadius: 200,
    overflow: "hidden",
  },
  orb1: {
    width: 400,
    height: 400,
    top: -100,
    right: -100,
  },
  orb2: {
    width: 300,
    height: 300,
    bottom: 100,
    left: -50,
  },
  orb3: {
    width: 250,
    height: 250,
    top: "40%",
    right: -75,
  },
  orbGradient: {
    flex: 1,
    borderRadius: 200,
  },
  lightingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lightingGradient: {
    flex: 1,
  },
});
