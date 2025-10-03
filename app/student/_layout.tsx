import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { useAuth } from "../components/login/AuthContext";
import { StudentTopBar } from "../components/student/StudentTopBar";
import { StudentNavigation } from "../components/student/StudentNavigation";
import StudentBackground from "../components/student/StudentBackground";
import StudentDashboard from "./index";

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>();

  useEffect(() => {
    // Redirect if not student
    if (!user || user.userType !== "student") {
      router.replace("/");
      return;
    }

    setStudentData(user);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const handleTabChange = (tab: string, fileId?: string) => {
    setActiveTab(tab);
    if (fileId) {
      setSelectedFileId(fileId);
    } else {
      setSelectedFileId(undefined);
    }
  };

  if (!studentData) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StudentBackground />
      <StudentTopBar
        studentName={studentData.name || "Student"}
        instrument={studentData.instrument || "Music Student"}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <StudentNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      <View style={styles.contentContainer}>
        <StudentDashboard 
          activeTab={activeTab} 
          selectedFileId={selectedFileId}
          onTabChange={handleTabChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  contentContainer: {
    flex: 1,
  },
});
