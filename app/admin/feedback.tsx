import React from "react";
import { FeedbackViewScreen } from "../components/admin/FeedbackViewScreen";
import { router } from "expo-router";

export default function FeedbackPage() {
  return <FeedbackViewScreen onBack={() => router.back()} />;
}
