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
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../supabase.js";
import { Instructor } from "../../services/authService";

interface Student {
  id: string;
  name: string;
  student_email: string;
  father_email: string;
  user_id: string;
  mother_email: string;
  online_instructor_name: string;
  online_instructor_id: string;
  theory_instructor_name: string;
  theory_instructor_id: string;
  in_person_name: string;
  in_person_id: string;
  created_at: string;
  instrument: string;
  avatar: string;
  color: string;
  password?: string;
  father_phone?: string;
  mother_phone?: string;
  student_phone_number?: string;
  second_inperson_id?: string;
  second_inperson_name?: string;
}

const { width } = Dimensions.get("window");

interface UserManagementScreenProps {
  onBack: () => void;
}

type UserType = "students" | "instructors";

export function UserManagementScreen({ onBack }: UserManagementScreenProps) {
  const [activeTab, setActiveTab] = useState<UserType>("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [instructorCount, setInstructorCount] = useState(0);
  const [availableInstructors, setAvailableInstructors] = useState<
    Instructor[]
  >([]);

  useEffect(() => {
    loadUsers();
    loadCounts();
    loadAvailableInstructors();
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      if (activeTab === "students") {
        const { data, error } = await supabase
          .from("students")
          .select("*")
          .order("name");

        if (error) throw error;
        setStudents(data || []);
      } else {
        const { data, error } = await supabase
          .from("instructors")
          .select("*")
          .order("name");

        if (error) throw error;
        setInstructors(data || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    try {
      const [studentsResult, instructorsResult] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase
          .from("instructors")
          .select("id", { count: "exact", head: true }),
      ]);

      setStudentCount(studentsResult.count || 0);
      setInstructorCount(instructorsResult.count || 0);
    } catch (error) {
      console.error("Error loading counts:", error);
    }
  };

  const loadAvailableInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("*")
        .order("name");

      if (error) throw error;
      setAvailableInstructors(data || []);
    } catch (error) {
      console.error("Error loading available instructors:", error);
    }
  };

  const handleDeleteUser = (user: any) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteUser(user),
        },
      ]
    );
  };

  const deleteUser = async (user: any) => {
    try {
      const { error } = await supabase
        .from(activeTab)
        .delete()
        .eq("id", user.id);

      if (error) throw error;

      Alert.alert("Success", "User deleted successfully");
      loadUsers();
      loadCounts(); // Update the counts after deletion
    } catch (error) {
      console.error("Error deleting user:", error);
      Alert.alert("Error", "Failed to delete user");
    }
  };

  const filteredUsers = () => {
    const users = activeTab === "students" ? students : instructors;
    if (!searchQuery) return users;

    return users.filter((user) => {
      const email =
        activeTab === "students"
          ? (user as Student).student_email
          : (user as Instructor).email;

      return (
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };

  const renderUserCard = (user: any) => {
    const isStudent = activeTab === "students";

    return (
      <View key={user.id} style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>
              {isStudent ? user.student_email : user.email}
            </Text>
            {isStudent && user.instrument && (
              <Text style={styles.userInstrument}>🎵 {user.instrument}</Text>
            )}
            {!isStudent && user.role && (
              <Text style={styles.userRole}>👨‍🏫 {user.role}</Text>
            )}
          </View>

          <View style={styles.userActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setEditingUser(user)}
            >
              <Ionicons name="pencil" size={18} color="#2196F3" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteUser(user)}
            >
              <Ionicons name="trash" size={18} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>

        {isStudent && (
          <View style={styles.studentDetails}>
            <View style={styles.contactRow}>
              {user.father_email && (
                <Text style={styles.contactText}>👨 {user.father_email}</Text>
              )}
              {user.mother_email && (
                <Text style={styles.contactText}>👩 {user.mother_email}</Text>
              )}
            </View>

            <View style={styles.instructorRow}>
              {user.online_instructor_name && (
                <Text style={styles.instructorText}>
                  💻 {user.online_instructor_name}
                </Text>
              )}
              {user.theory_instructor_name && (
                <Text style={styles.instructorText}>
                  📚 {user.theory_instructor_name}
                </Text>
              )}
              {user.in_person_name && (
                <Text style={styles.instructorText}>
                  🏫 {user.in_person_name}
                </Text>
              )}
            </View>
          </View>
        )}

        {!isStudent && (
          <View style={styles.instructorDetails}>
            {user.phone && (
              <Text style={styles.contactText}>📞 {user.phone}</Text>
            )}
            {user.type && (
              <Text style={styles.typeText}>Type: {user.type}</Text>
            )}
            {user.role2 && (
              <Text style={styles.typeText}>Secondary Role: {user.role2}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "students" && styles.activeTab]}
          onPress={() => setActiveTab("students")}
        >
          <Ionicons
            name="people"
            size={20}
            color={
              activeTab === "students" ? "#FFFFFF" : "rgba(255,255,255,0.6)"
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "students" && styles.activeTabText,
            ]}
          >
            Students ({studentCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "instructors" && styles.activeTab]}
          onPress={() => setActiveTab("instructors")}
        >
          <Ionicons
            name="school"
            size={20}
            color={
              activeTab === "instructors" ? "#FFFFFF" : "rgba(255,255,255,0.6)"
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "instructors" && styles.activeTabText,
            ]}
          >
            Instructors ({instructorCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add User Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>
          Add {activeTab === "students" ? "Student" : "Instructor"}
        </Text>
      </TouchableOpacity>

      {/* Users List */}
      <ScrollView style={styles.usersList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading {activeTab}...</Text>
          </View>
        ) : filteredUsers().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={64}
              color="rgba(255,255,255,0.3)"
            />
            <Text style={styles.emptyText}>No {activeTab} found</Text>
            {searchQuery && (
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            )}
          </View>
        ) : (
          filteredUsers().map(renderUserCard)
        )}
      </ScrollView>

      {/* Create/Edit User Modal */}
      <CreateUserModal
        visible={showCreateModal || !!editingUser}
        userType={activeTab}
        editingUser={editingUser}
        availableInstructors={availableInstructors}
        onClose={() => {
          setShowCreateModal(false);
          setEditingUser(null);
        }}
        onSuccess={() => {
          setShowCreateModal(false);
          setEditingUser(null);
          loadUsers();
          loadCounts();
        }}
      />
    </View>
  );
}

// Create User Modal Component
function CreateUserModal({
  visible,
  userType,
  editingUser,
  availableInstructors,
  onClose,
  onSuccess,
}: any) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [instructorType, setInstructorType] = useState<string>("");
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [showInstructorRoleModal, setShowInstructorRoleModal] = useState(false);
  const [showInstructorTypeModal, setShowInstructorTypeModal] = useState(false);

  const instruments = ["Piano", "Guitar", "Violin"];
  const instructorRoles = [
    "Online_Instructor",
    "Theory_Instructor",
    "In_person",
  ];
  const instructorTypes = ["Piano", "Guitar", "Violin", "Vocal", "Theory"];

  useEffect(() => {
    if (editingUser) {
      setFormData(editingUser);
    } else {
      setFormData({});
    }
  }, [editingUser]);

  const showInstructorPicker = (type: string) => {
    setInstructorType(type);
    setShowInstructorModal(true);
  };

  const selectInstructor = (instructor: Instructor) => {
    const updates: any = {};

    if (instructorType === "online") {
      updates.online_instructor_id = instructor.id;
      updates.online_instructor_name = instructor.name;
    } else if (instructorType === "theory") {
      updates.theory_instructor_id = instructor.id;
      updates.theory_instructor_name = instructor.name;
    } else if (instructorType === "in_person") {
      updates.in_person_id = instructor.id;
      updates.in_person_name = instructor.name;
    } else if (instructorType === "second_inperson") {
      updates.second_inperson_id = instructor.id;
      updates.second_inperson_name = instructor.name;
    }

    setFormData({ ...formData, ...updates });
    setShowInstructorModal(false);
  };

  const selectInstrument = (instrument: string) => {
    setFormData({ ...formData, instrument });
    setShowInstrumentModal(false);
  };

  const selectInstructorRole = (role: string) => {
    setFormData({ ...formData, role });
    setShowInstructorRoleModal(false);
  };

  const selectInstructorType = (type: string) => {
    setFormData({ ...formData, type });
    setShowInstructorTypeModal(false);
  };

  const getFilteredInstructors = () => {
    if (!instructorType) return availableInstructors;

    return availableInstructors.filter((instructor: Instructor) => {
      if (instructorType === "online") {
        return instructor.role === "Online_Instructor";
      } else if (instructorType === "theory") {
        return instructor.role === "Theory_Instructor";
      } else if (
        instructorType === "in_person" ||
        instructorType === "second_inperson"
      ) {
        return instructor.role === "In_person";
      }
      return true;
    });
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert("Error", "Name is required");
      return;
    }

    // Validate required fields based on user type
    if (userType === "students") {
      if (!formData.instrument) {
        Alert.alert("Error", "Instrument is required for students");
        return;
      }
      if (!formData.password) {
        Alert.alert("Error", "Password is required for student account");
        return;
      }
    } else if (userType === "instructors") {
      if (!formData.email || !formData.role) {
        Alert.alert("Error", "Email and role are required for instructors");
        return;
      }
    }

    setLoading(true);
    try {
      let dataToSave = { ...formData };

      // Prepare data based on user type
      if (userType === "students") {
        // Student data mapping
        dataToSave = {
          name: formData.name,
          instrument: formData.instrument,
          avatar: formData.avatar || null,
          color: formData.color || "#4CAF50",
          student_email: formData.student_email || null,
          father_email: formData.father_email || null,
          mother_email: formData.mother_email || null,
          online_instructor_name: formData.online_instructor_name || null,
          theory_instructor_name: formData.theory_instructor_name || null,
          in_person_name: formData.in_person_name || null,
          online_instructor_id: formData.online_instructor_id || null,
          theory_instructor_id: formData.theory_instructor_id || null,
          in_person_id: formData.in_person_id || null,
          password: formData.password,
          father_phone: formData.father_phone || null,
          mother_phone: formData.mother_phone || null,
          student_phone_number: formData.student_phone_number || null,
          second_inperson_id: formData.second_inperson_id || null,
          second_inperson_name: formData.second_inperson_name || null,
        };
      } else if (userType === "instructors") {
        // Instructor data mapping
        dataToSave = {
          name: formData.name,
          email: formData.email,
          avatar: formData.avatar || null,
          color: formData.color || "#2196F3",
          role: formData.role,
          password: formData.password || "defaultpass123",
          type: formData.type || null,
          phone: formData.phone || null,
          role2: formData.role2 || null,
        };
      }

      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from(userType)
          .update(dataToSave)
          .eq("id", editingUser.id);

        if (error) throw error;
        Alert.alert(
          "Success",
          `${
            userType === "students" ? "Student" : "Instructor"
          } updated successfully`
        );
      } else {
        // Create new user
        const { error } = await supabase.from(userType).insert([dataToSave]);

        if (error) throw error;
        Alert.alert(
          "Success",
          `${
            userType === "students" ? "Student" : "Instructor"
          } created successfully`
        );
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving user:", error);
      Alert.alert("Error", "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingUser ? "Edit" : "Create"}{" "}
            {userType === "students" ? "Student" : "Instructor"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Basic Info */}
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={formData.name || ""}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={formData.email || formData.student_email || ""}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                [userType === "students" ? "student_email" : "email"]: text,
              })
            }
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={formData.password || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, password: text })
            }
            secureTextEntry
          />

          {userType === "students" ? (
            <>
              {/* Instrument Selection */}
              <Text style={styles.fieldLabel}>Instrument</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowInstrumentModal(true)}
                >
                  <Text style={styles.pickerText}>
                    {formData.instrument || "Select Instrument"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Parent Information</Text>

              <TextInput
                style={styles.input}
                placeholder="Father's Name"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.father_email || ""}
                onChangeText={(text) =>
                  setFormData({ ...formData, father_email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Mother's Name"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.mother_email || ""}
                onChangeText={(text) =>
                  setFormData({ ...formData, mother_email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Father's Phone"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.father_phone || ""}
                onChangeText={(text) =>
                  setFormData({ ...formData, father_phone: text })
                }
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Mother's Phone"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.mother_phone || ""}
                onChangeText={(text) =>
                  setFormData({ ...formData, mother_phone: text })
                }
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Student Phone Number"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.student_phone_number || ""}
                onChangeText={(text) =>
                  setFormData({ ...formData, student_phone_number: text })
                }
                keyboardType="phone-pad"
              />

              <Text style={styles.sectionTitle}>Instructor Assignment</Text>

              {/* Online Instructor Selection */}
              <Text style={styles.fieldLabel}>Online Instructor</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => showInstructorPicker("online")}
                >
                  <Text style={styles.pickerText}>
                    {formData.online_instructor_name ||
                      "Select Online Instructor"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>

              {/* Theory Instructor Selection */}
              <Text style={styles.fieldLabel}>Theory Instructor</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => showInstructorPicker("theory")}
                >
                  <Text style={styles.pickerText}>
                    {formData.theory_instructor_name ||
                      "Select Theory Instructor"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>

              {/* In-Person Instructor Selection */}
              <Text style={styles.fieldLabel}>In-Person Instructor</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => showInstructorPicker("in_person")}
                >
                  <Text style={styles.pickerText}>
                    {formData.in_person_name || "Select In-Person Instructor"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>

              {/* Second In-Person Instructor Selection */}
              <Text style={styles.fieldLabel}>Second In-Person Instructor</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => showInstructorPicker("second_inperson")}
                >
                  <Text style={styles.pickerText}>
                    {formData.second_inperson_name ||
                      "Select Second In-Person Instructor"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Instructor Role Selection */}
              <Text style={styles.fieldLabel}>Instructor Role</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowInstructorRoleModal(true)}
                >
                  <Text style={styles.pickerText}>
                    {formData.role || "Select Instructor Role"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Phone"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.phone || ""}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
                keyboardType="phone-pad"
              />

              {/* Instructor Type Selection */}
              <Text style={styles.fieldLabel}>Instructor Type</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowInstructorTypeModal(true)}
                >
                  <Text style={styles.pickerText}>
                    {formData.type || "Select Instructor Type"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Instructor Selection Modal */}
      <Modal
        visible={showInstructorModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select{" "}
              {instructorType === "online"
                ? "Online"
                : instructorType === "theory"
                ? "Theory"
                : instructorType === "second_inperson"
                ? "Second In-Person"
                : "In-Person"}{" "}
              Instructor
            </Text>
            <TouchableOpacity onPress={() => setShowInstructorModal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {getFilteredInstructors().length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="school-outline"
                  size={64}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.emptyText}>
                  No{" "}
                  {instructorType === "online"
                    ? "online"
                    : instructorType === "theory"
                    ? "theory"
                    : "in-person"}{" "}
                  instructors available
                </Text>
              </View>
            ) : (
              getFilteredInstructors().map((instructor: Instructor) => (
                <TouchableOpacity
                  key={instructor.id}
                  style={styles.instructorCard}
                  onPress={() => selectInstructor(instructor)}
                >
                  <View style={styles.instructorAvatar}>
                    <Text style={styles.instructorInitial}>
                      {instructor.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.instructorInfo}>
                    <Text style={styles.instructorName}>{instructor.name}</Text>
                    <Text style={styles.instructorRole}>{instructor.role}</Text>
                    {instructor.type && (
                      <Text style={styles.instructorType}>
                        Type: {instructor.type}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Instrument Selection Modal */}
      <Modal
        visible={showInstrumentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Instrument</Text>
            <TouchableOpacity onPress={() => setShowInstrumentModal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {instruments.map((instrument) => (
              <TouchableOpacity
                key={instrument}
                style={styles.instrumentCard}
                onPress={() => selectInstrument(instrument)}
              >
                <View style={styles.instrumentIcon}>
                  <Ionicons
                    name={
                      instrument === "Piano"
                        ? "musical-notes"
                        : instrument === "Guitar"
                        ? "musical-note"
                        : "musical-notes"
                    }
                    size={24}
                    color="#1c463a"
                  />
                </View>
                <View style={styles.instrumentInfo}>
                  <Text style={styles.instrumentName}>{instrument}</Text>
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
      </Modal>

      {/* Instructor Role Selection Modal */}
      <Modal
        visible={showInstructorRoleModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Instructor Role</Text>
            <TouchableOpacity onPress={() => setShowInstructorRoleModal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {instructorRoles.map((role) => (
              <TouchableOpacity
                key={role}
                style={styles.instructorCard}
                onPress={() => selectInstructorRole(role)}
              >
                <View style={styles.instructorAvatar}>
                  <Ionicons
                    name={
                      role === "Online_Instructor"
                        ? "videocam"
                        : role === "Theory_Instructor"
                        ? "book"
                        : "person"
                    }
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.instructorInfo}>
                  <Text style={styles.instructorName}>
                    {role.replace("_", " ")}
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
      </Modal>

      {/* Instructor Type Selection Modal */}
      <Modal
        visible={showInstructorTypeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Instructor Type</Text>
            <TouchableOpacity onPress={() => setShowInstructorTypeModal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {instructorTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.instrumentCard}
                onPress={() => selectInstructorType(type)}
              >
                <View style={styles.instrumentIcon}>
                  <Ionicons
                    name={
                      type === "Piano"
                        ? "musical-notes"
                        : type === "Guitar"
                        ? "musical-note"
                        : type === "Violin"
                        ? "musical-notes"
                        : type === "Vocal"
                        ? "mic"
                        : "book"
                    }
                    size={24}
                    color="#1c463a"
                  />
                </View>
                <View style={styles.instrumentInfo}>
                  <Text style={styles.instrumentName}>{type}</Text>
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
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    padding: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 12,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "rgba(28,70,58,0.8)",
  },
  tabText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginLeft: 8,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1c463a",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  usersList: {
    flex: 1,
  },
  userCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1c463a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInitial: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 2,
  },
  userInstrument: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  userRole: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  userActions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  studentDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  instructorDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  contactText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginRight: 16,
    marginBottom: 4,
  },
  instructorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  instructorText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginRight: 16,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
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
  // Modal Styles
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
    paddingBottom: 40,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
    marginTop: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#1c463a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginLeft: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
    marginTop: 8,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  pickerText: {
    fontSize: 16,
    color: "#FFFFFF",
    flex: 1,
  },
  instructorCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    alignItems: "center",
  },
  instructorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1c463a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  instructorInitial: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  instructorRole: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 2,
  },
  instructorType: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  instrumentCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    alignItems: "center",
  },
  instrumentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(28,70,58,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  instrumentInfo: {
    flex: 1,
  },
  instrumentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
