"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--background)",
      }}
    >
      {/* Desktop Sidebar */}
      <div className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 40,
          }}
          onClick={() => setSidebarOpen(false)}
          className="mobile-overlay"
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className="mobile-sidebar"
        style={{
          position: "fixed",
          left: sidebarOpen ? 0 : "-240px",
          top: 0,
          zIndex: 50,
          transition: "left 0.3s ease",
        }}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Header
          title={title}
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main
          style={{
            flex: 1,
            padding: "1.5rem",
            maxWidth: "var(--max-width)",
            width: "100%",
            margin: "0 auto",
          }}
        >
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-sidebar,
          .mobile-overlay {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
