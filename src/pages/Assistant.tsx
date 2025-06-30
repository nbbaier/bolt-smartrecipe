import React from "react";
import { AIChat } from "../components/ai/AIChat";

export function Assistant() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">
          AI Cooking Assistant
        </h1>
        <p className="text-sm sm:text-base text-secondary-600">
          Get personalized recipe suggestions and cooking advice powered by AI
        </p>
      </div>

      <AIChat />
    </div>
  );
}
