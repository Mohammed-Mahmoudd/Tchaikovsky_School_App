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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../supabase.js";
import { Student, Instructor } from "../../services/authService";

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

  useEffect(() => {
    loadUsers();
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
            Students ({students.length})
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
            Instructors ({instructors.length})
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
        onClose={() => {
          setShowCreateModal(false);
          setEditingUser(null);
        }}
        onSuccess={() => {
          setShowCreateModal(false);
          setEditingUser(null);
          loadUsers();
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
  onClose,
  onSuccess,
}: any) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setFormData(editingUser);
    } else {
      setFormData({});
    }
  }, [editingUser]);

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert("Error", "Name and email are required");
      return;
    }

    setLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from(userType)
          .update(formData)
          .eq("id", editingUser.id);

        if (error) throw error;
        Alert.alert("Success", "User updated successfully");
      } else {
        // Create new user
        const { error } = await supabase.from(userType).insert([formData]);

        if (error) throw error;
        Alert.alert("Success", "User created successfully");
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
              <TextInput
                style={styles.input}
                placeholder="Instrument"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.instrument || ""}
                onChangeText={(text) =>
                  setFormData({ ...formData, instrument: text })
                }
              />

              <Text style={styles.sectionTitle}>Parent Information</Text>

              <TextInput
                style={styles.input}
                placeholder="Father's Email"
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
                placeholder="Mother's Email"
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
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Role"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.role || ""}
                onChangeText={(text) =>
                  setFormData({ ...formData, role: text })
                }
              />

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

              <TextInput
                style={styles.input}
                placeholder="Type"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.type || ""}
                onChangeText={(text) =>
                  setFormData({ ...formData, type: text })
                }
              />
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
});
