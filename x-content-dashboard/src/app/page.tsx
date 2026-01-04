"use client";

import { MainLayout } from "@/components/layout";
import { SummaryView } from "@/components/dashboard";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import Link from "next/link";

export default function Home() {
  return (
    <MainLayout title="Dashboard">
      {/* Summary Stats */}
      <div style={{ marginBottom: "2rem" }}>
        <SummaryView />
      </div>

      {/* Quick Actions */}
      <h2
        style={{
          fontSize: "1.125rem",
          fontWeight: 500,
          marginBottom: "1rem",
          color: "var(--foreground)",
        }}
      >
        Quick Actions
      </h2>
      <motion.div
        {...staggerContainer}
        initial="initial"
        animate="animate"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {[
          {
            title: "Chat with Claude",
            description: "Create content through natural conversation",
            href: "/chat",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            ),
          },
          {
            title: "Manage Drafts",
            description: "Review and schedule your content",
            href: "/drafts",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            ),
          },
          {
            title: "Configure Persona",
            description: "Customize your AI content style",
            href: "/settings",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            ),
          },
        ].map((card, index) => (
          <Link key={index} href={card.href} style={{ textDecoration: "none" }}>
            <motion.div
              variants={staggerItem}
              whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              style={{
                background: "var(--card-bg)",
                padding: "1.5rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                cursor: "pointer",
                height: "100%",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: "rgba(255, 97, 26, 0.1)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                {card.icon}
              </div>
              <h3 style={{ marginBottom: "0.5rem", color: "var(--foreground)" }}>{card.title}</h3>
              <p style={{ marginBottom: 0, fontSize: "0.9375rem" }}>{card.description}</p>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </MainLayout>
  );
}
