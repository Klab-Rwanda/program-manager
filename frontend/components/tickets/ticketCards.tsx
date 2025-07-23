"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, Clock, Eye, Edit, Send } from "lucide-react";
import { getCategoryIcon, getPriorityBadge, getStatusBadge } from "@/lib/ticket.utils";
import { Ticket } from "@/types/index";

interface TicketCardProps {
  ticket: Ticket;
  onView: () => void;
}

export default function TicketCard({ ticket, onView }: TicketCardProps) {
  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getCategoryIcon(ticket.category)}
            <div>
              <CardTitle className="text-lg">{ticket.title}</CardTitle>
              <CardDescription>
                #{ticket._id.slice(0, 6)} • {ticket.category}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">{ticket.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Created by: {ticket.createdBy || "Unknown"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
          </div>
          {ticket.dueDate && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Due: {new Date(ticket.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="flex space-x-2 mt-4">
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Send className="h-4 w-4 mr-2" />
            Reply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
