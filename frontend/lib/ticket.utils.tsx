// lib/ticket-utils.ts

import { Badge } from "@/components/ui/badge";
import { Server, Monitor, Wrench, Tag } from "lucide-react";
import React from "react";

export function getStatusBadge(status?: string) {
  const safeStatus = (status || "unknown").toLowerCase();

  switch (safeStatus) {
    case "open":
      return <Badge className="bg-red-100 text-red-800">Open</Badge>;
    case "in_progress":
      return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
    case "resolved":
      return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
    case "closed":
      return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
    default:
      return <Badge variant="secondary">{status || "Unknown"}</Badge>;
  }
}

export function getPriorityBadge(priority?: string) {
  const safePriority = (priority || "unknown").toLowerCase();

  switch (safePriority) {
    case "high":
      return <Badge className="bg-red-100 text-red-800">High</Badge>;
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    case "low":
      return <Badge className="bg-green-100 text-green-800">Low</Badge>;
    default:
      return <Badge variant="secondary">{priority || "Unknown"}</Badge>;
  }
}


export function getCategoryIcon(category?: string) {
  const safeCategory = (category || "unknown").toLowerCase();

  switch (safeCategory) {
    case "hardware":
      return <Server className="h-4 w-4" />;
    case "software":
      return <Monitor className="h-4 w-4" />;
    case "network":
      return <Wrench className="h-4 w-4" />;
    default:
      return <Tag className="h-4 w-4" />;
  }
}

