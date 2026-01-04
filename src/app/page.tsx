"use client";

import { motion } from "framer-motion";
import { slideUp, staggerContainer, staggerItem } from "@/lib/animations";

export default function Home() {
  return (
    <main className="container" style={{ paddingTop: "4rem" }}>
      <motion.div {...slideUp}>
        <h1 style={{ marginBottom: "0.5rem" }}>X Content Dashboard</h1>
        <p style={{ fontSize: "1.125rem", maxWidth: "600px" }}>
          AI-powered content creation for @techtrends3107
        </p>
      </motion.div>

      <motion.div
        {...staggerContainer}
        initial="initial"
        animate="animate"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginTop: "3rem",
        }}
      >
        {[
          {
            title: "Chat with Claude",
            description: "Create content through natural conversation",
          },
          {
            title: "Research Topics",
            description: "AI-powered trend analysis for your niche",
          },
          {
            title: "Post to X",
            description: "Publish directly to your account",
          },
        ].map((card, index) => (
          <motion.div
            key={index}
            variants={staggerItem}
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            style={{
              background: "var(--card-bg)",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            <h3 style={{ marginBottom: "0.5rem" }}>{card.title}</h3>
            <p style={{ marginBottom: 0 }}>{card.description}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ marginTop: "3rem" }}
      >
        <button
          style={{
            background: "var(--accent)",
            color: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "6px",
            border: "none",
            fontSize: "1rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Get Started
        </button>
      </motion.div>
    </main>
  );
}
