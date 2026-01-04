"use client";

import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";

export default function DraftsPage() {
  return (
    <MainLayout title="Drafts">
      <Card>
        <CardHeader>
          <CardTitle>Drafts</CardTitle>
          <CardDescription>Manage your content drafts</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
            }}
          >
            <p style={{ color: "var(--muted)" }}>No drafts yet</p>
            <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
              Start a chat to create your first draft
            </p>
            <Button style={{ marginTop: "1rem" }}>Go to Chat</Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
