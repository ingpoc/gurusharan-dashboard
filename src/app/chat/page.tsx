"use client";

import { MainLayout } from "@/components/layout";
import { ChatPanel, Message } from "@/components/chat";
import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSendMessage = async (content: string) => {
    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: "I'm ready to help you create content for @techtrends3107! Try asking me to:\n\n• Research trending AI topics\n• Draft a post about a specific subject\n• Schedule content for later",
          timestamp: new Date(),
        },
      ]);
    }, 500);
  };

  return (
    <MainLayout title="Chat">
      <div
        style={{
          height: "calc(100vh - 64px - 3rem)",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <ChatPanel onSendMessage={handleSendMessage} initialMessages={messages} />
      </div>
    </MainLayout>
  );
}
