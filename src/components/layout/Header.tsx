"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";

interface HeaderProps {
  title?: string;
  showMobileMenu?: boolean;
  onMobileMenuClick?: () => void;
}

export function Header({ title = "Dashboard", showMobileMenu = true, onMobileMenuClick }: HeaderProps) {
  return (
    <motion.header
      {...fadeIn}
      style={{
        height: "64px",
        borderBottom: "1px solid var(--border)",
        background: "var(--background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Mobile menu button */}
        {showMobileMenu && (
          <button
            onClick={onMobileMenuClick}
            style={{
              display: "none",
              background: "none",
              border: "none",
              padding: "0.5rem",
              cursor: "pointer",
              color: "var(--foreground)",
            }}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 500,
            color: "var(--foreground)",
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Connection status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            background: "var(--card-bg)",
            borderRadius: "6px",
            fontSize: "0.875rem",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          <span style={{ color: "var(--muted)" }}>Connected</span>
        </div>

        {/* User avatar placeholder */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 500,
            fontSize: "0.875rem",
          }}
        >
          T
        </div>
      </div>
    </motion.header>
  );
}
