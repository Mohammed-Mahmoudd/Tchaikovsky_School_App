import React from "react";
import { UserManagementScreen } from "../components/admin/UserManagementScreen";
import { router } from "expo-router";

export default function UsersPage() {
  return <UserManagementScreen onBack={() => router.back()} />;
}
