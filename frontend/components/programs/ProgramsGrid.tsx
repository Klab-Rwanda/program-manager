"use client"; // This component uses event handlers (onClick), so it MUST be a client component.

import React from 'react';
import { Program } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Edit, Trash2, Archive, Send, Check, X } from "lucide-react";

interface ProgramsGridProps {
  programs: Program[];
  userRole?: string;
  onApprove: (id: string) => void;
  onReject: (program: Program) => void;
  handleOpenModal: (program: Program | null) => void;
  setProgramToDelete: (program: Program | null) => void;
  handleArchive: (program: Program) => void;
  handleRequestApproval: (program: Program) => void;
}

export function ProgramsGrid({ 
  programs, 
  userRole, 
  onApprove, 
  onReject, 
  handleOpenModal, 
  setProgramToDelete, 
  handleArchive, 
  handleRequestApproval 
}: ProgramsGridProps) {
  
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800";
      case "draft": return "bg-gray-200 text-gray-800";
      case "pendingapproval": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (programs.length === 0) {
    return (
      <div className="text-center py-12 col-span-full">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No programs found in this category.</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programs.map((program) => (
        <Card key={program._id} className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="pr-2">{program.name}</CardTitle>
              <Badge className={`capitalize whitespace-nowrap ${getStatusColor(program.status)}`}>{program.status}</Badge>
            </div>
            <CardDescription className="line-clamp-2 h-10">{program.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-2">
            <p className="text-sm text-muted-foreground">Trainees: {program.trainees?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Facilitators: {program.facilitators?.length || 0}</p>
          </CardContent>
          <div className="p-4 border-t flex flex-wrap gap-2">
            {(userRole === 'SuperAdmin' || userRole === 'Program Manager') && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleOpenModal(program)}><Edit className="h-3 w-3 mr-1"/> Edit</Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setProgramToDelete(program)}><Trash2 className="h-3 w-3 mr-1"/> Delete</Button>
                <Button variant="outline" size="sm" onClick={() => handleArchive(program)}><Archive className="h-3 w-3 mr-1"/> Archive</Button>
              </>
            )}
            {userRole === 'Program Manager' && program.status === 'Draft' && <Button size="sm" onClick={() => handleRequestApproval(program)} className="bg-[#1f497d] hover:bg-[#1a3f6b]"><Send className="h-3 w-3 mr-1"/> Submit</Button>}
            {userRole === 'SuperAdmin' && program.status === 'PendingApproval' && (
              <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onApprove(program._id)}><Check className="h-4 w-4 mr-1"/> Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => onReject(program)}><X className="h-4 w-4 mr-1"/> Reject</Button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};