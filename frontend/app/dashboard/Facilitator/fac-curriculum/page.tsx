"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Upload, FileText, Download, Trash2, Eye, Plus, Search, Loader2, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/lib/contexts/RoleContext";
import api from "@/lib/api";
import { Program as BackendProgram, Course as BackendCourse } from "@/types";

interface CurriculumFile {
  id: string;
  name: string;
  program: string;
  programId: string;
  uploadDate: string;
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';
  description?: string;
  contentUrl?: string;
}

export default function CurriculumPage() {
  const { role, loading: authLoading } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterProgram, setFilterProgram] = useState("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    programId: "",
    title: "",
    description: "",
  });

  const [curriculumFiles, setCurriculumFiles] = useState<CurriculumFile[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<BackendProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurriculumData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const programsRes = await api.get('/programs');
      const fetchedPrograms: BackendProgram[] = programsRes.data.data;
      setAvailablePrograms(fetchedPrograms);

      let allFetchedCourses: CurriculumFile[] = [];
      if (fetchedPrograms.length > 0) {
        const coursePromises = fetchedPrograms.map(program =>
          api.get(`/courses/program/${program._id}`).then(res => 
            res.data.data.map((course: BackendCourse) => ({
                id: course._id,
                name: course.title,
                program: program.name,
                programId: program._id,
                uploadDate: new Date(course.createdAt).toLocaleDateString(),
                status: course.status,
                description: course.description,
                contentUrl: course.contentUrl,
            }))
          )
        );
        const coursesByProgram = await Promise.all(coursePromises);
        allFetchedCourses = coursesByProgram.flat();
      }
      setCurriculumFiles(allFetchedCourses);

    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load curriculum data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (role === 'program_manager' || role === 'super_admin' || role === 'facilitator')) {
      fetchCurriculumData();
    }
  }, [authLoading, role, fetchCurriculumData]);

  const filteredFiles = curriculumFiles.filter((file) => {
    const matchesSearch = searchTerm === '' || file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = filterProgram === "all" || file.programId === filterProgram;
    return matchesSearch && matchesProgram;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.programId || !uploadData.title || !selectedFile) {
      toast.error("Please fill in all required fields and select a file.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('programId', uploadData.programId);
      formData.append('courseDocument', selectedFile);

      await api.post('/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success("Course content uploaded successfully!");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadData({ programId: "", title: "", description: "" });
      fetchCurriculumData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };
  
  if (authLoading || isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Curriculum Management</h1>
                <p className="text-muted-foreground">Upload and manage materials for your programs.</p>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)}><Plus className="mr-2 h-4 w-4"/>Upload New</Button>
        </div>

        <Card>
            <CardHeader><CardTitle>Filter & Search</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4">
                <Input placeholder="Search materials..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm"/>
                <Select value={filterProgram} onValueChange={setFilterProgram}>
                    <SelectTrigger className="w-64"><SelectValue placeholder="Filter by program" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {availablePrograms.map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Uploaded Materials</CardTitle></CardHeader>
            <CardContent>
                {filteredFiles.length === 0 ? <p className="text-center py-10 text-muted-foreground">No materials found.</p> :
                <div className="space-y-3">
                    {filteredFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <p className="font-semibold">{file.name}</p>
                                <p className="text-sm text-muted-foreground">{file.program} - Uploaded on {file.uploadDate}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{file.status}</Badge>
                                <a href={file.contentUrl} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon"><Download className="h-4 w-4"/></Button></a>
                            </div>
                        </div>
                    ))}
                </div>
                }
            </CardContent>
        </Card>

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Upload New Curriculum</DialogTitle></DialogHeader>
                <form onSubmit={handleUploadSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Program</Label>
                        <Select value={uploadData.programId} onValueChange={(v) => setUploadData(d => ({ ...d, programId: v }))} required>
                            <SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger>
                            <SelectContent>
                                {/* --- THIS IS THE FIX --- */}
                                {availablePrograms.length === 0 ? (
                                    <div className="text-center text-sm text-muted-foreground p-4">No programs found.</div>
                                ) : (
                                    availablePrograms.map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)
                                )}
                                {/* --- END OF FIX --- */}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2"><Label>Title</Label><Input value={uploadData.title} onChange={(e) => setUploadData(d => ({ ...d, title: e.target.value }))} required/></div>
                    <div className="space-y-2"><Label>Description</Label><Textarea value={uploadData.description} onChange={(e) => setUploadData(d => ({ ...d, description: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>File</Label><Input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} required/></div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isUploading}>{isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Upload</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}