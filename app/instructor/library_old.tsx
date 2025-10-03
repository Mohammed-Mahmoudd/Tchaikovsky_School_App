import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { supabase } from "../../supabase.js";

const { width } = Dimensions.get("window");

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  folderName?: string;
  source?: string;
}

interface Folder {
  id: number;
  name: string;
  description: string;
  files: FileItem[];
  created_at: string;
  subfolder_count: number;
}

interface Subfolder {
  id: number;
  name: string;
  description: string;
  files: FileItem[];
  parent_folder_id: number;
  created_at: string;
}

export default function LibraryScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [subfolders, setSubfolders] = useState<Subfolder[]>([]);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentView, setCurrentView] = useState<"folders" | "subfolders" | "files">("folders");
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedSubfolder, setSelectedSubfolder] = useState<Subfolder | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<string[]>(["Library"]);
  const [fullScreenPdf, setFullScreenPdf] = useState<{url: string, name: string} | null>(null);

  useEffect(() => {
    loadLibraryData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchQuery, currentView, folders, subfolders, allFiles, selectedFolder, selectedSubfolder]);

  const loadLibraryData = async () => {
    try {
      setLoading(true);

      // Load folders and subfolders in parallel
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

      if (foldersResult.error) throw foldersResult.error;
      if (subfoldersResult.error) throw subfoldersResult.error;

      const foldersData = foldersResult.data || [];
      const subfoldersData = subfoldersResult.data || [];

      setFolders(foldersData);
      setSubfolders(subfoldersData);

      // Extract all files from subfolders
      let extractedFiles: FileItem[] = [];
      subfoldersData.forEach((subfolder) => {
        if (subfolder.files && Array.isArray(subfolder.files)) {
          subfolder.files.forEach((file: FileItem) => {
            extractedFiles.push({
              ...file,
              folderName: subfolder.name,
              source: "subfolder",
            });
          });
        }
      });

      setAllFiles(extractedFiles);
    } catch (error) {
      console.error("Error loading library data:", error);
      Alert.alert("Error", "Failed to load library data");
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    const query = searchQuery.toLowerCase();

    switch (currentView) {
      case "folders":
        const filteredFolders = folders.filter((folder) =>
          folder.name.toLowerCase().includes(query)
        );
        setFilteredData(filteredFolders);
        break;

      case "subfolders":
        const filteredSubfolders = subfolders.filter(
          (subfolder) =>
            subfolder.parent_folder_id === selectedFolder?.id &&
            subfolder.name.toLowerCase().includes(query)
        );
        setFilteredData(filteredSubfolders);
        break;

      case "files":
        const files = selectedSubfolder?.files || [];
        const filteredFiles = files.filter((file) =>
          file.name.toLowerCase().includes(query)
        );
        setFilteredData(filteredFiles);
        break;

      default:
        setFilteredData([]);
    }
  };

  const navigateToFolder = (folder: Folder) => {
    setSelectedFolder(folder);
    setCurrentView("subfolders");
    setBreadcrumb(["Library", folder.name]);
  };

  const navigateToSubfolder = (subfolder: Subfolder) => {
    setSelectedSubfolder(subfolder);
    setCurrentView("files");
    setBreadcrumb(["Library", selectedFolder?.name || "", subfolder.name]);
  };

  const navigateBack = () => {
    if (currentView === "files") {
      setCurrentView("subfolders");
      setSelectedSubfolder(null);
      setBreadcrumb(["Library", selectedFolder?.name || ""]);
    } else if (currentView === "subfolders") {
      setCurrentView("folders");
      setSelectedFolder(null);
      setBreadcrumb(["Library"]);
    }
  };

  const navigateToRoot = () => {
    setCurrentView("folders");
    setSelectedFolder(null);
    setSelectedSubfolder(null);
    setBreadcrumb(["Library"]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "application/pdf":
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
      case "application/pdf":
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

  const handleViewFile = (file: FileItem) => {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setFullScreenPdf({ url: file.url, name: file.name });
    } else {
      if (file.url) {
        Linking.openURL(file.url).catch((err) => {
          console.error("Error opening file:", err);
          Alert.alert("Error", "Could not open file");
        });
      } else {
        Alert.alert("Error", "File URL not available");
      }
    }
  };

  const handleDownloadFile = (file: FileItem) => {
    Alert.alert(
      "Download File",
      `Download ${file.name} (${formatFileSize(file.size)})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download",
          onPress: async () => {
            try {
              if (file.url) {
                await Linking.openURL(file.url);
                Alert.alert("Success", `${file.name} download started!`);
              } else {
                Alert.alert("Error", "File URL not available");
              }
            } catch (error) {
              console.error("Download error:", error);
              Alert.alert("Error", "Failed to download file");
            }
          },
        },
      ]
    );
  };

  const closeFullScreenPdf = () => {
    setFullScreenPdf(null);
  };

  const renderBreadcrumb = () => (
    <View style={styles.breadcrumbContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.breadcrumb}>
          {breadcrumb.map((item, index) => (
            <View key={index} style={styles.breadcrumbItem}>
              {index > 0 && (
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="rgba(255,255,255,0.6)"
                  style={styles.breadcrumbSeparator}
                />
              )}
              <TouchableOpacity
                onPress={() => {
                  if (index === 0) navigateToRoot();
                  else if (index === 1 && currentView === "files") navigateBack();
                }}
              >
                <Text
                  style={[
                    styles.breadcrumbText,
                    index === breadcrumb.length - 1 && styles.breadcrumbActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      {currentView !== "folders" && (
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
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
            {folder.subfolder_count || 0} subfolders • Created {formatDate(folder.created_at)}
          </Text>
        </View>
        <View style={styles.folderStats}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="rgba(255,255,255,0.6)"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSubfolderCard = (subfolder: Subfolder) => (
    <TouchableOpacity
      key={subfolder.id}
      style={styles.subfolderCard}
      onPress={() => navigateToSubfolder(subfolder)}
    >
      <View style={styles.folderHeader}>
        <View style={styles.subfolderIcon}>
          <Ionicons name="folder-open" size={28} color="#2196F3" />
        </View>
        <View style={styles.folderInfo}>
          <Text style={styles.folderName}>{subfolder.name}</Text>
          <Text style={styles.folderDescription}>{subfolder.description}</Text>
          <Text style={styles.folderDetails}>
            {subfolder.files?.length || 0} files • Created {formatDate(subfolder.created_at)}
          </Text>
        </View>
        <View style={styles.folderStats}>
          <Text style={styles.fileCount}>{subfolder.files?.length || 0}</Text>
          <Text style={styles.fileCountLabel}>Files</Text>
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

  const renderFileCard = (file: FileItem) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    return (
      <View key={file.id} style={styles.fileCard}>
        <View style={styles.fileHeader}>
          <View
            style={[
              styles.fileIcon,
              { backgroundColor: getFileColor(file.type) },
            ]}
          >
            <Ionicons
              name={getFileIcon(file.type) as any}
              size={24}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{file.name}</Text>
            <Text style={styles.fileDetails}>
              {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
            </Text>
            <Text style={styles.fileUploader}>Uploaded by {file.uploadedBy}</Text>
          </View>

          <View style={styles.fileActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleViewFile(file)}
            >
              <Ionicons
                name={isPdf ? "expand" : "eye"}
                size={18}
                color="#2196F3"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDownloadFile(file)}
            >
              <Ionicons name="download" size={18} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Breadcrumb Navigation */}
        {renderBreadcrumb()}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${currentView}...`}
              placeholderTextColor="rgba(255,255,255,0.6)"
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

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Loading library...</Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>
              {currentView === "folders"
                ? `Folders (${filteredData.length})`
                : currentView === "subfolders"
                ? `Subfolders (${filteredData.length})`
                : `Files (${filteredData.length})`}
            </Text>

            {filteredData.length === 0 ? (
              <View style={styles.emptyContainer}>
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
                <Text style={styles.emptyTitle}>
                  No {currentView.slice(0, -1)} found
                </Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : `No ${currentView} available`}
                </Text>
              </View>
            ) : (
              <>
                {currentView === "folders" &&
                  (filteredData as Folder[]).map(renderFolderCard)}
                {currentView === "subfolders" &&
                  (filteredData as Subfolder[]).map(renderSubfolderCard)}
                {currentView === "files" &&
                  (filteredData as FileItem[]).map(renderFileCard)}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Full Screen PDF Modal */}
      <Modal
        visible={fullScreenPdf !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeFullScreenPdf}
      >
        <View style={styles.fullScreenContainer}>
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              style={styles.fullScreenCloseButton}
              onPress={closeFullScreenPdf}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.fullScreenTitle} numberOfLines={1}>
              {fullScreenPdf?.name || "PDF Viewer"}
            </Text>
            <TouchableOpacity
              style={styles.fullScreenDownloadButton}
              onPress={() => {
                if (fullScreenPdf?.url) {
                  Linking.openURL(fullScreenPdf.url).catch((err) => {
                    console.error("Download error:", err);
                    Alert.alert("Error", "Failed to download file");
                  });
                }
              }}
            >
              <Ionicons name="download" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {fullScreenPdf && (
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
                  <ActivityIndicator size="large" color="#2E7D32" />
                  <Text style={styles.fullScreenLoadingText}>Loading PDF...</Text>
                </View>
              )}
              onError={(error) => {
                console.error("Full screen PDF error:", error);
                Alert.alert("Error", "Failed to load PDF");
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
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
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  breadcrumbSeparator: {
    marginHorizontal: 8,
  },
  breadcrumbText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  breadcrumbActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: "#FFFFFF",
    marginLeft: 12,
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
  contentContainer: {
    marginBottom: 40,
  },
  folderCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  subfolderCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
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
    marginRight: 16,
  },
  subfolderIcon: {
    marginRight: 16,
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
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  folderDetails: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  folderStats: {
    alignItems: "center",
  },
  fileCount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  fileCountLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  fileCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
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
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 2,
  },
  fileUploader: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  fileActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  fullScreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#2E7D32",
  },
  fullScreenCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginHorizontal: 16,
  },
  fullScreenDownloadButton: {
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
  fullScreenLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  fullScreenLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#2E7D32",
    fontWeight: "500",
  },
});
