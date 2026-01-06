"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import { slideInLeft } from "@/lib/animations";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface Stats {
  postsToday: number;
  postsRemaining: number;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Chat",
    href: "/chat",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Drafts",
    href: "/drafts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

/**
 * DRAMS Sidebar Component
 *
 * Dieter Rams Principles:
 * - Understandable: Active indicator, clear navigation
 * - Unobtrusive: Smooth width transition
 * - Thorough: Keyboard navigation, tooltips on collapse
 */
export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [stats, setStats] = useState<Stats>({ postsToday: 0, postsRemaining: 17 });
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Find active index
  const activeIndex = navItems.findIndex((item) => item.href === pathname);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          const nextIndex = (index + 1) % navItems.length;
          navRefs.current[nextIndex]?.focus();
          setFocusedIndex(nextIndex);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          const prevIndex = (index - 1 + navItems.length) % navItems.length;
          navRefs.current[prevIndex]?.focus();
          setFocusedIndex(prevIndex);
          break;
        case 'Home':
          e.preventDefault();
          navRefs.current[0]?.focus();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          navRefs.current[navItems.length - 1]?.focus();
          setFocusedIndex(navItems.length - 1);
          break;
      }
    },
    []
  );

  // Reset focused index when pathname changes
  useEffect(() => {
    setFocusedIndex(activeIndex);
  }, [activeIndex]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats({ postsToday: data.postsToday, postsRemaining: data.postsRemaining });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <motion.aside
      {...slideInLeft}
      className={`
        flex flex-col min-h-screen border-r transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-60'}
        border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-950
      `}
    >
      {/* Logo */}
      <div className="p-6 mb-8">
        {!isCollapsed ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              X Content
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-0">
              @techtrends3107
            </p>
          </>
        ) : (
          <div className="w-6 h-6 bg-slate-900 dark:bg-slate-50 rounded mx-auto" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1" role="navigation" aria-label="Main navigation">
        <ul className="list-none p-0 m-0 space-y-1" role="listbox">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} role="none" className="relative group">
                <Link
                  ref={(el) => { navRefs.current[index] = el; }}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    relative
                    transition-all duration-200
                    ${isActive
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-50'
                    }
                    ${focusedIndex === index ? 'outline-2 outline-offset-2 outline-slate-400 dark:outline-slate-600' : ''}
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                >
                  {/* Active indicator - subtle left border */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-slate-900 dark:bg-slate-50 rounded-r-full" />
                  )}

                  <span aria-hidden="true">{item.icon}</span>

                  {/* Label - hide when collapsed */}
                  <span
                    className={`text-sm font-medium transition-opacity duration-200 ${
                      isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Screen reader only label */}
                  {isCollapsed && (
                    <span className="sr-only">{item.label}</span>
                  )}
                </Link>

                {/* Visual tooltip when collapsed */}
                {isCollapsed && (
                  <div
                    className={`
                      absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1
                      bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900
                      text-xs font-medium rounded shadow-lg whitespace-nowrap
                      opacity-0 group-hover:opacity-100 pointer-events-none
                      transition-opacity duration-200 z-50
                      ${focusedIndex === index ? 'opacity-100' : ''}
                    `}
                    role="tooltip"
                  >
                    {item.label}
                    {/* Tooltip arrow */}
                    <span
                      className="absolute top-1/2 -translate-y-1/2 -left-1 w-0 h-0
                        border-t-4 border-t-transparent
                        border-r-4 border-r-slate-900 dark:border-r-slate-50
                        border-b-4 border-b-transparent"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`
          m-4 p-2 rounded-lg
          border border-slate-200 dark:border-slate-700
          hover:bg-slate-50 dark:hover:bg-slate-900
          transition-all duration-200
          ${isCollapsed ? 'mx-auto' : 'ml-auto'}
        `}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={isCollapsed}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Rate limit indicator */}
      <div
        className={`
          p-4 m-4 rounded-lg border transition-opacity duration-200
          ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          bg-slate-50 dark:bg-slate-900
          border-slate-200 dark:border-slate-700
        `}
        aria-hidden={isCollapsed}
      >
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
          Posts today
        </p>
        <p className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-0">
          {stats.postsToday} / {stats.postsToday + stats.postsRemaining}
        </p>
      </div>
    </motion.aside>
  );
}
