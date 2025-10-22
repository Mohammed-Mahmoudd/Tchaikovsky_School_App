import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../supabase.js";
import { useAuth } from "../components/login/AuthContext";

interface FeedbackData {
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
}

export default function EditFeedbackScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { feedbackId } = useLocalSearchParams();
  
  // Form state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  
  // Form fields
  const [sessionType, setSessionType] = useState("");
  const [sessionNumber, setSessionNumber] = useState(1);
  const [sessionNumber2, setSessionNumber2] = useState(4);
  const [generalRating, setGeneralRating] = useState(0);
  const [homeworkRating, setHomeworkRating] = useState(0);
  const [generalComments, setGeneralComments] = useState("");
  const [homeworkComments, setHomeworkComments] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  
  // Modal states
  const [showSessionTypeModal, setShowSessionTypeModal] = useState(false);
  const [showSessionNumberModal, setShowSessionNumberModal] = useState(false);
  const [showTotalSessionsModal, setShowTotalSessionsModal] = useState(false);

  const sessionTypes = ["Online Theory", "Online Practice", "In Person"];
  const totalSessionOptions = [4, 8, 12, 20];

  useEffect(() => {
    if (feedbackId) {
      loadFeedbackData();
    }
  }, [feedbackId]);

  const loadFeedbackData = async () => {
    try {
      setLoading(true);
      
      const { data: feedbackData, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("id", feedbackId)
        .single();

      if (error) {
        console.error("Error loading feedback:", error);
        Alert.alert("Error", "Failed to load feedback data");
        router.back();
        return;
      }

      if (feedbackData) {
        setFeedback(feedbackData);
        
        // Pre-fill form fields
        setSessionType(feedbackData.session_type || "");
        setSessionNumber(feedbackData.session_number || 1);
        setSessionNumber2(feedbackData.session_number2 || 4);
        setGeneralRating(feedbackData.comment || 0);
        setHomeworkRating(feedbackData.homework_rating || 0);
        setGeneralComments(feedbackData.feedback || "");
        setHomeworkComments(feedbackData.HW_comments || "");
        
        // Set meeting/location based on session type
        if (feedbackData.session_type === "Online Theory") {
          setMeetingLocation(feedbackData.Online_Theory_Meet || "");
        } else if (feedbackData.session_type === "Online Practice") {
          setMeetingLocation(feedbackData.Online_Practice_Meet || "");
        } else if (feedbackData.session_type === "In Person") {
          setMeetingLocation(feedbackData.In_person_Location || "");
        }
      }
    } catch (error) {
      console.error("Error loading feedback:", error);
      Alert.alert("Error", "Failed to load feedback data");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Prepare update data
      const updateData: any = {
        session_type: sessionType,
        session_number: sessionNumber,
        session_number2: sessionNumber2,
        comment: generalRating,
        homework_rating: homeworkRating,
        feedback: generalComments,
        HW_comments: homeworkComments,
      };

      // Set location/meeting based on session type
      if (sessionType === "Online Theory") {
        updateData.Online_Theory_Meet = meetingLocation;
        updateData.Online_Practice_Meet = null;
        updateData.In_person_Location = null;
      } else if (sessionType === "Online Practice") {
        updateData.Online_Practice_Meet = meetingLocation;
        updateData.Online_Theory_Meet = null;
        updateData.In_person_Location = null;
      } else if (sessionType === "In Person") {
        updateData.In_person_Location = meetingLocation;
        updateData.Online_Theory_Meet = null;
        updateData.Online_Practice_Meet = null;
      }

      const { error } = await supabase
        .from("feedback")
        .update(updateData)
        .eq("id", feedbackId);

      if (error) {
        console.error("Error updating feedback:", error);
        Alert.alert("Error", "Failed to update feedback");
        return;
      }

      Alert.alert("Success", "Feedback updated successfully", [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to feedback details with refresh
            router.push({
              pathname: "/instructor/feedback-details",
              params: { 
                id: feedbackId,
                refresh: Date.now().toString()
              }
            });
          }
        }
      ]);
    } catch (error) {
      console.error("Error updating feedback:", error);
      Alert.alert("Error", "Failed to update feedback");
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (rating: number, onPress: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {Array.from({ length: 5 }, (_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onPress(index + 1)}
            style={styles.starButton}
          >
            <Ionicons
              name="star"
              size={32}
              color={index < rating ? "#FFD700" : "rgba(255,255,255,0.3)"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c463a" />
        <Text style={styles.loadingText}>Loading feedback...</Text>
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
          <Text style={styles.headerTitle}>Edit Feedback</Text>
          <Text style={styles.headerSubtitle}>Update session feedback</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Session Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Information</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Session Type</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowSessionTypeModal(true)}
            >
              <Text style={styles.dropdownText}>
                {sessionType || "Select session type"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          {/* Session Numbers */}
          <View style={styles.sessionNumbersContainer}>
            <View style={styles.sessionNumberField}>
              <Text style={styles.fieldLabel}>Current Session</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowSessionNumberModal(true)}
              >
                <Text style={styles.dropdownText}>Session {sessionNumber}</Text>
                <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            <View style={styles.sessionNumberField}>
              <Text style={styles.fieldLabel}>Total Sessions</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowTotalSessionsModal(true)}
              >
                <Text style={styles.dropdownText}>{sessionNumber2} Total</Text>
                <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Session {sessionNumber} of {sessionNumber2}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(100, (sessionNumber / sessionNumber2) * 100)}%` }
                ]} 
              />
            </View>
          </View>

          {/* Meeting/Location */}
          {sessionType && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                {sessionType === "In Person" ? "Location" : "Meeting Link"}
              </Text>
              <TextInput
                style={styles.textInput}
                value={meetingLocation}
                onChangeText={setMeetingLocation}
                placeholder={
                  sessionType === "In Person" 
                    ? "Enter location" 
                    : "Enter meeting link"
                }
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>
          )}
        </View>

        {/* Ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Ratings</Text>
          
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>General Performance</Text>
            {renderStars(generalRating, setGeneralRating)}
            <Text style={styles.ratingValue}>({generalRating}/5)</Text>
          </View>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Homework Rating</Text>
            {renderStars(homeworkRating, setHomeworkRating)}
            <Text style={styles.ratingValue}>({homeworkRating}/5)</Text>
          </View>
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback Comments</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>General Feedback</Text>
            <TextInput
              style={styles.textArea}
              value={generalComments}
              onChangeText={setGeneralComments}
              placeholder="Enter general feedback..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Homework Comments</Text>
            <TextInput
              style={styles.textArea}
              value={homeworkComments}
              onChangeText={setHomeworkComments}
              placeholder="Enter homework comments..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </ScrollView>

      {/* Session Type Modal */}
      <Modal
        visible={showSessionTypeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Session Type</Text>
            <TouchableOpacity onPress={() => setShowSessionTypeModal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {sessionTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.modalOption,
                  sessionType === type && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSessionType(type);
                  setShowSessionTypeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{type}</Text>
                {sessionType === type && (
                  <Ionicons name="checkmark" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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
            <TouchableOpacity onPress={() => setShowSessionNumberModal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((number) => (
              <TouchableOpacity
                key={number}
                style={[
                  styles.modalOption,
                  sessionNumber === number && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSessionNumber(number);
                  setShowSessionNumberModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>Session {number}</Text>
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
            <TouchableOpacity onPress={() => setShowTotalSessionsModal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {totalSessionOptions.map((total) => (
              <TouchableOpacity
                key={total}
                style={[
                  styles.modalOption,
                  sessionNumber2 === total && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSessionNumber2(total);
                  setShowTotalSessionsModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{total} Sessions Total</Text>
                {sessionNumber2 === total && (
                  <Ionicons name="checkmark" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  dropdownText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  sessionNumbersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sessionNumberField: {
    flex: 1,
    marginHorizontal: 4,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
    textAlign: "center",
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
  textInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  textArea: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    minHeight: 100,
    textAlignVertical: "top",
  },
  ratingContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  starButton: {
    marginHorizontal: 4,
  },
  ratingValue: {
    fontSize: 16,
    color: "#FFD700",
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#1c463a",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    marginVertical: 4,
  },
  modalOptionSelected: {
    backgroundColor: "rgba(76,175,80,0.2)",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
});
