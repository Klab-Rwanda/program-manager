"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle } from "lucide-react";
import { Ticket } from "@/types/index";

interface Props {
  open: boolean;
  ticket: Ticket | null;
  onClose: () => void;
  newComment: string;
  onCommentChange: (value: string) => void;
  onCommentSubmit: () => void;
  resolutionText: string;
  onResolutionChange: (value: string) => void;
  onResolve: () => void;
}

export default function ViewTicketModal({
  open,
  ticket,
  onClose,
  newComment,
  onCommentChange,
  onCommentSubmit,
  resolutionText,
  onResolutionChange,
  onResolve,
}: Props) {
  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket.title}</DialogTitle>
          <DialogDescription>
            Ticket #{ticket._id.slice(0, 6)} • {ticket.category}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Comments Section */}
          <div>
            <Label>Comments</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border p-2 rounded">
              {ticket.comments.length === 0 ? (
                <p className="text-muted-foreground">No comments yet.</p>
              ) : (
                ticket.comments.map((comment) => (
                  <div key={comment._id} className="border-b pb-1">
                    <p className="text-xs font-semibold">{comment.author}:</p>
                    <p className="text-sm whitespace-pre-line">{comment.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* New Comment */}
          <div className="mt-4">
            <Label htmlFor="newComment">Add Reply</Label>
            <textarea
              id="newComment"
              value={newComment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Write your reply here..."
              rows={3}
              className="w-full rounded border p-2"
            />

            <div className="mt-4">
              <Label htmlFor="resolutionText">Resolution</Label>
              <textarea
                id="resolutionText"
                value={resolutionText}
                onChange={(e) => onResolutionChange(e.target.value)}
                placeholder="Describe how the issue was resolved..."
                rows={3}
                className="w-full rounded border p-2"
              />
            </div>

            <div className="flex space-x-2 mt-2">
              <Button variant="outline" size="sm" onClick={onCommentSubmit} disabled={!newComment.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Reply
              </Button>

              <Button variant="outline" size="sm" onClick={onResolve} disabled={!resolutionText.trim()}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
