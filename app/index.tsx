import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "./components/login/AuthContext";
import LoginScreen from "./components/login/LoginScreen";
import UserDashboard from "./components/dashboard/UserDashboard";
import { router } from "expo-router";

function AppContent() {
  const { isLoggedIn, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoggedIn && user?.userType === 'admin') {
      router.replace('/admin' as any);
    }
  }, [isLoggedIn, user]);

  // Show loading spinner while checking authentication status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => {}} />;
  }

  // If admin, don't render anything here as we're routing to /admin
  if (user?.userType === 'admin') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // Show user dashboard for students and instructors
  return <UserDashboard />;
}

export default function Index() {
  return <AppContent />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: 'center',
    alignItems: 'center',
  },
});
