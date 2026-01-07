"use client";

import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { PostsList } from "@/components/dashboard/PostsList";

export default function PostsPage() {
  return (
    <MainLayout title="Posts">
      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>Your tweeted content</CardDescription>
        </CardHeader>
        <PostsList />
      </Card>
    </MainLayout>
  );
}
