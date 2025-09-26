import React from "react";
import { SystemSettingsScreen } from "../components/admin/SystemSettingsScreen";
import { router } from "expo-router";

export default function SettingsPage() {
  return <SystemSettingsScreen onBack={() => router.back()} />;
}
