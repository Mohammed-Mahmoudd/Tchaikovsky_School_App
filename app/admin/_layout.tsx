import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { useAuth } from "../components/login/AuthContext";
import { AdminTopBar } from "../components/admin/AdminTopBar";
import AdminBackground from "../components/admin/AdminBackground";

export default function AdminLayout() {
  const { user, logout, isLoading, isLoggedIn } = useAuth();

  // Redirect non-admin users back to main app
  useEffect(() => {
    if (!isLoading && (!isLoggedIn || user?.userType !== 'admin')) {
      router.replace('/' as any);
    }
  }, [isLoading, isLoggedIn, user]);

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <AdminBackground />
        {/* You could add a loading spinner here if needed */}
      </View>
    );
  }

  // Don't render admin layout for non-admin users
  if (!isLoggedIn || user?.userType !== 'admin') {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <AdminBackground />
        {/* Redirecting... */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminBackground />
      <AdminTopBar adminName={user?.name || "Admin"} onLogout={logout} />
      <View style={styles.contentContainer}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
