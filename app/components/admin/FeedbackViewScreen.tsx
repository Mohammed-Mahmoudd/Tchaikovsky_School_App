import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../supabase";

interface Feedback {
  id: number;
  student_id: number;
  instructor_id: number;
  comment: string;
  homework_rating: number;
  created_at: string;
  sheet: string;
  HW_comments: string;
  session_type: string;
  session_number: number;
  session_number2: number;
  feedback: string;
  Online_Theory_Meet: string;
  Online_Practice_Meet: string;
  In_person_Location: string;
  sheet_files: any;
  student_name?: string;
  instructor_name?: string;
}

interface FeedbackViewScreenProps {
  onBack: () => void;
}

export function FeedbackViewScreen({ onBack }: FeedbackViewScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Feedback>>({});
  const [saving, setSaving] = useState(false);
  const [showSessionNumberModal, setShowSessionNumberModal] = useState(false);
  const [showSessionNumber2Modal, setShowSessionNumber2Modal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  // Session number options
  const sessionNumbers = Array.from({ length: 20 }, (_, i) => i + 1); // 1 to 20
  const sessionNumbers2 = [4, 8, 12, 20]; // Specific options for session number 2

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      setLoading(true);

      // First, get all feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (feedbackError) throw feedbackError;

      // Then get all students and instructors
      const [studentsResult, instructorsResult] = await Promise.all([
        supabase.from("students").select("id, name"),
        supabase.from("instructors").select("id, name"),
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (instructorsResult.error) throw instructorsResult.error;

      // Create lookup maps
      const studentsMap = new Map(
        studentsResult.data?.map((s) => [s.id, s.name]) || []
      );
      const instructorsMap = new Map(
        instructorsResult.data?.map((i) => [i.id, i.name]) || []
      );

      // Transform data to include student and instructor names
      const transformedData =
        feedbackData?.map((item) => ({
          ...item,
          student_name: studentsMap.get(item.student_id) || "Unknown Student",
          instructor_name:
            instructorsMap.get(item.instructor_id) || "Unknown Instructor",
        })) || [];

      setFeedbackList(transformedData);
    } catch (error) {
      console.error("Error loading feedback:", error);
      Alert.alert("Error", "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = async (feedbackId: number) => {
    Alert.alert(
      "Delete Feedback",
      "Are you sure you want to delete this feedback? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("feedback")
                .delete()
                .eq("id", feedbackId);

              if (error) throw error;

              Alert.alert("Success", "Feedback deleted successfully");
              loadFeedback(); // Refresh the list
            } catch (error) {
              console.error("Error deleting feedback:", error);
              Alert.alert("Error", "Failed to delete feedback");
            }
          },
        },
      ]
    );
  };

  const openEditModal = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setEditFormData({
      comment: feedback.comment || "",
      homework_rating: feedback.homework_rating || 0,
      sheet: feedback.sheet || "",
      HW_comments: feedback.HW_comments || "",
      session_type: feedback.session_type || "",
      session_number: feedback.session_number || 0,
      session_number2: feedback.session_number2 || 0,
      feedback: feedback.feedback || "",
      Online_Theory_Meet: feedback.Online_Theory_Meet || "",
      Online_Practice_Meet: feedback.Online_Practice_Meet || "",
      In_person_Location: feedback.In_person_Location || "",
    });
    setShowEditModal(true);
  };

  const handleSaveFeedback = async () => {
    if (!editingFeedback) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("feedback")
        .update(editFormData)
        .eq("id", editingFeedback.id);

      if (error) throw error;

      Alert.alert("Success", "Feedback updated successfully");
      setShowEditModal(false);
      setEditingFeedback(null);
      loadFeedback(); // Refresh the list
    } catch (error) {
      console.error("Error updating feedback:", error);
      Alert.alert("Error", "Failed to update feedback");
    } finally {
      setSaving(false);
    }
  };

  const renderRatingSelector = (
    currentRating: number,
    onRatingChange: (rating: number) => void
  ) => {
    return (
      <View style={styles.ratingSelector}>
        {Array.from({ length: 5 }, (_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onRatingChange(index + 1)}
            style={styles.starButton}
          >
            <Ionicons
              name={index < currentRating ? "star" : "star-outline"}
              size={24}
              color={
                index < currentRating ? "#FFD700" : "rgba(255,255,255,0.4)"
              }
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const selectSessionNumber = (number: number) => {
    setEditFormData({ ...editFormData, session_number: number });
    setShowSessionNumberModal(false);
  };

  const selectSessionNumber2 = (number: number) => {
    setEditFormData({ ...editFormData, session_number2: number });
    setShowSessionNumber2Modal(false);
  };

  const loadAvailableFiles = async () => {
    try {
      // Get files from folders and subfolders
      const [foldersResult, subfoldersResult] = await Promise.all([
        supabase.from("folders").select("*"),
        supabase.from("subfolders").select("*"),
      ]);

      if (foldersResult.error) throw foldersResult.error;
      if (subfoldersResult.error) throw subfoldersResult.error;

      let allFiles: any[] = [];

      // Extract files from folders
      foldersResult.data?.forEach((folder) => {
        if (folder.files && Array.isArray(folder.files)) {
          folder.files.forEach((file: any) => {
            allFiles.push({
              ...file,
              source: "folder",
              sourceName: folder.name,
              sourceId: folder.id,
            });
          });
        }
      });

      // Extract files from subfolders
      subfoldersResult.data?.forEach((subfolder) => {
        if (subfolder.files && Array.isArray(subfolder.files)) {
          subfolder.files.forEach((file: any) => {
            allFiles.push({
              ...file,
              source: "subfolder",
              sourceName: subfolder.name,
              sourceId: subfolder.id,
            });
          });
        }
      });

      setAvailableFiles(allFiles);
    } catch (error) {
      console.error("Error loading files:", error);
      Alert.alert("Error", "Failed to load files");
    }
  };

  const openFilesModal = () => {
    // Load current selected files from feedback
    const currentFiles = editingFeedback?.sheet_files || [];
    setSelectedFiles(Array.isArray(currentFiles) ? currentFiles : []);
    loadAvailableFiles();
    setShowFilesModal(true);
  };

  const toggleFileSelection = (file: any) => {
    const isSelected = selectedFiles.some((f) => f.id === file.id);
    if (isSelected) {
      setSelectedFiles(selectedFiles.filter((f) => f.id !== file.id));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  const saveSelectedFiles = () => {
    setEditFormData({ ...editFormData, sheet_files: selectedFiles });
    setShowFilesModal(false);
  };

  const filteredFeedback = feedbackList.filter((feedback) => {
    const matchesSearch =
      feedback.student_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      feedback.instructor_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      feedback.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.feedback?.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "high")
      return matchesSearch && feedback.homework_rating >= 4;
    if (selectedFilter === "low")
      return matchesSearch && feedback.homework_rating <= 2;

    return matchesSearch;
  });

  const renderRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={16}
        color={index < rating ? "#FFD700" : "rgba(255,255,255,0.3)"}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderFeedbackCard = (feedback: Feedback) => (
    <View key={feedback.id} style={styles.feedbackCard}>
      <View style={styles.feedbackHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{feedback.student_name}</Text>
          <Text style={styles.instructorName}>
            with {feedback.instructor_name}
          </Text>
          <Text style={styles.sessionDate}>
            {formatDate(feedback.created_at)}
          </Text>
          {feedback.session_type && (
            <Text style={styles.sessionType}>{feedback.session_type}</Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <View style={styles.ratingsContainer}>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Homework:</Text>
              <View style={styles.stars}>
                {renderRatingStars(feedback.homework_rating || 0)}
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditModal(feedback)}
            >
              <Ionicons name="create" size={18} color="#2196F3" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteFeedback(feedback.id)}
            >
              <Ionicons name="trash" size={18} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.feedbackContent}>
        {feedback.comment && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackSectionTitle}>General Comments</Text>
            <Text style={styles.feedbackText}>{feedback.comment}</Text>
          </View>
        )}

        {feedback.HW_comments && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackSectionTitle}>Homework Comments</Text>
            <Text style={styles.feedbackText}>{feedback.HW_comments}</Text>
          </View>
        )}

        {feedback.feedback && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackSectionTitle}>Additional Feedback</Text>
            <Text style={styles.feedbackText}>{feedback.feedback}</Text>
          </View>
        )}

        {(feedback.Online_Theory_Meet ||
          feedback.Online_Practice_Meet ||
          feedback.In_person_Location) && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackSectionTitle}>Session Details</Text>
            {feedback.Online_Theory_Meet && (
              <Text style={styles.sessionDetail}>
                Theory Meet: {feedback.Online_Theory_Meet}
              </Text>
            )}
            {feedback.Online_Practice_Meet && (
              <Text style={styles.sessionDetail}>
                Practice Meet: {feedback.Online_Practice_Meet}
              </Text>
            )}
            {feedback.In_person_Location && (
              <Text style={styles.sessionDetail}>
                Location: {feedback.In_person_Location}
              </Text>
            )}
          </View>
        )}

        {feedback.sheet && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackSectionTitle}>Sheet Music</Text>
            <Text style={styles.feedbackText}>{feedback.sheet}</Text>
          </View>
        )}

        {feedback.sheet_files && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackSectionTitle}>Session Files</Text>
            <View style={styles.fileItem}>
              <Ionicons name="document-text" size={16} color="#4CAF50" />
              <Text style={styles.fileName}>Sheet Files Available</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search feedback..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === "all" && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "all" && styles.filterTextActive,
            ]}
          >
            All Feedback
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === "high" && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter("high")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "high" && styles.filterTextActive,
            ]}
          >
            High Ratings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === "low" && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter("low")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "low" && styles.filterTextActive,
            ]}
          >
            Needs Attention
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feedback List */}
      <ScrollView
        style={styles.feedbackList}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1c463a" />
            <Text style={styles.loadingText}>Loading feedback...</Text>
          </View>
        ) : filteredFeedback.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubbles-outline"
              size={64}
              color="rgba(255,255,255,0.3)"
            />
            <Text style={styles.emptyText}>No feedback found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filter
            </Text>
          </View>
        ) : (
          filteredFeedback.map(renderFeedbackCard)
        )}
      </ScrollView>

      {/* Edit Feedback Modal */}
      {showEditModal && editingFeedback && (
        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Feedback</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.editStudentInfo}>
                Student: {editingFeedback.student_name} | Instructor:{" "}
                {editingFeedback.instructor_name}
              </Text>

              {/* General Comments Rating */}
              <Text style={styles.fieldLabel}>General Comments Rating</Text>
              {renderRatingSelector(
                editFormData.comment ? parseInt(editFormData.comment) || 0 : 0,
                (rating) =>
                  setEditFormData({
                    ...editFormData,
                    comment: rating.toString(),
                  })
              )}

              {/* Homework Rating */}
              <Text style={styles.fieldLabel}>Homework Rating</Text>
              {renderRatingSelector(
                editFormData.homework_rating || 0,
                (rating) =>
                  setEditFormData({ ...editFormData, homework_rating: rating })
              )}

              {/* Homework Comments */}
              <Text style={styles.fieldLabel}>Homework Comments</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter homework feedback..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={editFormData.HW_comments || ""}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, HW_comments: text })
                }
                multiline
                numberOfLines={3}
              />

              {/* Additional Feedback */}
              <Text style={styles.fieldLabel}>Additional Feedback</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter additional feedback..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={editFormData.feedback || ""}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, feedback: text })
                }
                multiline
                numberOfLines={3}
              />

              {/* Session Type */}
              <Text style={styles.fieldLabel}>Session Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Piano Lesson, Theory Class..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={editFormData.session_type || ""}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, session_type: text })
                }
              />

              {/* Session Numbers */}
              <View style={styles.rowContainer}>
                <View style={styles.halfWidth}>
                  <Text style={styles.fieldLabel}>Session Number</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowSessionNumberModal(true)}
                  >
                    <Text style={styles.pickerText}>
                      {editFormData.session_number || "Select Session Number"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color="rgba(255,255,255,0.6)"
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.fieldLabel}>Session Number 2</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowSessionNumber2Modal(true)}
                  >
                    <Text style={styles.pickerText}>
                      {editFormData.session_number2 ||
                        "Select Session Number 2"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color="rgba(255,255,255,0.6)"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Meeting Details */}
              <Text style={styles.fieldLabel}>Online Theory Meet</Text>
              <TextInput
                style={styles.input}
                placeholder="Meeting link or details..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={editFormData.Online_Theory_Meet || ""}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, Online_Theory_Meet: text })
                }
              />

              <Text style={styles.fieldLabel}>Online Practice Meet</Text>
              <TextInput
                style={styles.input}
                placeholder="Meeting link or details..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={editFormData.Online_Practice_Meet || ""}
                onChangeText={(text) =>
                  setEditFormData({
                    ...editFormData,
                    Online_Practice_Meet: text,
                  })
                }
              />

              <Text style={styles.fieldLabel}>In-Person Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Location details..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={editFormData.In_person_Location || ""}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, In_person_Location: text })
                }
              />

              {/* Sheet Files Selection */}
              <Text style={styles.fieldLabel}>Sheet Music Files</Text>
              <TouchableOpacity
                style={styles.filesButton}
                onPress={openFilesModal}
              >
                <View style={styles.filesButtonContent}>
                  <Ionicons name="musical-notes" size={20} color="#FFFFFF" />
                  <Text style={styles.filesButtonText}>
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} file(s) selected`
                      : "Select Sheet Music Files"}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>

              {/* Display Selected Files */}
              {selectedFiles.length > 0 && (
                <View style={styles.selectedFilesContainer}>
                  {selectedFiles.map((file, index) => (
                    <View
                      key={file.id || index}
                      style={styles.selectedFileItem}
                    >
                      <Ionicons
                        name={
                          file.type?.includes("pdf")
                            ? "document-text"
                            : "musical-notes"
                        }
                        size={16}
                        color="#4CAF50"
                      />
                      <Text style={styles.selectedFileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleFileSelection(file)}
                        style={styles.removeFileButton}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#F44336"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveFeedback}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Session Number Modal */}
      <Modal
        visible={showSessionNumberModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Session Number</Text>
            <TouchableOpacity onPress={() => setShowSessionNumberModal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {sessionNumbers.map((number) => (
              <TouchableOpacity
                key={number}
                style={styles.numberCard}
                onPress={() => selectSessionNumber(number)}
              >
                <Text style={styles.numberText}>Session {number}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Session Number 2 Modal */}
      <Modal
        visible={showSessionNumber2Modal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Session Number 2</Text>
            <TouchableOpacity onPress={() => setShowSessionNumber2Modal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {sessionNumbers2.map((number) => (
              <TouchableOpacity
                key={number}
                style={styles.numberCard}
                onPress={() => selectSessionNumber2(number)}
              >
                <Text style={styles.numberText}>Session {number}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Files Selection Modal */}
      <Modal
        visible={showFilesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Sheet Music Files</Text>
            <TouchableOpacity onPress={() => setShowFilesModal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.selectedCountText}>
              {selectedFiles.length} file(s) selected
            </Text>

            {availableFiles.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="folder-outline"
                  size={64}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.emptyText}>No files available</Text>
                <Text style={styles.emptySubtext}>
                  Upload files to folders first
                </Text>
              </View>
            ) : (
              availableFiles.map((file, index) => {
                const isSelected = selectedFiles.some((f) => f.id === file.id);
                return (
                  <TouchableOpacity
                    key={file.id || index}
                    style={[
                      styles.fileCard,
                      isSelected && styles.fileCardSelected,
                    ]}
                    onPress={() => toggleFileSelection(file)}
                  >
                    <View style={styles.fileInfo}>
                      <Ionicons
                        name={
                          file.type?.includes("pdf")
                            ? "document-text"
                            : "musical-notes"
                        }
                        size={24}
                        color={isSelected ? "#4CAF50" : "#FFFFFF"}
                      />
                      <View style={styles.fileDetails}>
                        <Text
                          style={[
                            styles.fileCardName,
                            isSelected && styles.fileNameSelected,
                          ]}
                        >
                          {file.name}
                        </Text>
                        <Text style={styles.fileSource}>
                          From: {file.sourceName} ({file.source})
                        </Text>
                        {file.size && (
                          <Text style={styles.fileSize}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.selectionIndicator}>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#4CAF50"
                        />
                      ) : (
                        <Ionicons
                          name="radio-button-off"
                          size={24}
                          color="rgba(255,255,255,0.4)"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {selectedFiles.length > 0 && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={saveSelectedFiles}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>
                  Confirm Selection ({selectedFiles.length} files)
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
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
  filterContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButtonActive: {
    backgroundColor: "rgba(28,70,58,0.6)",
    borderColor: "rgba(28,70,58,0.8)",
    shadowColor: "#1c463a",
    shadowOpacity: 0.3,
  },
  filterText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  feedbackList: {
    flex: 1,
  },
  feedbackCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  instructorName: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
    fontWeight: "600",
  },
  sessionDate: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  ratingsContainer: {
    alignItems: "flex-end",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginRight: 8,
    minWidth: 60,
  },
  stars: {
    flexDirection: "row",
  },
  feedbackContent: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 16,
  },
  feedbackSection: {
    marginBottom: 16,
  },
  feedbackSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  fileName: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 8,
  },
  downloadButton: {
    padding: 4,
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
  emptySubtext: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  sessionType: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 4,
  },
  actionsContainer: {
    alignItems: "flex-end",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: "rgba(33, 150, 243, 0.2)",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.3)",
  },
  deleteButton: {
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
  },
  sessionDetail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#1c463a",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
  ratingSelector: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "flex-start",
  },
  starButton: {
    padding: 4,
    marginRight: 8,
  },
  editStudentInfo: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    backgroundColor: "rgba(28,70,58,0.2)",
    padding: 12,
    borderRadius: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 8,
    minHeight: 80,
    textAlignVertical: "top",
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: "#1c463a",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 40,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  pickerButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 8,
  },
  pickerText: {
    fontSize: 16,
    color: "#FFFFFF",
    flex: 1,
  },
  numberCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  numberText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  filesButton: {
    backgroundColor: "rgba(28,70,58,0.2)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(28,70,58,0.4)",
    marginBottom: 16,
  },
  filesButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  filesButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginLeft: 12,
    fontWeight: "600",
  },
  selectedFilesContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  selectedFileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76,175,80,0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.3)",
  },
  selectedFileName: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
  },
  removeFileButton: {
    padding: 4,
  },
  selectedCountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: "rgba(76,175,80,0.1)",
    padding: 12,
    borderRadius: 8,
  },
  fileCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  fileCardSelected: {
    backgroundColor: "rgba(76,175,80,0.15)",
    borderColor: "rgba(76,175,80,0.4)",
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  fileNameSelected: {
    color: "#4CAF50",
  },
  fileSource: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  confirmButton: {
    backgroundColor: "#1c463a",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 40,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
