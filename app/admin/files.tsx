import React from "react";
import { FileManagementScreen } from "../components/admin/FileManagementScreen";
import { router } from "expo-router";

export default function FilesPage() {
  return <FileManagementScreen onBack={() => router.back()} />;
}
