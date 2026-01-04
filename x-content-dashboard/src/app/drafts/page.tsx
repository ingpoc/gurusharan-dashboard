"use client";

import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { DraftsList } from "@/components/dashboard/DraftsList";

export default function DraftsPage() {
  return (
    <MainLayout title="Drafts">
      <Card>
        <CardHeader>
          <CardTitle>Drafts</CardTitle>
          <CardDescription>Manage your content drafts</CardDescription>
        </CardHeader>
        <DraftsList />
      </Card>
    </MainLayout>
  );
}
