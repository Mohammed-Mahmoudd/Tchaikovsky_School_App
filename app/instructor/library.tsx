import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Modal,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { supabase } from "../../supabase.js";

const { width } = Dimensions.get("window");

interface Folder {
  id: number;
  name: string;
  description?: string;
  subfolder_count: number;
  created_at: string;
}

interface Subfolder {
  id: number;
  name: string;
  description?: string;
  parent_folder_id: number;
  files: any[];
  created_at: string;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: string;
  uploadedBy: string;
}

type ViewType = "folders" | "subfolders" | "files";

export default function InstructorLibrary() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [subfolders, setSubfolders] = useState<Subfolder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>("folders");
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedSubfolder, setSelectedSubfolder] = useState<Subfolder | null>(
    null
  );
  const [breadcrumb, setBreadcrumb] = useState<string[]>(["Music Library"]);
  const [fullScreenPdf, setFullScreenPdf] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [expandedPreviews, setExpandedPreviews] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadFileData();
  }, []);

  const loadFileData = async () => {
    try {
      setLoading(true);
      const [foldersResult, subfoldersResult] = await Promise.all([
        supabase
          .from("folders")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("subfolders")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      const foldersData = foldersResult.data || [];
      const subfoldersData = subfoldersResult.data || [];

      setFolders(foldersData);
      setSubfolders(subfoldersData);
      // Extract all files from subfolders
      let extractedFiles: FileItem[] = [];
      subfoldersData.forEach((subfolder) => {
        if (subfolder.files && Array.isArray(subfolder.files)) {
          subfolder.files.forEach((file: any) => {
            extractedFiles.push({
              ...file,
              folderName: subfolder.name,
              source: "subfolder",
            });
          });
        }
      });

      setFiles(extractedFiles);
    } catch (error) {
      console.error("Error loading file data:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folder: Folder) => {
    setSelectedFolder(folder);
    setCurrentView("subfolders");
    setBreadcrumb(["Music Library", folder.name]);
    setExpandedPreviews(new Set()); // Clear expanded previews
    setSearchQuery(""); // Clear search when navigating away from files
  };

  const navigateToSubfolder = (subfolder: Subfolder) => {
    setSelectedSubfolder(subfolder);
    setCurrentView("files");
    const extractedFiles =
      subfolder.files?.map((file) => ({
        ...file,
        folderName: subfolder.name,
        source: "subfolder",
      })) || [];
    setFiles(extractedFiles);
    setBreadcrumb([
      "Music Library",
      selectedFolder?.name || "",
      subfolder.name,
    ]);

    // Auto-expand the first PDF
    const firstPdf = extractedFiles.find(
      (file) =>
        file.type?.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")
    );
    if (firstPdf) {
      setExpandedPreviews(new Set([firstPdf.id]));
    } else {
      setExpandedPreviews(new Set());
    }
  };

  const navigateBack = () => {
    if (currentView === "files") {
      setCurrentView("subfolders");
      setBreadcrumb(["Music Library", selectedFolder?.name || ""]);
      setExpandedPreviews(new Set()); // Clear expanded previews when leaving files
    } else if (currentView === "subfolders") {
      setCurrentView("folders");
      setSelectedFolder(null);
      setBreadcrumb(["Music Library"]);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === 0) {
      setCurrentView("folders");
      setSelectedFolder(null);
      setSelectedSubfolder(null);
      setBreadcrumb(["Music Library"]);
      setExpandedPreviews(new Set()); // Clear expanded previews
      setSearchQuery(""); // Clear search when navigating away from files
    } else if (index === 1 && selectedFolder) {
      setCurrentView("subfolders");
      setSelectedSubfolder(null);
      setBreadcrumb(["Music Library", selectedFolder.name]);
      setExpandedPreviews(new Set()); // Clear expanded previews
      setSearchQuery(""); // Clear search when navigating away from files
    }
  };

  const getFilteredData = () => {
    switch (currentView) {
      case "folders":
        return folders;
      case "subfolders":
        return subfolders.filter(
          (subfolder) => subfolder.parent_folder_id === selectedFolder?.id
        );
      case "files":
        return files.filter((file) =>
          file.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      default:
        return [];
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "document-text";
      case "audio":
        return "musical-notes";
      case "video":
        return "videocam";
      default:
        return "document";
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case "pdf":
        return "#F44336";
      case "audio":
        return "#4CAF50";
      case "video":
        return "#2196F3";
      default:
        return "#9E9E9E";
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

  const handleViewFile = (file: FileItem) => {
    if (file.url) {
      // For better file handling, open in system default app
      Linking.openURL(file.url).catch((err) => {
        console.error("Failed to open file:", err);
        // Fallback to fullscreen preview
        if (file.type === "pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          setFullScreenPdf({ url: file.url!, name: file.name });
        }
      });
    } else {
      // For non-PDF files, open externally
      if (file.url) {
        Linking.openURL(file.url).catch((err) => {
          console.error("Error opening file:", err);
        });
      }
    }
  };

  const renderBreadcrumb = () => (
    <View style={styles.breadcrumbContainer}>
      {breadcrumb.map((item, index) => (
        <View key={index} style={styles.breadcrumbItem}>
          <TouchableOpacity
            onPress={() => navigateToBreadcrumb(index)}
            disabled={index === breadcrumb.length - 1}
          >
            <Text
              style={[
                styles.breadcrumbText,
                index === breadcrumb.length - 1 && styles.breadcrumbTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
          {index < breadcrumb.length - 1 && (
            <Ionicons
              name="chevron-forward"
              size={16}
              color="rgba(255,255,255,0.5)"
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderFolderCard = (folder: Folder) => (
    <TouchableOpacity
      key={folder.id}
      style={styles.folderCard}
      onPress={() => navigateToFolder(folder)}
    >
      <View style={styles.folderHeader}>
        <View style={styles.folderIcon}>
          <Ionicons name="folder" size={32} color="#FF9800" />
        </View>

        <View style={styles.folderInfo}>
          <Text style={styles.folderName}>{folder.name}</Text>
          <Text style={styles.folderDescription}>{folder.description}</Text>
          <Text style={styles.folderDetails}>
            {folder.subfolder_count || 0} subfolders • Created{" "}
            {formatDate(folder.created_at)}
          </Text>
        </View>

        <View style={styles.folderStats}>
          <Text style={styles.fileCount}>{folder.subfolder_count || 0}</Text>
          <Text style={styles.fileCountLabel}>Subfolders</Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="rgba(255,255,255,0.6)"
            style={{ marginTop: 4 }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSubfolderCard = (subfolder: Subfolder) => (
    <TouchableOpacity
      key={subfolder.id}
      style={styles.itemCard}
      onPress={() => navigateToSubfolder(subfolder)}
    >
      <View style={styles.itemIcon}>
        <Ionicons name="folder-open" size={32} color="#2196F3" />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{subfolder.name}</Text>
        <Text style={styles.itemSubtitle}>
          {subfolder.files?.length || 0} file
          {subfolder.files?.length !== 1 ? "s" : ""}
        </Text>
        {subfolder.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {subfolder.description}
          </Text>
        )}
        <Text style={styles.itemDate}>
          Created {formatDate(subfolder.created_at)}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color="rgba(255,255,255,0.6)"
      />
    </TouchableOpacity>
  );

  const renderFileCard = (file: FileItem) => {
    const isPdf =
      file.type === "pdf" || file.name.toLowerCase().endsWith(".pdf");

    return (
      <View key={file.id} style={styles.fileCard}>
        <View style={styles.fileHeader}>
          <View
            style={[
              styles.fileIcon,
              { backgroundColor: getFileColor(file.type || "document") },
            ]}
          >
            <Ionicons
              name={getFileIcon(file.type || "document") as any}
              size={24}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{file.name}</Text>
            <Text style={styles.fileDetails}>
              {formatFileSize(file.size)} • {(file as any).folderName} •{" "}
              {formatDate(file.uploadedAt)}
            </Text>
            <Text style={styles.uploadedBy}>Uploaded by {file.uploadedBy}</Text>
          </View>

          <View style={styles.fileActions}>
            {/* Preview/View Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (isPdf) {
                  togglePreview(file.id);
                } else {
                  handleViewFile(file);
                }
              }}
            >
              <Ionicons
                name={
                  isPdf && expandedPreviews.has(file.id) ? "eye-off" : "eye"
                }
                size={18}
                color="#2196F3"
              />
            </TouchableOpacity>
            
            {/* Fullscreen Button for PDFs */}
            {isPdf && (
              <TouchableOpacity
                style={[styles.actionButton, { marginLeft: 8 }]}
                onPress={() => setFullScreenPdf({ url: file.url!, name: file.name })}
              >
                <Ionicons
                  name="expand"
                  size={18}
                  color="#4CAF50"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Togglable PDF Preview */}
        {isPdf && file.url && expandedPreviews.has(file.id) && (
          <View style={styles.pdfPreviewContainer}>
            <View style={styles.pdfPreviewHeader}>
              <Text style={styles.pdfPreviewTitle}>PDF Preview</Text>
              <TouchableOpacity
                style={styles.pdfFullscreenButton}
                onPress={() =>
                  setFullScreenPdf({ url: file.url!, name: file.name })
                }
              >
                <Ionicons name="expand" size={16} color="#FFFFFF" />
                <Text style={styles.pdfFullscreenText}>Full Screen</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pdfPreviewWrapper}>
              <WebView
                source={{
                  uri: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(file.url)}`,
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
                  // Fallback to direct URL if PDF.js fails
                }}
                onLoadEnd={() => {
                  console.log("PDF loaded successfully with PDF.js");
                }}
                scrollEnabled={true}
                scalesPageToFit={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mixedContentMode="compatibility"
                originWhitelist={['*']}
                userAgent="Mozilla/5.0 (compatible; PDF Viewer)"
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c463a" />
        <Text style={styles.loadingText}>Loading music library...</Text>
      </View>
    );
  }

  const filteredData = getFilteredData();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {currentView !== "folders" && (
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Music Library</Text>
          <Text style={styles.headerSubtitle}>
            Browse and access sheet music files
          </Text>
        </View>
      </View>

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Search Bar - Only show for files */}
      {currentView === "files" && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search files..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentView === "folders" && (
          <Text style={styles.sectionTitle}>
            Folders ({filteredData.length})
          </Text>
        )}

        {filteredData.length > 0 ? (
          <View style={styles.itemsList}>
            {currentView === "folders" &&
              (filteredData as Folder[]).map(renderFolderCard)}
            {currentView === "subfolders" &&
              (filteredData as Subfolder[]).map(renderSubfolderCard)}
            {currentView === "files" &&
              (filteredData as FileItem[]).map(renderFileCard)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name={
                currentView === "folders"
                  ? "folder-outline"
                  : currentView === "subfolders"
                  ? "folder-open-outline"
                  : "document-outline"
              }
              size={64}
              color="rgba(255,255,255,0.3)"
            />
            <Text style={styles.emptyStateTitle}>No {currentView} found</Text>
            <Text style={styles.emptyStateText}>
              No {currentView} available
            </Text>
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
                style={styles.pdfFullscreenButton}
                onPress={() => setFullScreenPdf(null)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <WebView
              source={{
                uri: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fullScreenPdf.url)}`,
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
              onError={(error) => {
                console.error("PDF fullscreen error:", error);
                // Could fallback to direct URL or Google Docs viewer
              }}
              onLoadEnd={() => {
                console.log("Fullscreen PDF loaded successfully with PDF.js");
              }}
              scrollEnabled={true}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mixedContentMode="compatibility"
              originWhitelist={['*']}
              userAgent="Mozilla/5.0 (compatible; PDF Viewer)"
            />
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
  // Statistics Styles
  statisticsContainer: {
    marginBottom: 24,
  },
  statisticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  // Folder Card Styles
  folderCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  folderHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  folderIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,152,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  folderDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  folderDetails: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  folderStats: {
    alignItems: "center",
  },
  fileCount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF9800",
  },
  fileCountLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  // File Card Styles
  fileCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 2,
  },
  uploadedBy: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontStyle: "italic",
  },
  fileActions: {
    flexDirection: "row",
  },
  actionButtonActive: {
    backgroundColor: "rgba(255,152,0,0.2)",
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(28,70,58,0.8)",
  },
  pdfPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pdfFullscreenButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
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
  // Full Screen Modal Styles
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
    marginTop: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  fullScreenWebView: {
    flex: 1,
  },
  fullScreenLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  fullScreenLoadingText: {
    color: "#1c463a",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
    marginTop: -8,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  breadcrumbText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    marginRight: 6,
  },
  breadcrumbTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  // Search Styles
  searchContainer: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
    marginLeft: 8,
  },
  content: {
    flex: 1,
    marginTop: 8,
    paddingTop: 16,
  },
  itemsList: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    marginTop: 12,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 8,
    marginBottom: 4,
    marginHorizontal: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    fontWeight: "500",
  },
  statsFooter: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
});
