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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../supabase.js";
import { useAuth } from "../components/login/AuthContext";

interface Student {
  id: number;
  name: string;
  instrument: string;
  color?: string;
}

interface Feedback {
  id: number;
  student_id: number;
  student_name: string;
  comment: string;
  homework_rating: number;
  created_at: string;
  session_type: string;
  session_number: number;
  session_number2?: number;
  HW_comments?: string;
  feedback?: string;
  Online_Theory_Meet?: string;
  Online_Practice_Meet?: string;
  In_person_Location?: string;
}

export default function FeedbackScreen() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newFeedback, setNewFeedback] = useState({
    id: "",
    student_id: "",
    comment: "",
    homework_rating: "",
    created_at: "",
    HW_comments: "",
    session_type: "",
    session_number: "",
    session_number2: "",
    instructor_id: "",
    feedback: "",
    Online_Theory_Meet: "",
    Online_Practice_Meet: "",
    In_person_Location: "",
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    filterFeedback();
  }, [searchQuery, selectedFilter, feedbackList]);

  const loadData = async () => {
    try {
      setLoading(true);
      const instructorId = user?.id;

      // Load students
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, name, instrument, color")
        .or(
          `online_instructor_id.eq.${instructorId},theory_instructor_id.eq.${instructorId},in_person_id.eq.${instructorId},second_inperson_id.eq.${instructorId}`
        )
        .order("name", { ascending: true });

      setStudents(studentsData || []);

      // Load feedback
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false });

      // Add student names to feedback
      const feedbackWithNames =
        feedbackData?.map((feedback) => {
          const student = studentsData?.find(
            (s) => s.id === feedback.student_id
          );
          return {
            ...feedback,
            student_name: student?.name || "Unknown Student",
          };
        }) || [];

      setFeedbackList(feedbackWithNames);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filterFeedback = () => {
    let filtered = feedbackList;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (feedback) =>
          feedback.student_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          feedback.session_type
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          feedback.comment.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (feedback) => feedback.session_type === selectedFilter
      );
    }

    setFilteredFeedback(filtered);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  const handleAddFeedback = async () => {
    if (!selectedStudent) {
      Alert.alert("Error", "Please select a student");
      return;
    }

    if (!newFeedback.comment || parseInt(newFeedback.comment) === 0) {
      Alert.alert("Error", "Please provide a general comments rating");
      return;
    }

    if (
      !newFeedback.homework_rating ||
      parseInt(newFeedback.homework_rating) === 0
    ) {
      Alert.alert("Error", "Please provide a homework rating");
      return;
    }

    try {
      const { error } = await supabase.from("feedback").insert({
        student_id: selectedStudent.id,
        instructor_id: user?.id,
        comment: parseInt(newFeedback.comment) || 0,
        homework_rating: parseInt(newFeedback.homework_rating) || 0,
        session_type: newFeedback.session_type,
        session_number: parseInt(newFeedback.session_number) || 1,
        session_number2: parseInt(newFeedback.session_number2) || 4,
        HW_comments: newFeedback.HW_comments,
        feedback: newFeedback.feedback,
        Online_Theory_Meet: newFeedback.Online_Theory_Meet,
        Online_Practice_Meet: newFeedback.Online_Practice_Meet,
        In_person_Location: newFeedback.In_person_Location,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert("Success", "Feedback added successfully!");
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error adding feedback:", error);
      Alert.alert("Error", "Failed to add feedback");
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setNewFeedback({
      id: "",
      student_id: "",
      comment: "",
      homework_rating: "",
      created_at: "",
      HW_comments: "",
      session_type: "",
      session_number: "",
      session_number2: "",
      instructor_id: "",
      feedback: "",
      Online_Theory_Meet: "",
      Online_Practice_Meet: "",
      In_person_Location: "",
    });
  };

  const renderFeedbackCard = (feedback: Feedback) => (
    <View key={feedback.id} style={styles.feedbackCard}>
      <View style={styles.feedbackHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{feedback.student_name}</Text>
          <Text style={styles.sessionType}>{feedback.session_type}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>{feedback.homework_rating}/5</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name="star"
                size={16}
                color={
                  star <= feedback.homework_rating
                    ? "#FFD700"
                    : "rgba(255,255,255,0.3)"
                }
              />
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.feedbackComment}>{feedback.comment}</Text>

      {feedback.HW_comments && (
        <View style={styles.additionalInfo}>
          <Text style={styles.additionalLabel}>Homework Comments:</Text>
          <Text style={styles.additionalText}>{feedback.HW_comments}</Text>
        </View>
      )}

      <View style={styles.feedbackFooter}>
        <Text style={styles.timestamp}>
          {formatTimeAgo(feedback.created_at)}
        </Text>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionNumber}>
            Session {feedback.session_number}
          </Text>
          {feedback.session_number2 && (
            <Text style={styles.sessionNumber2}>
              • {feedback.session_number2}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderAddFeedbackModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Feedback</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAddModal(false)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Student Display (Read-only) */}
          {selectedStudent && (
            <Text style={styles.editStudentInfo}>
              Student: {selectedStudent.name} - {selectedStudent.instrument}
            </Text>
          )}

          {/* General Comments Rating */}
          <Text style={styles.fieldLabel}>General Comments Rating</Text>
          <View style={styles.ratingSelector}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={styles.ratingOption}
                onPress={() =>
                  setNewFeedback({ ...newFeedback, comment: rating.toString() })
                }
              >
                <Ionicons
                  name="star"
                  size={32}
                  color={
                    rating <= parseInt(newFeedback.comment) || 0
                      ? "#FFD700"
                      : "rgba(255,255,255,0.3)"
                  }
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Homework Rating */}
          <Text style={styles.fieldLabel}>Homework Rating</Text>
          <View style={styles.ratingSelector}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={styles.ratingOption}
                onPress={() =>
                  setNewFeedback({
                    ...newFeedback,
                    homework_rating: rating.toString(),
                  })
                }
              >
                <Ionicons
                  name="star"
                  size={32}
                  color={
                    rating <= parseInt(newFeedback.homework_rating) || 0
                      ? "#FFD700"
                      : "rgba(255,255,255,0.3)"
                  }
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Homework Comments */}
          <Text style={styles.fieldLabel}>Homework Comments</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter homework feedback..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={newFeedback.HW_comments}
            onChangeText={(text) =>
              setNewFeedback({ ...newFeedback, HW_comments: text })
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
            value={newFeedback.feedback}
            onChangeText={(text) =>
              setNewFeedback({ ...newFeedback, feedback: text })
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
            value={newFeedback.session_type}
            onChangeText={(text) =>
              setNewFeedback({ ...newFeedback, session_type: text })
            }
          />

          {/* Session Numbers */}
          <View style={styles.rowContainer}>
            <View style={styles.halfWidth}>
              <Text style={styles.fieldLabel}>Session Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Session number..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={newFeedback.session_number}
                onChangeText={(text) =>
                  setNewFeedback({ ...newFeedback, session_number: text })
                }
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.fieldLabel}>Session Number 2</Text>
              <TextInput
                style={styles.input}
                placeholder="Session number 2..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={newFeedback.session_number2}
                onChangeText={(text) =>
                  setNewFeedback({ ...newFeedback, session_number2: text })
                }
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Meeting Details */}
          <Text style={styles.fieldLabel}>Online Theory Meet</Text>
          <TextInput
            style={styles.input}
            placeholder="Meeting link or details..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={newFeedback.Online_Theory_Meet}
            onChangeText={(text) =>
              setNewFeedback({ ...newFeedback, Online_Theory_Meet: text })
            }
          />

          <Text style={styles.fieldLabel}>Online Practice Meet</Text>
          <TextInput
            style={styles.input}
            placeholder="Meeting link or details..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={newFeedback.Online_Practice_Meet}
            onChangeText={(text) =>
              setNewFeedback({ ...newFeedback, Online_Practice_Meet: text })
            }
          />

          <Text style={styles.fieldLabel}>In-Person Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Location details..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={newFeedback.In_person_Location}
            onChangeText={(text) =>
              setNewFeedback({ ...newFeedback, In_person_Location: text })
            }
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleAddFeedback}
          >
            <Text style={styles.submitButtonText}>Add Feedback</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Add Button */}
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Feedback Management</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search feedback..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterTabs}>
              {["all", "lesson", "practice", "theory", "performance"].map(
                (filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterTab,
                      selectedFilter === filter && styles.activeFilterTab,
                    ]}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        selectedFilter === filter && styles.activeFilterTabText,
                      ]}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </ScrollView>
        </View>

        {/* Feedback List */}
        <View style={styles.feedbackContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loadingText}>Loading feedback...</Text>
            </View>
          ) : filteredFeedback.length > 0 ? (
            filteredFeedback.map(renderFeedbackCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubbles-outline"
                size={64}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.emptyTitle}>No Feedback Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery || selectedFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by adding feedback for your students"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Feedback Modal */}
      {renderAddFeedbackModal()}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(46, 125, 50, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchContainer: {
    marginBottom: 20,
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
  filterContainer: {
    marginBottom: 24,
  },
  filterTabs: {
    flexDirection: "row",
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  activeFilterTab: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  activeFilterTabText: {
    color: "#FFFFFF",
  },
  feedbackContainer: {
    marginBottom: 40,
  },
  feedbackCard: {
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
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
  sessionType: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  ratingContainer: {
    alignItems: "flex-end",
  },
  rating: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  stars: {
    flexDirection: "row",
  },
  feedbackComment: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 22,
    marginBottom: 12,
  },
  additionalInfo: {
    marginBottom: 12,
  },
  additionalLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    marginBottom: 4,
  },
  additionalText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  feedbackFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  timestamp: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  sessionInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionNumber: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  sessionNumber2: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  studentSelector: {
    flexDirection: "row",
    gap: 12,
  },
  studentOption: {
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    minWidth: 80,
  },
  selectedStudentOption: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  studentInitials: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  studentOptionName: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
  sessionTypeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sessionTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  selectedSessionType: {
    backgroundColor: "#1c463a",
    borderColor: "#1c463a",
  },
  sessionTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  selectedSessionTypeText: {
    color: "#FFFFFF",
  },
  ratingSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  ratingOption: {
    padding: 8,
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
  submitButton: {
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
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
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
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
});
