"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";

interface TicketTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  ticketStats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  children: React.ReactNode;
    
}

export default function TicketTabs({
  activeTab,
  setActiveTab,
  ticketStats,
  children,
}: TicketTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="open">Open ({ticketStats.open})</TabsTrigger>
        <TabsTrigger value="in_progress">In Progress ({ticketStats.inProgress})</TabsTrigger>
        <TabsTrigger value="resolved">Resolved ({ticketStats.resolved})</TabsTrigger>
        <TabsTrigger value="all">All ({ticketStats.total})</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab}>{children}</TabsContent>
    </Tabs>
  );
}
