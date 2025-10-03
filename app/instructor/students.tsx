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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../supabase.js";
import { useAuth } from "../components/login/AuthContext";

interface Student {
  id: number;
  name: string;
  instrument: string;
  avatar?: string;
  color?: string;
  student_email: string;
  father_email?: string;
  mother_email?: string;
  student_phone_number?: string;
  father_phone?: string;
  mother_phone?: string;
  online_instructor_name?: string;
  theory_instructor_name?: string;
  in_person_name?: string;
  second_inperson_name?: string;
  online_instructor_id?: number;
  theory_instructor_id?: number;
  in_person_id?: number;
  second_inperson_id?: number;
}

export default function StudentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadStudents();
    }
  }, [user]);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, students]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const instructorId = user?.id;

      const { data, error } = await supabase
        .from("students")
        .select("*")
        .or(
          `online_instructor_id.eq.${instructorId},theory_instructor_id.eq.${instructorId},in_person_id.eq.${instructorId},second_inperson_id.eq.${instructorId}`
        )
        .order("name", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error loading students:", error);
      Alert.alert("Error", "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.instrument.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  const getStudentInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getInstructorRole = (student: Student) => {
    const roles = [];
    if (student.online_instructor_id === user?.id) roles.push("Online");
    if (student.theory_instructor_id === user?.id) roles.push("Theory");
    if (student.in_person_id === user?.id) roles.push("In-Person");
    if (student.second_inperson_id === user?.id) roles.push("In-Person 2");
    return roles.join(", ");
  };

  const handleStudentPress = (student: Student) => {
    setSelectedStudent(student);
  };

  const closeStudentDetails = () => {
    setSelectedStudent(null);
  };

  const handleAddFeedback = (student: Student) => {
    // Navigate to feedback form with student pre-selected
    router.push({
      pathname: "/instructor/feedback",
      params: {
        selectedStudentId: student.id.toString(),
        selectedStudentName: student.name,
        selectedStudentInstrument: student.instrument,
        selectedStudentColor: student.color || "#4CAF50",
      },
    });
  };

  const handleViewHistory = (student: Student) => {
    // Navigate to feedback history screen with student info
    router.push({
      pathname: "/instructor/feedback-history",
      params: {
        studentId: student.id.toString(),
        studentName: student.name,
        studentInstrument: student.instrument,
        studentColor: student.color || "#4CAF50",
      },
    });
  };

  const renderStudentCard = (student: Student) => (
    <TouchableOpacity
      key={student.id}
      style={styles.studentCard}
      onPress={() => handleStudentPress(student)}
    >
      <View style={styles.studentHeader}>
        <View
          style={[
            styles.studentAvatar,
            { backgroundColor: student.color || "#4CAF50" },
          ]}
        >
          <Text style={styles.studentInitials}>
            {getStudentInitials(student.name)}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentInstrument}>{student.instrument}</Text>
          <Text style={styles.instructorRole}>
            Teaching: {getInstructorRole(student)}
          </Text>
        </View>
        <View style={styles.studentActions}>
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => handleAddFeedback(student)}
            activeOpacity={0.7}
          >
            <Ionicons name="star" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => handleViewHistory(student)}
            activeOpacity={0.7}
          >
            <Ionicons name="analytics" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStudentDetails = () => {
    if (!selectedStudent) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedStudent.name}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeStudentDetails}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Basic Information</Text>
              <View style={styles.detailRow}>
                <Ionicons name="musical-notes" size={20} color="#4CAF50" />
                <Text style={styles.detailLabel}>Instrument:</Text>
                <Text style={styles.detailValue}>
                  {selectedStudent.instrument}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="school" size={20} color="#2196F3" />
                <Text style={styles.detailLabel}>Teaching Role:</Text>
                <Text style={styles.detailValue}>
                  {getInstructorRole(selectedStudent)}
                </Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Contact Information</Text>
              <View style={styles.detailRow}>
                <Ionicons name="mail" size={20} color="#FF9800" />
                <Text style={styles.detailLabel}>Student Email:</Text>
                <Text style={styles.detailValue}>
                  {selectedStudent.student_email}
                </Text>
              </View>
              {selectedStudent.student_phone_number && (
                <View style={styles.detailRow}>
                  <Ionicons name="call" size={20} color="#9C27B0" />
                  <Text style={styles.detailLabel}>Student Phone:</Text>
                  <Text style={styles.detailValue}>
                    {selectedStudent.student_phone_number}
                  </Text>
                </View>
              )}
              {selectedStudent.father_email && (
                <View style={styles.detailRow}>
                  <Ionicons name="mail" size={20} color="#FF9800" />
                  <Text style={styles.detailLabel}>Father Email:</Text>
                  <Text style={styles.detailValue}>
                    {selectedStudent.father_email}
                  </Text>
                </View>
              )}
              {selectedStudent.father_phone && (
                <View style={styles.detailRow}>
                  <Ionicons name="call" size={20} color="#9C27B0" />
                  <Text style={styles.detailLabel}>Father Phone:</Text>
                  <Text style={styles.detailValue}>
                    {selectedStudent.father_phone}
                  </Text>
                </View>
              )}
              {selectedStudent.mother_email && (
                <View style={styles.detailRow}>
                  <Ionicons name="mail" size={20} color="#FF9800" />
                  <Text style={styles.detailLabel}>Mother Email:</Text>
                  <Text style={styles.detailValue}>
                    {selectedStudent.mother_email}
                  </Text>
                </View>
              )}
              {selectedStudent.mother_phone && (
                <View style={styles.detailRow}>
                  <Ionicons name="call" size={20} color="#9C27B0" />
                  <Text style={styles.detailLabel}>Mother Phone:</Text>
                  <Text style={styles.detailValue}>
                    {selectedStudent.mother_phone}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Other Instructors</Text>
              {selectedStudent.online_instructor_name && (
                <View style={styles.detailRow}>
                  <Ionicons name="laptop" size={20} color="#4CAF50" />
                  <Text style={styles.detailLabel}>Online:</Text>
                  <Text style={styles.detailValue}>
                    {selectedStudent.online_instructor_name}
                  </Text>
                </View>
              )}
              {selectedStudent.theory_instructor_name && (
                <View style={styles.detailRow}>
                  <Ionicons name="book" size={20} color="#2196F3" />
                  <Text style={styles.detailLabel}>Theory:</Text>
                  <Text style={styles.detailValue}>
                    {selectedStudent.theory_instructor_name}
                  </Text>
                </View>
              )}
              {selectedStudent.in_person_name && (
                <View style={styles.detailRow}>
                  <Ionicons name="person" size={20} color="#FF9800" />
                  <Text style={styles.detailLabel}>In-Person:</Text>
                  <Text style={styles.detailValue}>
                    {selectedStudent.in_person_name}
                  </Text>
                </View>
              )}
              {selectedStudent.second_inperson_name && (
                <View style={styles.detailRow}>
                  <Ionicons name="people" size={20} color="#9C27B0" />
                  <Text style={styles.detailLabel}>In-Person 2:</Text>
                  <Text style={styles.detailValue}>
                    {selectedStudent.second_inperson_name}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close"
                  size={20}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Students List */}
        <View style={styles.studentsContainer}>
          <Text style={styles.sectionTitle}>
            My Students ({filteredStudents.length})
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loadingText}>Loading students...</Text>
            </View>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map(renderStudentCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={64}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.emptyTitle}>No Students Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "No students are assigned to you yet"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Student Details Modal */}
      {renderStudentDetails()}
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
  studentsContainer: {
    marginBottom: 40,
  },
  studentCard: {
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
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  studentInitials: {
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
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginBottom: 4,
  },
  instructorRole: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
  },
  studentActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  historyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 6,
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
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "rgba(46, 125, 50, 0.95)",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
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
  modalBody: {
    padding: 24,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginLeft: 12,
    minWidth: 100,
  },
  detailValue: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "500",
    flex: 1,
  },
});
