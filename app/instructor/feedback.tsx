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
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../supabase.js";
import { useAuth } from "../components/login/AuthContext";

const { width } = Dimensions.get("window");

interface Student {
  id: number;
  name: string;
  instrument: string;
  color?: string;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  type?: string;
  url?: string;
  source: string;
  sourceName: string;
}

export default function SendFeedbackScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [showFileModal, setShowFileModal] = useState(false);
  const [showSessionNumberModal, setShowSessionNumberModal] = useState(false);
  const [showTotalSessionsModal, setShowTotalSessionsModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [availableFiles, setAvailableFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [fullScreenPdf, setFullScreenPdf] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // Form fields
  const [comment, setComment] = useState("");
  const [hwComments, setHwComments] = useState("");
  const [feedback, setFeedback] = useState("");
  const [homeworkRating, setHomeworkRating] = useState(0);
  const [generalRating, setGeneralRating] = useState(0);
  const [sessionType, setSessionType] = useState("Online Theory");
  const [sessionNumber, setSessionNumber] = useState(1);
  const [sessionNumber2, setSessionNumber2] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStudents();
    loadAvailableFiles();
  }, [user]);

  // Handle pre-selected student from navigation params
  useEffect(() => {
    if (params.selectedStudentId && students.length > 0) {
      const preSelectedStudent = students.find(
        (student) => student.id.toString() === params.selectedStudentId
      );
      if (preSelectedStudent) {
        setSelectedStudent(preSelectedStudent);
      }
    }
  }, [params.selectedStudentId, students]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const instructorId = user?.id;

      const { data: students } = await supabase
        .from("students")
        .select("id, name, instrument, color")
        .or(
          `online_instructor_id.eq.${instructorId},theory_instructor_id.eq.${instructorId},in_person_id.eq.${instructorId},second_inperson_id.eq.${instructorId}`
        )
        .order("name");

      setStudents(students || []);
    } catch (error) {
      console.error("Error loading students:", error);
      Alert.alert("Error", "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableFiles = async () => {
    try {
      setFilesLoading(true);
      const [foldersResult, subfoldersResult] = await Promise.all([
        supabase.from("folders").select("*"),
        supabase.from("subfolders").select("*"),
      ]);

      let allFiles: FileItem[] = [];

      // Extract files from folders
      foldersResult.data?.forEach((folder) => {
        if (folder.files && Array.isArray(folder.files)) {
          folder.files.forEach((file: any) => {
            allFiles.push({
              ...file,
              source: "folder",
              sourceName: folder.name,
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
            });
          });
        }
      });

      setAvailableFiles(allFiles);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setFilesLoading(false);
    }
  };

  const toggleFileSelection = (file: FileItem) => {
    const isSelected = selectedFiles.some((f) => f.id === file.id);
    if (isSelected) {
      setSelectedFiles(selectedFiles.filter((f) => f.id !== file.id));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  const removeSelectedFile = (fileId: string) => {
    setSelectedFiles(selectedFiles.filter((f) => f.id !== fileId));
  };

  const submitFeedback = async () => {
    if (!selectedStudent) {
      Alert.alert("Error", "Please select a student");
      return;
    }

    if (generalRating === 0) {
      Alert.alert("Error", "Please select a general rating");
      return;
    }

    try {
      setSubmitting(true);

      const feedbackData = {
        student_id: selectedStudent.id,
        instructor_id: user?.id,
        comment: generalRating, // This is the stars rating (1-5)
        HW_comments: hwComments.trim(),
        feedback: feedback.trim(),
        homework_rating: homeworkRating,
        session_type: sessionType,
        session_number: sessionNumber,
        session_number2: sessionNumber2,
        sheet_files: selectedFiles,
        sheet: selectedFiles.length > 0 ? selectedFiles[0].name : null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("feedback").insert([feedbackData]);

      if (error) throw error;

      Alert.alert("Success", "Feedback sent successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setSelectedStudent(null);
            setComment("");
            setHwComments("");
            setFeedback("");
            setHomeworkRating(0);
            setGeneralRating(0);
            setSelectedFiles([]);
            setSessionType("Online Theory");
            setSessionNumber(1);
            setSessionNumber2(4);
          },
        },
      ]);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "Failed to send feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  // Filter students based on search query
  const getFilteredStudents = () => {
    if (!studentSearchQuery.trim()) {
      return students;
    }
    
    return students.filter(student => 
      student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      student.instrument.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c463a" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.screenHeader}>Create Feedback</Text>
        <Text style={styles.screenSubheader}>
          Select student and provide session feedback
        </Text>
      </View>

      {/* Student Selection Card */}
      <View style={styles.studentCard}>
        <View style={styles.cardHeaderWithIcon}>
          <Ionicons name="person" size={20} color="#4CAF50" />
          <Text style={styles.cardTitleEnhanced}>Student Selection</Text>
          <Text style={styles.requiredBadge}>Required</Text>
        </View>
        <TouchableOpacity
          style={styles.enhancedStudentSelector}
          onPress={() => setShowStudentModal(true)}
        >
          {selectedStudent ? (
            <View style={styles.selectedStudentContent}>
              <View
                style={[
                  styles.studentAvatar,
                  { backgroundColor: selectedStudent.color || "#1c463a" },
                ]}
              >
                <Text style={styles.studentInitial}>
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{selectedStudent.name}</Text>
                <Text style={styles.studentInstrument}>
                  {selectedStudent.instrument}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContent}>
              <Ionicons
                name="person-add"
                size={24}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.placeholderText}>Choose a student</Text>
            </View>
          )}
          <Ionicons
            name="chevron-down"
            size={20}
            color="rgba(255,255,255,0.6)"
          />
        </TouchableOpacity>
      </View>

      {/* Session & Progress Card */}
      <View style={styles.compactCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar" size={20} color="#1c463a" />
          <Text style={styles.cardTitle}>Session Details</Text>
        </View>

        {/* Session Type - Horizontal Pills */}
        <View style={styles.sessionTypeRow}>
          {["Theory", "Practice", "In Person"].map((type, index) => {
            const fullType =
              index === 0
                ? "Online Theory"
                : index === 1
                ? "Online Practice"
                : "In Person";
            return (
              <TouchableOpacity
                key={fullType}
                style={[
                  styles.sessionTypePill,
                  sessionType === fullType && styles.sessionTypePillActive,
                ]}
                onPress={() => setSessionType(fullType)}
              >
                <Text
                  style={[
                    styles.sessionTypePillText,
                    sessionType === fullType &&
                      styles.sessionTypePillTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Session Progress Section */}
        <View style={styles.sessionProgressSection}>
          <View style={styles.sessionCounterContainer}>
            <View style={styles.sessionCounterCard}>
              <Text style={styles.sessionCounterLabel}>Current Session</Text>
              <TouchableOpacity
                style={styles.sessionCounterButton}
                onPress={() => setShowSessionNumberModal(true)}
              >
                <Text style={styles.sessionCounterNumber}>{sessionNumber}</Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.sessionDivider}>
              <View style={styles.sessionDividerLine} />
              <Text style={styles.sessionDividerText}>of</Text>
              <View style={styles.sessionDividerLine} />
            </View>

            <View style={styles.sessionCounterCard}>
              <Text style={styles.sessionCounterLabel}>Total Sessions</Text>
              <TouchableOpacity
                style={styles.sessionCounterButton}
                onPress={() => setShowTotalSessionsModal(true)}
              >
                <Text style={styles.sessionCounterNumber}>
                  {sessionNumber2}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Enhanced Progress Bar */}
          <View style={styles.enhancedProgressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Session {sessionNumber} of {sessionNumber2}
              </Text>
              <Text style={styles.progressPercentage}>
                {Math.round((sessionNumber / sessionNumber2) * 100)}% Complete
              </Text>
            </View>
            <View style={styles.enhancedProgressBar}>
              <View
                style={[
                  styles.enhancedProgressFill,
                  {
                    width: `${Math.min(
                      100,
                      (sessionNumber / sessionNumber2) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* File Selection Card */}
      <View style={styles.enhancedFileCard}>
        <View style={styles.cardHeaderWithIcon}>
          <Ionicons name="musical-notes" size={20} color="#2196F3" />
          <Text style={styles.cardTitleEnhanced}>Sheet Music Files</Text>
          <Text style={styles.optionalBadge}>Optional</Text>
        </View>
        <TouchableOpacity
          style={styles.enhancedFileSelector}
          onPress={() => setShowFileModal(true)}
        >
          <Ionicons name="musical-notes" size={24} color="#1c463a" />
          <Text style={styles.fileSelectorText}>
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file(s) selected`
              : "Select Sheet Music Files"}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="rgba(255,255,255,0.6)"
          />
        </TouchableOpacity>

        {selectedFiles.length > 0 && (
          <View style={styles.selectedFilesContainer}>
            {selectedFiles.map((file) => (
              <View key={file.id} style={styles.selectedFileCard}>
                <Ionicons name="document" size={20} color="#1c463a" />
                <View style={styles.selectedFileInfo}>
                  <Text style={styles.selectedFileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.selectedFileSize}>
                    {formatFileSize(file.size)} • {file.sourceName}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={() => removeSelectedFile(file.id)}
                >
                  <Ionicons name="close" size={16} color="#FF5252" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Enhanced Performance Rating Card */}
      <View style={styles.compactCard}>
        <View style={styles.cardHeaderWithIcon}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.cardTitleEnhanced}>Performance Rating</Text>
          <Text style={styles.requiredBadge}>Required</Text>
        </View>

        {/* Enhanced Performance Rating */}
        <View style={styles.enhancedPerformanceRating}>
          <View style={styles.performanceRatingHeader}>
            <Ionicons name="trophy-outline" size={18} color="#FFD700" />
            <Text style={styles.performanceRatingTitle}>Overall Performance</Text>
          </View>
          <View style={styles.visualRatingContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.visualStarButton,
                  rating <= generalRating && styles.visualStarButtonActive
                ]}
                onPress={() => setGeneralRating(rating)}
              >
                <Ionicons
                  name="star"
                  size={28}
                  color={
                    rating <= generalRating ? "#FFD700" : "rgba(255,255,255,0.3)"
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
          {generalRating > 0 && (
            <Text style={styles.ratingDescription}>
              {generalRating === 1 && "Needs Significant Improvement"}
              {generalRating === 2 && "Below Expectations"}
              {generalRating === 3 && "Meets Expectations"}
              {generalRating === 4 && "Above Expectations"}
              {generalRating === 5 && "Outstanding Performance"}
            </Text>
          )}
        </View>
      </View>

      {/* Feedback Comments Card */}
      <View style={styles.compactCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#1c463a" />
          <Text style={styles.cardTitle}>Comments & Notes</Text>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.compactLabel}>Feedback</Text>
          <TextInput
            style={styles.compactTextArea}
            value={feedback}
            onChangeText={setFeedback}
            placeholder="General observations..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.compactLabel}>Homework Comments</Text>
          <TextInput
            style={styles.compactTextArea}
            value={hwComments}
            onChangeText={setHwComments}
            placeholder="Comments about homework..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Enhanced Homework Rating */}
        <View style={styles.enhancedHomeworkRating}>
          <View style={styles.homeworkRatingHeader}>
            <Ionicons name="star-outline" size={18} color="#FFD700" />
            <Text style={styles.homeworkRatingTitle}>Homework Rating</Text>
          </View>
          <View style={styles.visualRatingContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.visualStarButton,
                  rating <= homeworkRating && styles.visualStarButtonActive
                ]}
                onPress={() => setHomeworkRating(rating)}
              >
                <Ionicons
                  name="star"
                  size={24}
                  color={
                    rating <= homeworkRating
                      ? "#FFD700"
                      : "rgba(255,255,255,0.3)"
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
          {homeworkRating > 0 && (
            <Text style={styles.ratingDescription}>
              {homeworkRating === 1 && "Needs Improvement"}
              {homeworkRating === 2 && "Below Average"}
              {homeworkRating === 3 && "Average"}
              {homeworkRating === 4 && "Good"}
              {homeworkRating === 5 && "Excellent"}
            </Text>
          )}
        </View>
      </View>

      {/* Submit Section */}
      <View style={styles.enhancedSubmitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedStudent || generalRating === 0) &&
              styles.submitButtonDisabled,
          ]}
          onPress={submitFeedback}
          disabled={submitting || !selectedStudent || generalRating === 0}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Send Feedback</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Student Selection Modal */}
      <Modal
        visible={showStudentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Student</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowStudentModal(false);
                setStudentSearchQuery(""); // Clear search when closing
              }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
              <TextInput
                style={styles.searchInput}
                value={studentSearchQuery}
                onChangeText={setStudentSearchQuery}
                placeholder="Search students by name or instrument..."
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              {studentSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setStudentSearchQuery("")}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {getFilteredStudents().length === 0 ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.noResultsText}>
                  {studentSearchQuery.trim() 
                    ? "No students found matching your search" 
                    : "No students assigned to you"}
                </Text>
                {studentSearchQuery.trim() && (
                  <Text style={styles.noResultsSubtext}>
                    Try searching by name or instrument
                  </Text>
                )}
              </View>
            ) : (
              getFilteredStudents().map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={styles.studentOption}
                  onPress={() => {
                    setSelectedStudent(student);
                    setShowStudentModal(false);
                    setStudentSearchQuery(""); // Clear search when selecting
                  }}
                >
                <View
                  style={[
                    styles.studentAvatar,
                    { backgroundColor: student.color || "#1c463a" },
                  ]}
                >
                  <Text style={styles.studentInitial}>
                    {student.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentInstrument}>
                    {student.instrument}
                  </Text>
                </View>
                {selectedStudent?.id === student.id && (
                  <Ionicons name="checkmark" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* File Selection Modal */}
      <Modal
        visible={showFileModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Files</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFileModal(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {filesLoading ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color="#1c463a" />
              <Text style={styles.loadingText}>Loading files...</Text>
            </View>
          ) : (
            <ScrollView style={styles.modalContent}>
              {availableFiles.map((file) => {
                const isSelected = selectedFiles.some((f) => f.id === file.id);
                const isPdf =
                  file.type === "pdf" ||
                  file.name.toLowerCase().endsWith(".pdf");
                const isExpanded = expandedFiles.has(file.id);

                return (
                  <View
                    key={file.id}
                    style={[
                      styles.fileCard,
                      isSelected && styles.fileCardSelected,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.fileHeader}
                      onPress={() => toggleFileSelection(file)}
                    >
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
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <Text style={styles.fileDetails}>
                          {formatFileSize(file.size)} • {file.sourceName}
                        </Text>
                      </View>
                      <View style={styles.fileActions}>
                        {isPdf && file.url && (
                          <TouchableOpacity
                            style={styles.previewButton}
                            onPress={() => toggleFilePreview(file.id)}
                          >
                            <Ionicons
                              name={isExpanded ? "eye-off" : "eye"}
                              size={16}
                              color="#2196F3"
                            />
                          </TouchableOpacity>
                        )}
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#4CAF50"
                          />
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Smaller PDF Preview */}
                    {isPdf && isExpanded && file.url && (
                      <View style={styles.smallPdfPreviewContainer}>
                        <View style={styles.smallPdfPreviewHeader}>
                          <Text style={styles.smallPdfPreviewTitle}>
                            Preview
                          </Text>
                          <TouchableOpacity
                            style={styles.smallFullscreenButton}
                            onPress={() =>
                              setFullScreenPdf({
                                url: file.url!,
                                name: file.name,
                              })
                            }
                          >
                            <Ionicons name="expand" size={14} color="#FFFFFF" />
                            <Text style={styles.smallFullscreenText}>
                              Full Screen
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.smallPdfPreviewWrapper}>
                          <WebView
                            source={{
                              uri: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
                                file.url
                              )}`,
                            }}
                            style={styles.smallPdfPreview}
                            startInLoadingState={true}
                            renderLoading={() => (
                              <View style={styles.smallPdfPreviewLoading}>
                                <ActivityIndicator
                                  size="small"
                                  color="#1c463a"
                                />
                                <Text style={styles.smallPdfPreviewLoadingText}>
                                  Loading...
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
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setShowFileModal(false)}
            >
              <Text style={styles.confirmButtonText}>
                Confirm Selection ({selectedFiles.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                style={styles.fullScreenCloseButton}
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
                <View style={styles.fullScreenLoading}>
                  <ActivityIndicator size="large" color="#1c463a" />
                  <Text style={styles.fullScreenLoadingText}>
                    Loading PDF...
                  </Text>
                </View>
              )}
              onError={(error) => {
                console.error("PDF fullscreen error:", error);
              }}
              scrollEnabled={true}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
            />
          </View>
        )}
      </Modal>

      {/* Session Number Modal */}
      <Modal
        visible={showSessionNumberModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Session Number</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSessionNumberModal(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((number) => (
              <TouchableOpacity
                key={number}
                style={[
                  styles.numberOption,
                  sessionNumber === number && styles.numberOptionSelected,
                ]}
                onPress={() => {
                  setSessionNumber(number);
                  setShowSessionNumberModal(false);
                }}
              >
                <Text
                  style={[
                    styles.numberOptionText,
                    sessionNumber === number && styles.numberOptionTextSelected,
                  ]}
                >
                  Session {number}
                </Text>
                {sessionNumber === number && (
                  <Ionicons name="checkmark" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Total Sessions Modal */}
      <Modal
        visible={showTotalSessionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Total Sessions</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTotalSessionsModal(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {[4, 8, 12, 20].map((number) => (
              <TouchableOpacity
                key={number}
                style={[
                  styles.numberOption,
                  sessionNumber2 === number && styles.numberOptionSelected,
                ]}
                onPress={() => {
                  setSessionNumber2(number);
                  setShowTotalSessionsModal(false);
                }}
              >
                <Text
                  style={[
                    styles.numberOptionText,
                    sessionNumber2 === number &&
                      styles.numberOptionTextSelected,
                  ]}
                >
                  {number} Sessions Total
                </Text>
                {sessionNumber2 === number && (
                  <Ionicons name="checkmark" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    marginBottom: 10,
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
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  studentSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedStudentContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  placeholderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    marginLeft: 12,
    fontWeight: "500",
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  studentInitial: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  studentInstrument: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  sessionRow: {
    flexDirection: "row",
    gap: 16,
  },
  sessionField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 12,
  },
  sessionTypeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  sessionTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    alignItems: "center",
  },
  sessionTypeButtonActive: {
    backgroundColor: "#1c463a",
  },
  sessionTypeText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  sessionTypeTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  fileSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fileSelectorText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 12,
    flex: 1,
  },
  selectedFilesContainer: {
    marginTop: 16,
    gap: 8,
  },
  selectedFileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
  },
  selectedFileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedFileName: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 2,
  },
  selectedFileSize: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  removeFileButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  textArea: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
    textAlignVertical: "top",
    minHeight: 100,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  submitContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1c463a",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#1c463a",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  studentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  fileOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  fileOptionSelected: {
    backgroundColor: "rgba(76,175,80,0.2)",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  confirmButton: {
    backgroundColor: "#1c463a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  // Enhanced File Card Styles
  fileCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  fileCardSelected: {
    backgroundColor: "rgba(76,175,80,0.15)",
    borderColor: "#4CAF50",
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  fileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(33,150,243,0.2)",
  },
  // Small PDF Preview Styles
  smallPdfPreviewContainer: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  smallPdfPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(28,70,58,0.6)",
  },
  smallPdfPreviewTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  smallPdfPreviewWrapper: {
    height: 200, // Smaller than main library (300px)
    backgroundColor: "#FFFFFF",
  },
  smallPdfPreview: {
    flex: 1,
  },
  smallPdfPreviewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  smallPdfPreviewLoadingText: {
    color: "#1c463a",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  smallFullscreenButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
  },
  smallFullscreenText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#FFFFFF",
    marginLeft: 3,
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
  // Session Number Styles
  sessionNumberField: {
    flex: 1,
    marginHorizontal: 6,
  },
  sessionNumberDropdown: {
    marginTop: 8,
  },
  dropdownButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  dropdownText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  sessionProgressIndicator: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sessionProgressText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },
  // Number Selection Modal Styles
  numberOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  numberOptionSelected: {
    backgroundColor: "rgba(76,175,80,0.15)",
    borderColor: "#4CAF50",
  },
  numberOptionText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  numberOptionTextSelected: {
    color: "#4CAF50",
    fontWeight: "700",
  },

  // Compact Card Styles
  compactCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
    flex: 1,
  },
  requiredIndicator: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF5252",
    marginLeft: 4,
  },

  // Session Type Pills
  sessionTypeRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  sessionTypePill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
  },
  sessionTypePillActive: {
    backgroundColor: "#1c463a",
    borderColor: "#4CAF50",
  },
  sessionTypePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  sessionTypePillTextActive: {
    color: "#FFFFFF",
  },

  // Compact Session Numbers
  sessionNumbersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 12,
  },
  compactNumberField: {
    alignItems: "center",
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  compactDropdown: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  compactDropdownText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ofText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
  },

  // Compact Progress Bar
  compactProgressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  compactProgressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 2,
  },

  // Compact Rating Styles
  compactRatingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  compactStarButton: {
    padding: 4,
  },

  // Comments Section
  commentSection: {
    marginBottom: 12,
  },
  compactTextArea: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    textAlignVertical: "top",
    minHeight: 60,
  },

  // Inline Rating Section
  inlineRatingSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inlineRatingContainer: {
    flexDirection: "row",
    gap: 4,
  },
  smallStarButton: {
    padding: 2,
  },

  // Enhanced Layout Styles
  scrollContent: {
    paddingBottom: 20,
  },

  // Header Section
  headerSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 8,
  },
  screenHeader: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  screenSubheader: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
  },

  // Enhanced Card Styles
  studentCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedFileCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Enhanced Card Headers
  cardHeaderWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  cardTitleEnhanced: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 12,
    flex: 1,
    letterSpacing: 0.3,
  },

  // Status Badges
  requiredBadge: {
    backgroundColor: "#FF5252",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionalBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Enhanced Selectors
  enhancedStudentSelector: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    minHeight: 60,
  },
  enhancedFileSelector: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    minHeight: 60,
  },

  // Enhanced Submit Section
  enhancedSubmitContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginTop: 8,
  },
  submitHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  submitTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  submitSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 20,
  },

  // Enhanced Session Progress Styles
  sessionProgressSection: {
    marginTop: 4,
  },
  sessionCounterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sessionCounterCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sessionCounterLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
    textAlign: "center",
  },
  sessionCounterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  sessionCounterNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Session Divider
  sessionDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    flex: 0.3,
  },
  sessionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  sessionDividerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
    marginHorizontal: 8,
  },

  // Enhanced Progress Container
  enhancedProgressContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4CAF50",
  },
  enhancedProgressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  enhancedProgressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },
  
  // Enhanced Homework Rating Styles
  enhancedHomeworkRating: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  homeworkRatingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  homeworkRatingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  visualRatingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  visualStarButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  visualStarButtonActive: {
    backgroundColor: "rgba(255,215,0,0.15)",
    borderColor: "#FFD700",
  },
  ratingDescription: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFD700",
    textAlign: "center",
    fontStyle: "italic",
  },
  
  // Enhanced Performance Rating Styles
  enhancedPerformanceRating: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  performanceRatingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  performanceRatingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },

  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    marginLeft: 12,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
});
