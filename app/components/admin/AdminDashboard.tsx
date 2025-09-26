/**
 * DEPRECATED: This file has been replaced by proper routing
 * 
 * AdminDashboard functionality has been moved to:
 * - Dashboard content: /app/admin/index.tsx
 * - Navigation layout: /app/admin/_layout.tsx  
 * - Individual screens: /app/admin/users.tsx, /app/admin/files.tsx, etc.
 * 
 * This file can be safely deleted after confirming no imports remain.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        This component has been deprecated. Admin functionality moved to /admin routes.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    padding: 20,
  },
});
