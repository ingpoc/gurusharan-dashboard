"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export function AutonomousSettings() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setEnabled(data.autonomousEnabled ?? false);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = async (value: boolean) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autonomousEnabled: value }),
      });
      if (res.ok) {
        setEnabled(value);
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Autonomous Mode</CardTitle>
        <CardDescription>
          Enable AI-powered content creation workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
              Enable autonomous workflow
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
              When enabled, the system will automatically research, draft, and post content
            </p>
          </div>
          <button
            onClick={() => handleToggle(!enabled)}
            disabled={loading || saving}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-400
              focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
              ${enabled ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}
            `}
            role="switch"
            aria-checked={enabled}
          >
            <span
              aria-hidden="true"
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                transition duration-200 ease-in-out
                ${enabled ? "translate-x-5" : "translate-x-0"}
              `}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
