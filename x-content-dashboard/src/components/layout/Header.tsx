"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  title?: string;
  showMobileMenu?: boolean;
  onMobileMenuClick?: () => void;
  breadcrumbs?: { label: string; href?: string }[];
  sidebarOpen?: boolean;
}

/**
 * DRAMS Header Component
 *
 * Dieter Rams Principles:
 * - Understandable: Breadcrumb navigation
 * - Thorough: User menu with proper ARIA
 * - Useful: Notification indicator
 */
export function Header({
  title = "Dashboard",
  showMobileMenu = true,
  onMobileMenuClick,
  breadcrumbs,
  sidebarOpen = false,
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserMenuClick = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <motion.header
      {...fadeIn}
      className="
        h-16 border-b bg-white dark:bg-slate-950
        flex items-center justify-between px-6
        border-slate-200 dark:border-slate-700
      "
    >
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        {showMobileMenu && (
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={sidebarOpen}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-2" aria-label="Breadcrumb">
          {breadcrumbs ? (
            <>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-slate-400 dark:text-slate-600"
                    >
                      <polyline points="9 18 15 12 9 6" />
                  </svg>
                  )}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {crumb.label}
                    </span>
                  )}
                </div>
              ))}
            </>
          ) : (
            <h1 className="text-xl font-medium text-slate-900 dark:text-slate-50 m-0">
              {title}
            </h1>
          )}
        </nav>

        {/* Title for mobile */}
        {breadcrumbs && (
          <h1 className="text-lg font-medium text-slate-900 dark:text-slate-50 sm:hidden m-0">
            {breadcrumbs[breadcrumbs.length - 1]?.label || title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          aria-label="View notifications"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-600 dark:text-slate-400"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {/* Notification indicator */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" aria-hidden="true">
            <span className="sr-only">New notifications</span>
          </span>
        </button>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={handleUserMenuClick}
            className="flex items-center gap-3 p-1.5 pr-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            aria-label="User menu"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-50 flex items-center justify-center text-white dark:text-slate-900 text-sm font-medium"
            >
              T
            </div>

            {/* Username */}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50 m-0">
                Tech Trends
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 m-0">
                @techtrends3107
              </p>
            </div>

            {/* Chevron */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`text-slate-400 dark:text-slate-600 transition-transform ${
                userMenuOpen ? "rotate-180" : ""
              }`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-2 z-50"
              role="menu"
            >
              <a
                href="/settings"
                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                role="menuitem"
              >
                Settings
              </a>
              <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
              <a
                href="/api/auth/x/logout"
                className="block px-4 py-2 text-sm text-error hover:bg-error-bg transition-colors"
                role="menuitem"
              >
                Disconnect
              </a>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
