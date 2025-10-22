import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Modal,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../../../supabase";

const { width } = Dimensions.get("window");

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
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

interface FileManagementScreenProps {
  onBack: () => void;
}

type ViewType = "folders" | "subfolders" | "files" | "folder-files";

function FileManagementScreen({ onBack }: FileManagementScreenProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [subfolders, setSubfolders] = useState<Subfolder[]>([]);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentView, setCurrentView] = useState<ViewType>("folders");
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedSubfolder, setSelectedSubfolder] = useState<Subfolder | null>(
    null
  );
  const [breadcrumb, setBreadcrumb] = useState<string[]>(["Folders"]);
  const [statistics, setStatistics] = useState({
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    pdfFiles: 0,
    videoFiles: 0,
    otherFiles: 0,
  });
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [showCreateSubfolderModal, setShowCreateSubfolderModal] =
    useState(false);
  const [showEditSubfolderModal, setShowEditSubfolderModal] = useState(false);
  const [editingSubfolder, setEditingSubfolder] = useState<Subfolder | null>(
    null
  );
  const [newSubfolderName, setNewSubfolderName] = useState("");
  const [newSubfolderDescription, setNewSubfolderDescription] = useState("");
  const [showUploadLocationModal, setShowUploadLocationModal] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<any[]>([]);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [parentFolderId, setParentFolderId] = useState<number | null>(null);

  useEffect(() => {
    loadFileData();
  }, []);

  const loadFileData = async () => {
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

      // Extract all files from folders and subfolders
      let extractedFiles: FileItem[] = [];

      foldersData.forEach((folder) => {
        if (folder.files && Array.isArray(folder.files)) {
          folder.files.forEach((file: FileItem) => {
            extractedFiles.push({
              ...file,
              folderName: folder.name,
              source: "folder",
            } as FileItem);
          });
        }
      });

      subfoldersData.forEach((subfolder) => {
        if (subfolder.files && Array.isArray(subfolder.files)) {
          subfolder.files.forEach((file: FileItem) => {
            extractedFiles.push({
              ...file,
              folderName: subfolder.name,
              source: "subfolder",
            } as FileItem);
          });
        }
      });

      setAllFiles(extractedFiles);
      updateStatistics(extractedFiles, foldersData, subfoldersData);
    } catch (error) {
      console.error("Error loading file data:", error);
    } finally {
      setLoading(false);
      updateStatistics(allFiles, folders, subfolders);
    }
  };

  const updateStatistics = (
    files: FileItem[],
    folders: Folder[],
    subfolders: Subfolder[]
  ) => {
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const pdfFiles = files.filter((file) => file.type?.includes("pdf")).length;
    const videoFiles = files.filter((file) =>
      file.type?.includes("video")
    ).length;
    const otherFiles = files.length - pdfFiles - videoFiles;

    setStatistics({
      totalFiles: files.length,
      totalFolders: folders.length + subfolders.length,
      totalSize,
      pdfFiles,
      videoFiles,
      otherFiles,
    });
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

  // Function to create a new subfolder
  const handleCreateSubfolder = async () => {
    if (!newSubfolderName.trim() || !selectedFolder) {
      Alert.alert("Error", "Please enter a subfolder name.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("subfolders")
        .insert({
          name: newSubfolderName.trim(),
          description: newSubfolderDescription.trim() || null,
          parent_folder_id: selectedFolder.id,
          files: [],
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setSubfolders((prev) => [...prev, data]);

      // Update folder's subfolder count
      setFolders((prev) =>
        prev.map((f) =>
          f.id === selectedFolder.id
            ? { ...f, subfolder_count: (f.subfolder_count || 0) + 1 }
            : f
        )
      );

      // Reset form and close modal
      setNewSubfolderName("");
      setNewSubfolderDescription("");
      setShowCreateSubfolderModal(false);

      Alert.alert(
        "Success",
        `Subfolder "${newSubfolderName}" created successfully.`
      );
    } catch (error) {
      console.error("Error creating subfolder:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Error", `Failed to create subfolder: ${errorMessage}`);
    }
  };

  // Function to handle edit folder
  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderDescription(folder.description || "");
    setShowEditFolderModal(true);
  };

  // Function to save edited folder
  const handleSaveEditedFolder = async () => {
    if (!newFolderName.trim() || !editingFolder) {
      Alert.alert("Error", "Please enter a folder name.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("folders")
        .update({
          name: newFolderName.trim(),
          description: newFolderDescription.trim() || null,
        })
        .eq("id", editingFolder.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setFolders((prev) =>
        prev.map((f) =>
          f.id === editingFolder.id
            ? { ...f, name: data.name, description: data.description }
            : f
        )
      );

      // Update selected folder if it's the one being edited
      if (selectedFolder?.id === editingFolder.id) {
        setSelectedFolder((prev) =>
          prev
            ? { ...prev, name: data.name, description: data.description }
            : null
        );
      }

      // Reset form and close modal
      setNewFolderName("");
      setNewFolderDescription("");
      setEditingFolder(null);
      setShowEditFolderModal(false);

      Alert.alert("Success", `Folder "${data.name}" updated successfully.`);
    } catch (error) {
      console.error("Error updating folder:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Error", `Failed to update folder: ${errorMessage}`);
    }
  };

  // Function to delete folder
  const handleDeleteFolder = (folder: Folder) => {
    Alert.alert(
      "Delete Folder",
      `Are you sure you want to delete "${folder.name}"? This will also delete all subfolders and files within it.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("folders")
                .delete()
                .eq("id", folder.id);

              if (error) {
                throw error;
              }

              // Update local state
              setFolders((prev) => prev.filter((f) => f.id !== folder.id));

              // If we're currently viewing this folder, navigate back
              if (selectedFolder?.id === folder.id) {
                setCurrentView("folders");
                setSelectedFolder(null);
                setBreadcrumb(["Folders"]);
              }

              Alert.alert(
                "Success",
                `Folder "${folder.name}" deleted successfully.`
              );
            } catch (error) {
              console.error("Error deleting folder:", error);
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
              Alert.alert("Error", `Failed to delete folder: ${errorMessage}`);
            }
          },
        },
      ]
    );
  };

  // Function to delete subfolder
  const handleDeleteSubfolder = (subfolder: Subfolder) => {
    Alert.alert(
      "Delete Subfolder",
      `Are you sure you want to delete "${subfolder.name}"? This will also delete all files within it.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("subfolders")
                .delete()
                .eq("id", subfolder.id);

              if (error) {
                throw error;
              }

              // Update local state
              setSubfolders((prev) =>
                prev.filter((sf) => sf.id !== subfolder.id)
              );

              // Update folder's subfolder count
              if (selectedFolder) {
                setFolders((prev) =>
                  prev.map((f) =>
                    f.id === selectedFolder.id
                      ? {
                          ...f,
                          subfolder_count: Math.max(
                            0,
                            (f.subfolder_count || 1) - 1
                          ),
                        }
                      : f
                  )
                );
              }

              Alert.alert(
                "Success",
                `Subfolder "${subfolder.name}" deleted successfully.`
              );
            } catch (error) {
              console.error("Error deleting subfolder:", error);
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
              Alert.alert(
                "Error",
                `Failed to delete subfolder: ${errorMessage}`
              );
            }
          },
        },
      ]
    );
  };

  // Function to handle edit subfolder
  const handleEditSubfolder = (subfolder: Subfolder) => {
    setEditingSubfolder(subfolder);
    setNewSubfolderName(subfolder.name);
    setNewSubfolderDescription(subfolder.description || "");
    setShowEditSubfolderModal(true);
  };

  // Function to save edited subfolder
  const handleSaveEditedSubfolder = async () => {
    if (!newSubfolderName.trim() || !editingSubfolder) {
      Alert.alert("Error", "Please enter a subfolder name.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("subfolders")
        .update({
          name: newSubfolderName.trim(),
          description: newSubfolderDescription.trim() || null,
        })
        .eq("id", editingSubfolder.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setSubfolders((prev) =>
        prev.map((sf) =>
          sf.id === editingSubfolder.id
            ? { ...sf, name: data.name, description: data.description }
            : sf
        )
      );

      // Update selected subfolder if it's the one being edited
      if (selectedSubfolder?.id === editingSubfolder.id) {
        setSelectedSubfolder((prev) =>
          prev
            ? { ...prev, name: data.name, description: data.description }
            : null
        );
      }

      // Reset form and close modal
      setNewSubfolderName("");
      setNewSubfolderDescription("");
      setEditingSubfolder(null);
      setShowEditSubfolderModal(false);

      Alert.alert("Success", `Subfolder "${data.name}" updated successfully.`);
    } catch (error) {
      console.error("Error updating subfolder:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Error", `Failed to update subfolder: ${errorMessage}`);
    }
  };

  // Helper function to upload files to a specific subfolder
  const handleUploadToSpecificSubfolder = async (
    files: any[],
    targetSubfolder: Subfolder
  ) => {
    try {
      const uploadedFiles: FileItem[] = [];

      for (const file of files) {
        try {
          setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

          // Generate file identifiers
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substr(2, 11);
          const fileName = `${timestamp}-${randomString}`;

          setUploadProgress((prev) => ({ ...prev, [file.name]: 50 }));

          // Create file path: instructor-files/{subfolder_id}/{timestamp}-{random}
          const filePath = `instructor-files/${targetSubfolder.id}/${fileName}`;

          // For React Native, we need to use the file URI directly
          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("instructor-files").upload(
              filePath,
              {
                uri: file.uri,
                type: file.mimeType || "application/octet-stream",
                name: file.name,
              } as any,
              {
                contentType: file.mimeType || "application/octet-stream",
                upsert: false,
              }
            );

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("instructor-files")
            .getPublicUrl(filePath);

          // Create file object
          const newFile: FileItem = {
            id: `${timestamp}${Math.random()}`,
            url: urlData.publicUrl,
            name: file.name,
            size: file.size || 0,
            type: file.mimeType || "application/octet-stream",
            uploadedAt: new Date().toISOString(),
            uploadedBy: "Admin",
          };

          // Update the subfolder's files array
          const updatedFiles = [...(targetSubfolder.files || []), newFile];

          const { error: updateError } = await supabase
            .from("subfolders")
            .update({ files: updatedFiles })
            .eq("id", targetSubfolder.id);

          if (updateError) {
            throw updateError;
          }

          // Update local state
          setSubfolders((prev) =>
            prev.map((sf) =>
              sf.id === targetSubfolder.id ? { ...sf, files: updatedFiles } : sf
            )
          );

          uploadedFiles.push(newFile);
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          Alert.alert(
            "Upload Error",
            `Failed to upload ${file.name}: ${errorMessage}`
          );
        }
      }

      setUploading(false);
      setUploadProgress({});

      if (uploadedFiles.length > 0) {
        Alert.alert(
          "Upload Complete",
          `Successfully uploaded ${uploadedFiles.length} file(s) to ${targetSubfolder.name}.`
        );

        // Refresh data
        await loadFileData();
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
      setUploadProgress({});
      Alert.alert("Error", "Failed to upload files. Please try again.");
    }
  };

  // Function to upload files to a specific folder
  const handleUploadToFolder = async (files: any[], targetFolder: Folder) => {
    try {
      const uploadedFiles: FileItem[] = [];

      for (const file of files) {
        try {
          setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

          // Generate file identifiers
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substr(2, 11);
          const fileName = `${timestamp}-${randomString}`;

          setUploadProgress((prev) => ({ ...prev, [file.name]: 50 }));

          // Create file path: instructor-files/folder-{folder_id}/{timestamp}-{random}
          const filePath = `instructor-files/folder-${targetFolder.id}/${fileName}`;

          // For React Native, we need to use the file URI directly
          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("instructor-files").upload(
              filePath,
              {
                uri: file.uri,
                type: file.mimeType || "application/octet-stream",
                name: file.name,
              } as any,
              {
                contentType: file.mimeType || "application/octet-stream",
                upsert: false,
              }
            );

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("instructor-files")
            .getPublicUrl(filePath);

          // Create file object
          const newFile: FileItem = {
            id: `${timestamp}${Math.random()}`,
            url: urlData.publicUrl,
            name: file.name,
            size: file.size || 0,
            type: file.mimeType || "application/octet-stream",
            uploadedAt: new Date().toISOString(),
            uploadedBy: "Admin",
          };

          // Update the folder's files array
          const updatedFiles = [...(targetFolder.files || []), newFile];

          const { error: updateError } = await supabase
            .from("folders")
            .update({ files: updatedFiles })
            .eq("id", targetFolder.id);

          if (updateError) {
            throw updateError;
          }

          // Update local state
          setFolders((prev) =>
            prev.map((f) =>
              f.id === targetFolder.id ? { ...f, files: updatedFiles } : f
            )
          );

          uploadedFiles.push(newFile);
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          Alert.alert(
            "Upload Error",
            `Failed to upload ${file.name}: ${errorMessage}`
          );
        }
      }

      setUploading(false);
      setUploadProgress({});

      if (uploadedFiles.length > 0) {
        Alert.alert(
          "Upload Complete",
          `Successfully uploaded ${uploadedFiles.length} file(s) to ${targetFolder.name}.`
        );

        // Refresh data
        await loadFileData();
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
      setUploadProgress({});
      Alert.alert("Error", "Failed to upload files. Please try again.");
    }
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) {
        return;
      }

      setUploading(true);
      const uploadedFiles: FileItem[] = [];

      // Handle folder uploads - show custom modal for folder selection
      if (currentView === "folders") {
        setPendingUploadFiles(result.assets);
        setShowUploadLocationModal(true);
        return;
      }

      // Handle multiple subfolder selection for subfolders view
      if (currentView === "subfolders" && selectedFolder) {
        const availableSubfolders = subfolders.filter(
          (sf) => sf.parent_folder_id === selectedFolder.id
        );

        if (availableSubfolders.length > 1) {
          // Show custom modal for subfolder selection
          setPendingUploadFiles(result.assets);
          setShowUploadLocationModal(true);
          return;
        }
      }

      for (const file of result.assets) {
        try {
          setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

          // Generate file identifiers
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substr(2, 11);
          const fileName = `${timestamp}-${randomString}`;

          setUploadProgress((prev) => ({ ...prev, [file.name]: 30 }));

          // Determine target subfolder for upload
          let targetSubfolder: Subfolder | null = null;

          if (currentView === "files" && selectedSubfolder) {
            targetSubfolder = selectedSubfolder;
          } else if (currentView === "subfolders" && selectedFolder) {
            const availableSubfolders = subfolders.filter(
              (sf) => sf.parent_folder_id === selectedFolder.id
            );
            if (availableSubfolders.length === 1) {
              targetSubfolder = availableSubfolders[0];
            } else if (availableSubfolders.length > 1) {
              // For multiple subfolders, we'll handle this after the loop
              continue;
            }
          }

          if (!targetSubfolder) {
            throw new Error("No target subfolder selected");
          }

          // Create file path: instructor-files/{subfolder_id}/{timestamp}-{random}
          const filePath = `instructor-files/${targetSubfolder.id}/${fileName}`;

          setUploadProgress((prev) => ({ ...prev, [file.name]: 50 }));

          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("instructor-files").upload(
              filePath,
              {
                uri: file.uri,
                type: file.mimeType || "application/octet-stream",
                name: file.name,
              } as any,
              {
                contentType: file.mimeType || "application/octet-stream",
                upsert: false,
              }
            );

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("instructor-files")
            .getPublicUrl(filePath);

          setUploadProgress((prev) => ({ ...prev, [file.name]: 80 }));

          // Create file object matching the exact format from your examples
          const newFile: FileItem = {
            id: `${timestamp}${Math.random()}`, // Format: "17561516272120.7318065246125589"
            url: urlData.publicUrl,
            name: file.name,
            size: file.size || 0,
            type: file.mimeType || "application/octet-stream",
            uploadedAt: new Date().toISOString(),
            uploadedBy: "Admin",
          };

          // Update the subfolder's files array in the database
          const updatedFiles = [...(targetSubfolder.files || []), newFile];

          const { error: updateError } = await supabase
            .from("subfolders")
            .update({ files: updatedFiles })
            .eq("id", targetSubfolder.id);

          if (updateError) {
            throw updateError;
          }

          // Update local state
          if (
            currentView === "files" &&
            selectedSubfolder &&
            selectedSubfolder.id === targetSubfolder.id
          ) {
            setSelectedSubfolder((prev) =>
              prev ? { ...prev, files: updatedFiles } : null
            );
          }

          setSubfolders((prev) =>
            prev.map((sf) =>
              sf.id === targetSubfolder.id ? { ...sf, files: updatedFiles } : sf
            )
          );

          uploadedFiles.push(newFile);
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          Alert.alert(
            "Upload Error",
            `Failed to upload ${file.name}: ${errorMessage}`
          );
        }
      }

      setUploading(false);
      setUploadProgress({});

      if (uploadedFiles.length > 0) {
        Alert.alert(
          "Upload Complete",
          `Successfully uploaded ${uploadedFiles.length} file(s).`
        );

        // Refresh data
        await loadFileData();
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
      setUploadProgress({});
      Alert.alert("Error", "Failed to upload files. Please try again.");
    }
  };

  const handleViewFile = (file: FileItem) => {
    if (file.url) {
      if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      ) {
        // Open PDF in app using Linking for now (will be enhanced with WebView later)
        Alert.alert("Open PDF", `Open ${file.name} in PDF viewer?`, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open",
            onPress: () => {
              Linking.openURL(file.url).catch((err) => {
                console.error("Error opening PDF:", err);
                Alert.alert("Error", "Could not open PDF file");
              });
            },
          },
        ]);
      } else {
        // For non-PDF files, open externally
        Alert.alert("Open File", `Open ${file.name} in external app?`, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open",
            onPress: () => {
              Linking.openURL(file.url).catch((err) => {
                console.error("Error opening file:", err);
                Alert.alert("Error", "Could not open file");
              });
            },
          },
        ]);
      }
    } else {
      Alert.alert("Error", "File URL not available");
    }
  };

  const handleDownloadFile = (file: FileItem) => {
    Alert.alert("Download File", `Download ${file.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Download",
        onPress: () => {
          Linking.openURL(file.url);
        },
      },
    ]);
  };

  const handleRenameFile = (file: FileItem) => {
    Alert.prompt(
      "Rename File",
      "Enter new file name:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Rename",
          onPress: async (newName?: string) => {
            if (newName && newName.trim() && selectedSubfolder) {
              try {
                const updatedFiles =
                  selectedSubfolder.files?.map((f) =>
                    f.id === file.id ? { ...f, name: newName.trim() } : f
                  ) || [];

                const { error } = await supabase
                  .from("subfolders")
                  .update({ files: updatedFiles })
                  .eq("id", selectedSubfolder.id);

                if (error) throw error;

                setSelectedSubfolder({
                  ...selectedSubfolder,
                  files: updatedFiles,
                });

                loadFileData();
                Alert.alert("Success", "File renamed successfully!");
              } catch (error) {
                console.error("Error renaming file:", error);
                Alert.alert("Error", "Failed to rename file");
              }
            }
          },
        },
      ],
      "plain-text",
      file.name
    );
  };

  const handleDeleteFile = (file: FileItem) => {
    Alert.alert(
      "Delete File",
      `Are you sure you want to delete "${file.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (selectedSubfolder) {
                // Delete from subfolder
                const updatedFiles =
                  selectedSubfolder.files?.filter((f) => f.id !== file.id) ||
                  [];

                const { error } = await supabase
                  .from("subfolders")
                  .update({ files: updatedFiles })
                  .eq("id", selectedSubfolder.id);

                if (error) throw error;

                setSelectedSubfolder({
                  ...selectedSubfolder,
                  files: updatedFiles,
                });

                loadFileData();
                Alert.alert("Success", `${file.name} deleted successfully!`);
              } else if (selectedFolder && currentView === "folder-files") {
                // Delete from folder
                const updatedFiles =
                  selectedFolder.files?.filter((f) => f.id !== file.id) || [];

                const { error } = await supabase
                  .from("folders")
                  .update({ files: updatedFiles })
                  .eq("id", selectedFolder.id);

                if (error) throw error;

                setSelectedFolder({
                  ...selectedFolder,
                  files: updatedFiles,
                });

                loadFileData();
                Alert.alert("Success", `${file.name} deleted successfully!`);
              } else {
                Alert.alert(
                  "Error",
                  "Unable to determine file location for deletion"
                );
              }
            } catch (error) {
              console.error("Error deleting file:", error);
              Alert.alert("Error", "Failed to delete file");
            }
          },
        },
      ]
    );
  };

  const handleCreateFolderInFolder = (parentFolder: Folder) => {
    setParentFolderId(parentFolder.id);
    setNewFolderName("");
    setNewFolderDescription("");
    setShowCreateFolderModal(true);
  };

  const createNestedFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert("Error", "Please enter a folder name");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("folders")
        .insert({
          name: newFolderName.trim(),
          description: newFolderDescription.trim(),
          files: [],
          subfolder_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      setShowCreateFolderModal(false);
      setNewFolderName("");
      setNewFolderDescription("");
      setParentFolderId(null);
      loadFileData();
      Alert.alert("Success", "Folder created successfully!");
    } catch (error) {
      console.error("Error creating folder:", error);
      Alert.alert("Error", "Failed to create folder");
    }
  };

  const handleRenameFolder = (folder: Folder) => {
    Alert.prompt(
      "Rename Folder",
      "Enter new folder name:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Rename",
          onPress: async (newName?: string) => {
            if (newName && newName.trim()) {
              try {
                const { error } = await supabase
                  .from("folders")
                  .update({ name: newName.trim() })
                  .eq("id", folder.id);

                if (error) throw error;
                loadFileData();
                Alert.alert("Success", "Folder renamed successfully!");
              } catch (error) {
                console.error("Error renaming folder:", error);
                Alert.alert("Error", "Failed to rename folder");
              }
            }
          },
        },
      ],
      "plain-text",
      folder.name
    );
  };

  // Navigation functions
  const navigateToFolder = (folder: Folder) => {
    setSelectedFolder(folder);
    setCurrentView("subfolders");
    setBreadcrumb(["Folders", folder.name]);
  };

  const navigateToSubfolder = (subfolder: Subfolder) => {
    setSelectedSubfolder(subfolder);
    setCurrentView("files");
    setBreadcrumb(["Folders", selectedFolder?.name || "", subfolder.name]);
  };

  const navigateToFolderFiles = (folder: Folder) => {
    setSelectedFolder(folder);
    setCurrentView("folder-files");
    setBreadcrumb(["Folders", folder.name, "Files"]);
  };

  const navigateBack = () => {
    if (currentView === "files") {
      setCurrentView("subfolders");
      setSelectedSubfolder(null);
      setBreadcrumb(["Folders", selectedFolder?.name || ""]);
    } else if (currentView === "folder-files") {
      setCurrentView("folders");
      setSelectedFolder(null);
      setBreadcrumb(["Folders"]);
    } else if (currentView === "subfolders") {
      setCurrentView("folders");
      setSelectedFolder(null);
      setBreadcrumb(["Folders"]);
    }
  };

  const navigateToRoot = () => {
    setCurrentView("folders");
    setSelectedFolder(null);
    setSelectedSubfolder(null);
    setBreadcrumb(["Folders"]);
  };

  // Filtered data based on current view
  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();

    switch (currentView) {
      case "folders":
        return folders.filter((folder) =>
          folder.name.toLowerCase().includes(query)
        );

      case "subfolders":
        return subfolders.filter(
          (subfolder) =>
            subfolder.parent_folder_id === selectedFolder?.id &&
            subfolder.name.toLowerCase().includes(query)
        );

      case "files":
        return (
          selectedSubfolder?.files?.filter((file) =>
            file.name.toLowerCase().includes(query)
          ) || []
        );

      case "folder-files":
        return (
          selectedFolder?.files?.filter((file) =>
            file.name.toLowerCase().includes(query)
          ) || []
        );

      default:
        return [];
    }
  };

  const filteredData = getFilteredData();
  // Generate PDF viewer URL with fallbacks - prioritize PDF.js like instructor/student screens
  const getPdfViewerUrl = (fileUrl: string, attempt: number = 0): string => {
    const encodedUrl = encodeURIComponent(fileUrl);

    // Multiple fallback strategies - prioritize PDF.js viewer for consistency
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
      const updatedLoading = new Set(loadingPreviews);
      updatedLoading.delete(fileId);
      setLoadingPreviews(updatedLoading);
    }, 500);
  };

  const renderFileCard = (file: FileItem) => {
    const isExpanded = expandedFiles.has(file.id);
    const isPdf =
      file.type === "pdf" || file.name.toLowerCase().endsWith(".pdf");

    return (
      <View key={file.id} style={styles.modernFileCard}>
        {/* Main Content Area */}
        <View style={styles.fileCardMainContent}>
          <View style={styles.fileCardHeader}>
            {/* Icon and Title Section */}
            <View style={styles.fileIconSection}>
              <View
                style={[
                  styles.modernFileIcon,
                  { backgroundColor: getFileColor(file.type) + "20" },
                  { borderColor: getFileColor(file.type) + "40" },
                ]}
              >
                <Ionicons
                  name={getFileIcon(file.type) as any}
                  size={24}
                  color={getFileColor(file.type)}
                />
              </View>
              <View style={styles.fileTitleSection}>
                <Text style={styles.modernFileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.modernFileDetails}>
                  {formatFileSize(file.size)} •{" "}
                  {(file as any).folderName || "Unknown"}
                </Text>
              </View>
            </View>

            {/* File Type Badge */}
            <View
              style={[
                styles.fileTypeBadge,
                { backgroundColor: getFileColor(file.type) + "20" },
                { borderColor: getFileColor(file.type) + "40" },
              ]}
            >
              <Text
                style={[
                  styles.fileTypeBadgeText,
                  { color: getFileColor(file.type) },
                ]}
              >
                {file.type?.toUpperCase() ||
                  file.name.split(".").pop()?.toUpperCase() ||
                  "FILE"}
              </Text>
            </View>
          </View>

          {/* Footer with Upload Info */}
          <View style={styles.fileCardFooter}>
            <Text style={styles.fileUploadInfo}>
              Uploaded by {file.uploadedBy} • {formatDate(file.uploadedAt)}
            </Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.fileActionButtons}>
          {isPdf && (
            <TouchableOpacity
              style={[styles.actionButton, styles.previewActionButton]}
              onPress={() => toggleFilePreview(file.id)}
            >
              <Ionicons
                name={isExpanded ? "eye-off" : "eye"}
                size={16}
                color="#2196F3"
              />
              <Text style={styles.actionButtonText}>
                {isExpanded ? "Hide" : "Preview"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.viewActionButton]}
            onPress={() => setFullScreenPdf({ url: file.url, name: file.name })}
          >
            <Ionicons name="expand" size={16} color="#4CAF50" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteActionButton]}
            onPress={() => handleDeleteFile(file)}
          >
            <Ionicons name="trash" size={16} color="#F44336" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Inline PDF Preview */}
        {isPdf && isExpanded && file.url && (
          <View style={styles.pdfPreviewContainer}>
            <View style={styles.pdfPreviewHeader}>
              <Text style={styles.pdfPreviewTitle}>PDF Preview</Text>
              <View style={styles.pdfPreviewActions}>
                {pdfErrors.has(file.id) &&
                  (retryAttempts.get(file.id) || 0) < 3 && (
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => retryPdfLoad(file.id, file.url)}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
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

            {pdfErrors.has(file.id) &&
            (retryAttempts.get(file.id) || 0) >= 3 ? (
              <View style={styles.pdfErrorContainer}>
                <Ionicons
                  name="document-text"
                  size={48}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.pdfErrorText}>PDF preview unavailable</Text>
                <Text style={styles.pdfErrorSubtext}>
                  Tap "Full Screen" to view directly
                </Text>
              </View>
            ) : (
              <WebView
                key={`${file.id}-${retryAttempts.get(file.id) || 0}`}
                source={{
                  uri: getPdfViewerUrl(
                    file.url,
                    retryAttempts.get(file.id) || 0
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
                bounces={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                cacheEnabled={true}
                allowsBackForwardNavigationGestures={false}
                allowsLinkPreview={false}
                onShouldStartLoadWithRequest={(request) => {
                  // Prevent downloads by blocking certain URLs
                  if (
                    request.url.includes("download") ||
                    request.url.includes("attachment")
                  ) {
                    return false;
                  }
                  return true;
                }}
                onNavigationStateChange={(navState) => {
                  // Prevent navigation away from the PDF viewer
                  if (
                    navState.url !==
                    getPdfViewerUrl(file.url, retryAttempts.get(file.id) || 0)
                  ) {
                    return false;
                  }
                }}
                renderLoading={() => (
                  <View style={styles.pdfPreviewLoading}>
                    <ActivityIndicator size="small" color="#1c463a" />
                    <Text style={styles.pdfPreviewLoadingText}>
                      Loading PDF...{" "}
                      {retryAttempts.get(file.id)
                        ? `(Attempt ${(retryAttempts.get(file.id) || 0) + 1})`
                        : ""}
                    </Text>
                  </View>
                )}
                onLoadStart={() => {
                  // Clear any previous errors when starting to load
                  const newErrors = new Set(pdfErrors);
                  newErrors.delete(file.id);
                  setPdfErrors(newErrors);
                }}
                onLoadEnd={() => {
                  // Successfully loaded
                  const newErrors = new Set(pdfErrors);
                  newErrors.delete(file.id);
                  setPdfErrors(newErrors);
                }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn("WebView error: ", nativeEvent);

                  // Add to error state
                  const newErrors = new Set(pdfErrors);
                  newErrors.add(file.id);
                  setPdfErrors(newErrors);

                  // Auto-retry with different strategy
                  setTimeout(() => {
                    retryPdfLoad(file.id, file.url);
                  }, 1000);
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn("HTTP error: ", nativeEvent);

                  // Add to error state
                  const newErrors = new Set(pdfErrors);
                  newErrors.add(file.id);
                  setPdfErrors(newErrors);

                  // Auto-retry with different strategy
                  setTimeout(() => {
                    retryPdfLoad(file.id, file.url);
                  }, 1000);
                }}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  const renderFolderCard = (folder: Folder) => (
    <View key={folder.id} style={styles.modernFolderCard}>
      {/* Main Content Area */}
      <TouchableOpacity
        style={styles.folderCardMainContent}
        onPress={() => navigateToFolder(folder)}
        activeOpacity={0.7}
      >
        <View style={styles.folderCardHeader}>
          {/* Icon and Title Section */}
          <View style={styles.folderIconSection}>
            <View style={styles.modernFolderIcon}>
              <Ionicons name="folder" size={28} color="#FF9800" />
            </View>
            <View style={styles.folderTitleSection}>
              <Text style={styles.modernFolderName} numberOfLines={1}>
                {folder.name}
              </Text>
              {folder.description && (
                <Text style={styles.modernFolderDescription} numberOfLines={2}>
                  {folder.description}
                </Text>
              )}
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.folderStatsSection}>
            <View style={styles.statItem}>
              <Text style={styles.folderStatNumber}>
                {folder.files?.length || 0}
              </Text>
              <Text style={styles.folderStatLabel}>Files</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.folderStatNumber}>
                {folder.subfolder_count || 0}
              </Text>
              <Text style={styles.folderStatLabel}>Folders</Text>
            </View>
          </View>
        </View>

        {/* Footer with Date */}
        <View style={styles.folderCardFooter}>
          <Text style={styles.folderDate}>
            Created {formatDate(folder.created_at)}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,255,255,0.4)"
          />
        </View>
      </TouchableOpacity>

      {/* Action Buttons Row */}
      <View style={styles.folderActionButtons}>
        {/* View Files Button */}
        {(folder.files?.length || 0) > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.viewFilesActionButton]}
            onPress={() => navigateToFolderFiles(folder)}
          >
            <Ionicons name="document-text" size={18} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Files</Text>
          </TouchableOpacity>
        )}

        {/* Edit Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.editActionButton]}
          onPress={() => handleEditFolder(folder)}
        >
          <Ionicons name="create" size={18} color="#FF9800" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteActionButton]}
          onPress={() => handleDeleteFolder(folder)}
        >
          <Ionicons name="trash" size={18} color="#F44336" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSubfolderCard = (subfolder: Subfolder) => (
    <View key={subfolder.id} style={styles.modernSubfolderCard}>
      {/* Main Content Area */}
      <TouchableOpacity
        style={styles.subfolderCardMainContent}
        onPress={() => navigateToSubfolder(subfolder)}
        activeOpacity={0.7}
      >
        <View style={styles.subfolderCardHeader}>
          {/* Icon and Title Section */}
          <View style={styles.subfolderIconSection}>
            <View style={styles.modernSubfolderIcon}>
              <Ionicons name="folder-open" size={26} color="#2196F3" />
            </View>
            <View style={styles.subfolderTitleSection}>
              <Text style={styles.modernSubfolderName} numberOfLines={1}>
                {subfolder.name}
              </Text>
              {subfolder.description && (
                <Text
                  style={styles.modernSubfolderDescription}
                  numberOfLines={2}
                >
                  {subfolder.description}
                </Text>
              )}
            </View>
          </View>

          {/* Files Count */}
          <View style={styles.subfolderStatsSection}>
            <View style={styles.subfolderStatItem}>
              <Text style={styles.subfolderStatNumber}>
                {subfolder.files?.length || 0}
              </Text>
              <Text style={styles.subfolderStatLabel}>Files</Text>
            </View>
          </View>
        </View>

        {/* Footer with Date */}
        <View style={styles.subfolderCardFooter}>
          <Text style={styles.subfolderDate}>
            Created {formatDate(subfolder.created_at)}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,255,255,0.4)"
          />
        </View>
      </TouchableOpacity>

      {/* Action Buttons Row */}
      <View style={styles.subfolderActionButtons}>
        {/* Edit Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.editActionButton]}
          onPress={() => handleEditSubfolder(subfolder)}
        >
          <Ionicons name="create" size={18} color="#FF9800" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteActionButton]}
          onPress={() => handleDeleteSubfolder(subfolder)}
        >
          <Ionicons name="trash" size={18} color="#F44336" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c463a" />
        <Text style={styles.loadingText}>Loading files...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar - Only show in files view */}
      {(currentView === "files" || currentView === "folder-files") && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search files..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Breadcrumb Navigation */}
      <View style={styles.breadcrumbContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.breadcrumbContent}>
            {breadcrumb.map((item, index) => (
              <View key={index} style={styles.breadcrumbItem}>
                {index > 0 && (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="rgba(255,255,255,0.4)"
                    style={styles.breadcrumbSeparator}
                  />
                )}
                <TouchableOpacity
                  onPress={() => {
                    if (index === 0) navigateToRoot();
                    else if (index === 1 && currentView !== "folders")
                      navigateBack();
                  }}
                  disabled={index === breadcrumb.length - 1}
                >
                  <Text
                    style={[
                      styles.breadcrumbText,
                      index === breadcrumb.length - 1 &&
                        styles.breadcrumbTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.navigationActions}>
          {currentView !== "folders" && (
            <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {/* Create Folder Icon - Show only in folders view */}
          {currentView === "folders" && (
            <TouchableOpacity
              style={styles.headerCreateFolderIcon}
              onPress={() => {
                setParentFolderId(null);
                setNewFolderName("");
                setNewFolderDescription("");
                setShowCreateFolderModal(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Upload Button - Show in all views */}
          {(currentView === "folders" ||
            currentView === "subfolders" ||
            currentView === "files") && (
            <TouchableOpacity
              style={[
                styles.uploadButton,
                uploading && styles.uploadButtonDisabled,
              ]}
              onPress={handleUploadFile}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Upload Files</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {currentView === "folders" && (
          <>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Folders List */}
              <Text style={styles.sectionTitle}>
                Folders ({filteredData.length})
              </Text>

              {filteredData.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="folder-outline"
                    size={64}
                    color="rgba(255,255,255,0.3)"
                  />
                  <Text style={styles.emptyText}>No folders found</Text>
                </View>
              ) : (
                (filteredData as Folder[]).map(renderFolderCard)
              )}
            </ScrollView>
          </>
        )}

        {currentView === "subfolders" && (
          <>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { flex: 1, flexShrink: 1 }]}
                numberOfLines={2}
              >
                Subfolders in "{selectedFolder?.name}" ({filteredData.length})
              </Text>
              <TouchableOpacity
                style={styles.createSubfolderButton}
                onPress={() => setShowCreateSubfolderModal(true)}
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.createSubfolderButtonText}>Create</Text>
              </TouchableOpacity>
            </View>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <View style={styles.uploadProgressContainer}>
                <Text style={styles.uploadProgressTitle}>
                  Uploading Files...
                </Text>
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <View key={fileName} style={styles.uploadProgressItem}>
                    <Text style={styles.uploadProgressFileName}>
                      {fileName}
                    </Text>
                    <View style={styles.uploadProgressBar}>
                      <View
                        style={[
                          styles.uploadProgressFill,
                          { width: `${progress}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.uploadProgressText}>{progress}%</Text>
                  </View>
                ))}
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredData.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="folder-open-outline"
                    size={64}
                    color="rgba(255,255,255,0.3)"
                  />
                  <Text style={styles.emptyText}>No subfolders found</Text>
                </View>
              ) : (
                (filteredData as Subfolder[]).map(renderSubfolderCard)
              )}
            </ScrollView>
          </>
        )}

        {currentView === "folder-files" && (
          <>
            <Text style={styles.sectionTitle}>
              Files in "{selectedFolder?.name}" ({filteredData.length})
            </Text>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <View style={styles.uploadProgressContainer}>
                <Text style={styles.uploadProgressTitle}>
                  Uploading Files...
                </Text>
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <View key={fileName} style={styles.uploadProgressItem}>
                    <Text style={styles.uploadProgressFileName}>
                      {fileName}
                    </Text>
                    <View style={styles.uploadProgressBar}>
                      <View
                        style={[
                          styles.uploadProgressFill,
                          { width: `${progress}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.uploadProgressText}>{progress}%</Text>
                  </View>
                ))}
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredData.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="document"
                    size={64}
                    color="rgba(255,255,255,0.3)"
                  />
                  <Text style={styles.emptyText}>No files found</Text>
                </View>
              ) : (
                (filteredData as FileItem[]).map(renderFileCard)
              )}
            </ScrollView>
          </>
        )}

        {currentView === "files" && (
          <>
            <Text style={styles.sectionTitle}>
              Files in "{selectedSubfolder?.name}" ({filteredData.length})
            </Text>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <View style={styles.uploadProgressContainer}>
                <Text style={styles.uploadProgressTitle}>
                  Uploading Files...
                </Text>
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <View key={fileName} style={styles.uploadProgressItem}>
                    <Text style={styles.uploadProgressFileName}>
                      {fileName}
                    </Text>
                    <View style={styles.uploadProgressBar}>
                      <View
                        style={[
                          styles.uploadProgressFill,
                          { width: `${progress}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.uploadProgressText}>{progress}%</Text>
                  </View>
                ))}
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredData.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="document-outline"
                    size={64}
                    color="rgba(255,255,255,0.3)"
                  />
                  <Text style={styles.emptyText}>No files found</Text>
                </View>
              ) : (
                (filteredData as FileItem[]).map(renderFileCard)
              )}
            </ScrollView>
          </>
        )}
      </View>

      {/* Fullscreen PDF Modal */}
      <Modal
        visible={fullScreenPdf !== null}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.fullScreenContainer}>
          <View style={styles.fullScreenHeader}>
            <Text style={styles.fullScreenTitle}>{fullScreenPdf?.name}</Text>
            <TouchableOpacity
              style={styles.fullScreenCloseButton}
              onPress={() => setFullScreenPdf(null)}
            >
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
              bounces={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              cacheEnabled={true}
              renderLoading={() => (
                <View style={styles.fullScreenLoading}>
                  <ActivityIndicator size="large" color="#1c463a" />
                  <Text style={styles.fullScreenLoadingText}>
                    Loading PDF...{" "}
                    {retryAttempts.get("fullscreen")
                      ? `(Attempt ${
                          (retryAttempts.get("fullscreen") || 0) + 1
                        })`
                      : ""}
                  </Text>
                </View>
              )}
              onLoadStart={() => {}}
              onLoadEnd={() => {}}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn("Fullscreen WebView error: ", nativeEvent);

                // Auto-retry with different strategy for fullscreen
                setTimeout(() => {
                  retryPdfLoad("fullscreen", fullScreenPdf.url);
                }, 1000);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn("Fullscreen HTTP error: ", nativeEvent);

                // Auto-retry with different strategy for fullscreen
                setTimeout(() => {
                  retryPdfLoad("fullscreen", fullScreenPdf.url);
                }, 1000);
              }}
            />
          )}
        </View>
      </Modal>

      {/* Create Subfolder Modal */}
      <Modal
        visible={showCreateSubfolderModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.createSubfolderModalContainer}>
          <View style={styles.createSubfolderModalHeader}>
            <Text style={styles.createSubfolderModalTitle}>
              Create New Subfolder
            </Text>
            <TouchableOpacity
              style={styles.createSubfolderModalCloseButton}
              onPress={() => {
                setShowCreateSubfolderModal(false);
                setNewSubfolderName("");
                setNewSubfolderDescription("");
              }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.createSubfolderModalContent}>
            <Text style={styles.createSubfolderModalLabel}>
              Subfolder Name *
            </Text>
            <TextInput
              style={styles.createSubfolderModalInput}
              placeholder="Enter subfolder name..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newSubfolderName}
              onChangeText={setNewSubfolderName}
              maxLength={50}
            />

            <Text style={styles.createSubfolderModalLabel}>
              Description (Optional)
            </Text>
            <TextInput
              style={[
                styles.createSubfolderModalInput,
                styles.createSubfolderModalTextArea,
              ]}
              placeholder="Enter description..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newSubfolderDescription}
              onChangeText={setNewSubfolderDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.createSubfolderModalButtons}>
              <TouchableOpacity
                style={styles.createSubfolderModalCancelButton}
                onPress={() => {
                  setShowCreateSubfolderModal(false);
                  setNewSubfolderName("");
                  setNewSubfolderDescription("");
                }}
              >
                <Text style={styles.createSubfolderModalCancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createSubfolderModalCreateButton,
                  !newSubfolderName.trim() &&
                    styles.createSubfolderModalCreateButtonDisabled,
                ]}
                onPress={handleCreateSubfolder}
                disabled={!newSubfolderName.trim()}
              >
                <Text style={styles.createSubfolderModalCreateText}>
                  Create Subfolder
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Subfolder Modal */}
      <Modal
        visible={showEditSubfolderModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.createSubfolderModalContainer}>
          <View style={styles.createSubfolderModalHeader}>
            <Text style={styles.createSubfolderModalTitle}>Edit Subfolder</Text>
            <TouchableOpacity
              style={styles.createSubfolderModalCloseButton}
              onPress={() => {
                setShowEditSubfolderModal(false);
                setNewSubfolderName("");
                setNewSubfolderDescription("");
                setEditingSubfolder(null);
              }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.createSubfolderModalContent}>
            <Text style={styles.createSubfolderModalLabel}>
              Subfolder Name *
            </Text>
            <TextInput
              style={styles.createSubfolderModalInput}
              placeholder="Enter subfolder name..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newSubfolderName}
              onChangeText={setNewSubfolderName}
              maxLength={50}
            />

            <Text style={styles.createSubfolderModalLabel}>
              Description (Optional)
            </Text>
            <TextInput
              style={[
                styles.createSubfolderModalInput,
                styles.createSubfolderModalTextArea,
              ]}
              placeholder="Enter description..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newSubfolderDescription}
              onChangeText={setNewSubfolderDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.createSubfolderModalButtons}>
              <TouchableOpacity
                style={styles.createSubfolderModalCancelButton}
                onPress={() => {
                  setShowEditSubfolderModal(false);
                  setNewSubfolderName("");
                  setNewSubfolderDescription("");
                  setEditingSubfolder(null);
                }}
              >
                <Text style={styles.createSubfolderModalCancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createSubfolderModalCreateButton,
                  !newSubfolderName.trim() &&
                    styles.createSubfolderModalCreateButtonDisabled,
                ]}
                onPress={handleSaveEditedSubfolder}
                disabled={!newSubfolderName.trim()}
              >
                <Text style={styles.createSubfolderModalCreateText}>
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Folder Modal */}
      <Modal
        visible={showEditFolderModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.createSubfolderModalContainer}>
          <View style={styles.createSubfolderModalHeader}>
            <Text style={styles.createSubfolderModalTitle}>Edit Folder</Text>
            <TouchableOpacity
              style={styles.createSubfolderModalCloseButton}
              onPress={() => {
                setShowEditFolderModal(false);
                setNewFolderName("");
                setNewFolderDescription("");
                setEditingFolder(null);
              }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.createSubfolderModalContent}>
            <Text style={styles.createSubfolderModalLabel}>Folder Name *</Text>
            <TextInput
              style={styles.createSubfolderModalInput}
              placeholder="Enter folder name..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newFolderName}
              onChangeText={setNewFolderName}
              maxLength={50}
            />

            <Text style={styles.createSubfolderModalLabel}>
              Description (Optional)
            </Text>
            <TextInput
              style={[
                styles.createSubfolderModalInput,
                styles.createSubfolderModalTextArea,
              ]}
              placeholder="Enter description..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newFolderDescription}
              onChangeText={setNewFolderDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.createSubfolderModalButtons}>
              <TouchableOpacity
                style={styles.createSubfolderModalCancelButton}
                onPress={() => {
                  setShowEditFolderModal(false);
                  setNewFolderName("");
                  setNewFolderDescription("");
                  setEditingFolder(null);
                }}
              >
                <Text style={styles.createSubfolderModalCancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createSubfolderModalCreateButton,
                  !newFolderName.trim() &&
                    styles.createSubfolderModalCreateButtonDisabled,
                ]}
                onPress={handleSaveEditedFolder}
                disabled={!newFolderName.trim()}
              >
                <Text style={styles.createSubfolderModalCreateText}>
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateFolderModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.createSubfolderModalContainer}>
          <View style={styles.createSubfolderModalHeader}>
            <Text style={styles.createSubfolderModalTitle}>
              Create New Folder
            </Text>
            <TouchableOpacity
              style={styles.createSubfolderModalCloseButton}
              onPress={() => {
                setShowCreateFolderModal(false);
                setNewFolderName("");
                setNewFolderDescription("");
                setParentFolderId(null);
              }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.createSubfolderModalContent}>
            <Text style={styles.createSubfolderModalLabel}>Folder Name *</Text>
            <TextInput
              style={styles.createSubfolderModalInput}
              placeholder="Enter folder name..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newFolderName}
              onChangeText={setNewFolderName}
              maxLength={50}
            />

            <Text style={styles.createSubfolderModalLabel}>
              Description (Optional)
            </Text>
            <TextInput
              style={[
                styles.createSubfolderModalInput,
                styles.createSubfolderModalTextArea,
              ]}
              placeholder="Enter description..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newFolderDescription}
              onChangeText={setNewFolderDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.createSubfolderModalButtons}>
              <TouchableOpacity
                style={styles.createSubfolderModalCancelButton}
                onPress={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName("");
                  setNewFolderDescription("");
                  setParentFolderId(null);
                }}
              >
                <Text style={styles.createSubfolderModalCancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createSubfolderModalCreateButton,
                  !newFolderName.trim() &&
                    styles.createSubfolderModalCreateButtonDisabled,
                ]}
                onPress={createNestedFolder}
                disabled={!newFolderName.trim()}
              >
                <Text style={styles.createSubfolderModalCreateText}>
                  Create Folder
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upload Location Selection Modal */}
      <Modal
        visible={showUploadLocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.uploadLocationModalContainer}>
          <View style={styles.uploadLocationModalHeader}>
            <Text style={styles.uploadLocationModalTitle}>
              {currentView === "folders" ? "Select Folder" : "Select Subfolder"}
            </Text>
            <TouchableOpacity
              style={styles.uploadLocationModalCloseButton}
              onPress={() => {
                setShowUploadLocationModal(false);
                setPendingUploadFiles([]);
                setUploading(false);
              }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.uploadLocationModalContent}>
            <Text style={styles.uploadLocationModalSubtitle}>
              Choose where to upload {pendingUploadFiles.length} file(s)
            </Text>

            <ScrollView
              style={styles.uploadLocationList}
              showsVerticalScrollIndicator={false}
            >
              {currentView === "folders" &&
                folders.map((folder) => (
                  <TouchableOpacity
                    key={folder.id}
                    style={styles.uploadLocationItem}
                    onPress={() => {
                      setShowUploadLocationModal(false);
                      handleUploadToFolder(pendingUploadFiles, folder);
                      setPendingUploadFiles([]);
                    }}
                  >
                    <View style={styles.uploadLocationIcon}>
                      <Ionicons name="folder" size={24} color="#4CAF50" />
                    </View>
                    <View style={styles.uploadLocationInfo}>
                      <Text style={styles.uploadLocationName}>
                        {folder.name}
                      </Text>
                      <Text style={styles.uploadLocationDetails}>
                        {folder.files?.length || 0} files •{" "}
                        {folder.subfolder_count || 0} subfolders
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="rgba(255,255,255,0.6)"
                    />
                  </TouchableOpacity>
                ))}

              {currentView === "subfolders" &&
                selectedFolder &&
                subfolders
                  .filter((sf) => sf.parent_folder_id === selectedFolder.id)
                  .map((subfolder) => (
                    <TouchableOpacity
                      key={subfolder.id}
                      style={styles.uploadLocationItem}
                      onPress={() => {
                        setShowUploadLocationModal(false);
                        handleUploadToSpecificSubfolder(
                          pendingUploadFiles,
                          subfolder
                        );
                        setPendingUploadFiles([]);
                      }}
                    >
                      <View style={styles.uploadLocationIcon}>
                        <Ionicons
                          name="folder-open"
                          size={24}
                          color="#2196F3"
                        />
                      </View>
                      <View style={styles.uploadLocationInfo}>
                        <Text style={styles.uploadLocationName}>
                          {subfolder.name}
                        </Text>
                        <Text style={styles.uploadLocationDetails}>
                          {subfolder.files?.length || 0} files • Created{" "}
                          {formatDate(subfolder.created_at)}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="rgba(255,255,255,0.6)"
                      />
                    </TouchableOpacity>
                  ))}
            </ScrollView>
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
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 17,
    marginLeft: 16,
    fontWeight: "500",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#1c463a",
    shadowColor: "#1c463a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginLeft: 8,
  },
  toggleTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  contentContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  fileCard: {
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
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  fileDetails: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  uploadedBy: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontStyle: "italic",
  },
  fileActions: {
    flexDirection: "row",
  },
  fileActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
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
    marginRight: 16,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  folderDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 18,
    fontWeight: "500",
    marginTop: 16,
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
  subfolderIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(33,150,243,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
  },
  breadcrumbContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  breadcrumbSeparator: {
    marginHorizontal: 8,
  },
  breadcrumbText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  breadcrumbTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c463a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  // PDF Preview Styles
  pdfPreviewContainer: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  pdfPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1c463a",
  },
  pdfPreviewActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pdfPreviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pdfFullscreenButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
  },
  pdfFullscreenText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pdfPreview: {
    height: 250,
    backgroundColor: "#FFFFFF",
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
    marginRight: 16,
  },
  fullScreenCloseButton: {
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
  // Retry and Error Styles
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FF9800",
    borderRadius: 4,
    marginRight: 8,
  },
  retryButtonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pdfErrorContainer: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  pdfErrorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    marginTop: 12,
    textAlign: "center",
  },
  pdfErrorSubtext: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
    textAlign: "center",
  },
  // Navigation Actions
  navigationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  // Header Create Folder Icon
  headerCreateFolderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(33, 150, 243, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.4)",
  },
  // Upload Button Styles
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: "rgba(76, 175, 80, 0.5)",
    shadowOpacity: 0.1,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Upload Progress Styles
  uploadProgressContainer: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  uploadProgressTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4CAF50",
    marginBottom: 12,
  },
  uploadProgressItem: {
    marginBottom: 8,
  },
  uploadProgressFileName: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 4,
    fontWeight: "500",
  },
  uploadProgressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  uploadProgressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },
  uploadProgressText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    textAlign: "right",
  },
  // Action Buttons Container
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  // Create Subfolder Button (Compact for header)
  createSubfolderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  createSubfolderButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  // Create Subfolder Modal Styles
  createSubfolderModalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  createSubfolderModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#1c463a",
  },
  createSubfolderModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  createSubfolderModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  createSubfolderModalContent: {
    flex: 1,
    padding: 20,
  },
  createSubfolderModalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    marginTop: 16,
  },
  createSubfolderModalInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  createSubfolderModalTextArea: {
    height: 80,
    textAlignVertical: "top",
  },
  createSubfolderModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    gap: 16,
  },
  createSubfolderModalCancelButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  createSubfolderModalCancelText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  createSubfolderModalCreateButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  createSubfolderModalCreateButtonDisabled: {
    backgroundColor: "rgba(33, 150, 243, 0.5)",
    shadowOpacity: 0.1,
  },
  createSubfolderModalCreateText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Section Header Styles
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 12, // Add gap to prevent overlap
  },
  // Folder Card Styles
  folderCardContent: {
    flex: 1,
  },
  // Subfolder Card Styles
  subfolderCardContent: {
    flex: 1,
  },
  // Folder Actions Container
  folderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subfolderEditButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 152, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 152, 0, 0.3)",
  },
  viewFilesButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  // Folder Edit and Delete Buttons
  folderEditButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 152, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 152, 0, 0.3)",
  },
  folderDeleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
  },
  // Subfolder Delete Button
  subfolderDeleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
  },
  // Modern Folder Card Styles
  modernFolderCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  folderCardMainContent: {
    padding: 20,
  },
  folderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  folderIconSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernFolderIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255, 152, 0, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 152, 0, 0.3)",
  },
  folderTitleSection: {
    flex: 1,
  },
  modernFolderName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  modernFolderDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
  },
  folderStatsSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    marginLeft: 16,
  },
  statItem: {
    alignItems: "center",
    minWidth: 40,
  },
  folderStatNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  folderStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 12,
  },
  folderCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  folderDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  folderActionButtons: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  viewFilesActionButton: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  createFolderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(33, 150, 243, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.3)",
  },
  editActionButton: {
    backgroundColor: "rgba(255, 152, 0, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 152, 0, 0.3)",
  },
  deleteActionButton: {
    backgroundColor: "rgba(244, 67, 54, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Modern Subfolder Card Styles
  modernSubfolderCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  subfolderCardMainContent: {
    padding: 16,
  },
  subfolderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  subfolderIconSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernSubfolderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(33, 150, 243, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.3)",
  },
  subfolderTitleSection: {
    flex: 1,
  },
  modernSubfolderName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  modernSubfolderDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 18,
  },
  subfolderStatsSection: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 8,
    marginLeft: 12,
    minWidth: 50,
  },
  subfolderStatItem: {
    alignItems: "center",
  },
  subfolderStatNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 1,
  },
  subfolderStatLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subfolderCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  subfolderDate: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  subfolderActionButtons: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  // Modern File Card Styles
  modernFileCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  fileCardMainContent: {
    padding: 14,
  },
  fileCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  fileIconSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernFileIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  fileTitleSection: {
    flex: 1,
  },
  modernFileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  modernFileDetails: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 16,
  },
  fileTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  fileTypeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fileCardFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  fileUploadInfo: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  fileActionButtons: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  previewActionButton: {
    backgroundColor: "rgba(33, 150, 243, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.3)",
  },
  viewActionButton: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  // Upload Location Modal Styles
  uploadLocationModalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  uploadLocationModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#1c463a",
  },
  uploadLocationModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  uploadLocationModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadLocationModalContent: {
    flex: 1,
    padding: 20,
  },
  uploadLocationModalSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 20,
    textAlign: "center",
  },
  uploadLocationList: {
    flex: 1,
  },
  uploadLocationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  uploadLocationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  uploadLocationInfo: {
    flex: 1,
  },
  uploadLocationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  uploadLocationDetails: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
});

export { FileManagementScreen };
