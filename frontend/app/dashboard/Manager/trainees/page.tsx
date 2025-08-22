"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, BookOpen, Eye, Edit, Trash2, GraduationCap, Loader2, UserPlus, FileUp, MinusCircle, CheckCircle, XCircle, Grid, List, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

import { getAllTrainees, createTrainee, assignTraineeToProgram, bulkRegisterUsers, unenrollTraineeFromProgram } from "@/lib/services/user.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { Program, Trainee } from "@/types";
import { useAuth } from "@/lib/contexts/RoleContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const initialTraineeData = { name: "", email: "" };

// Interface for trainee data parsed from Excel
interface ParsedTraineeData {
  name: string;
  email: string;
  gender?: string;
  phone?: string;
  _id?: string;
  selected?: boolean;
  errors?: string[];
}

type ViewMode = 'cards' | 'list' | 'table' | 'programs';

const TraineesPage: React.FC = () => {
  const { user, role } = useAuth();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterProgram, setFilterProgram] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [isUnenrollConfirmOpen, setUnenrollConfirmOpen] = useState(false);
  const [traineeToUnenroll, setTraineeToUnenroll] = useState<Trainee | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [programToAssign, setProgramToAssign] = useState<string>("");
  const [newTraineeData, setNewTraineeData] = useState(initialTraineeData);

  // States for Bulk Upload
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedTrainees, setParsedTrainees] = useState<ParsedTraineeData[]>([]);
  const [bulkRegistering, setBulkRegistering] = useState(false);
  const [selectedParsedTraineeIds, setSelectedParsedTraineeIds] = useState<string[]>([]);
  const [bulkRegisterResults, setBulkRegisterResults] = useState<{
    successful: number;
    failed: number;
    totalProcessed: number;
    errors: { row: number; message: string; data: any; }[];
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [traineeData, programData] = await Promise.all([
        getAllTrainees(),
        getAllPrograms()
      ]);
      setTrainees(traineeData);
      setPrograms(programData);
    } catch (err) {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleCreateTrainee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createTrainee(newTraineeData);
      toast.success("Trainee created successfully! Credentials sent via email.");
      setCreateModalOpen(false);
      setNewTraineeData(initialTraineeData);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create trainee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignProgram = async () => {
    if (!selectedTrainee || !programToAssign) {
      toast.error("Please select a program to assign.");
      return;
    }
    setIsSubmitting(true);
    try {
      await assignTraineeToProgram(programToAssign, selectedTrainee._id);
      toast.success(`${selectedTrainee.name} has been enrolled in the program.`);
      setAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign program.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnenrollTrainee = async () => {
    if (!traineeToUnenroll || !programToAssign) {
      toast.error("Invalid trainee or program selected for unenrollment.");
      return;
    }
    setIsSubmitting(true);
    try {
      await unenrollTraineeFromProgram(programToAssign, traineeToUnenroll._id);
      toast.success(`${traineeToUnenroll.name} has been unenrolled from program "${programs.find(p => p._id === programToAssign)?.name || 'Unknown'}".`);
      setUnenrollConfirmOpen(false);
      setTraineeToUnenroll(null);
      setProgramToAssign("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unenroll trainee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignModal = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    const firstAssignedProgram = programs.find(p => p.trainees?.some(t => t._id === trainee._id));
    if (firstAssignedProgram) {
      setProgramToAssign(firstAssignedProgram._id);
    } else if (programs.length > 0) {
      setProgramToAssign(programs[0]._id);
    } else {
      setProgramToAssign("");
    }
    setAssignModalOpen(true);
  };

  const openUnenrollConfirm = (trainee: Trainee, programId: string) => {
    setTraineeToUnenroll(trainee);
    setProgramToAssign(programId);
    setUnenrollConfirmOpen(true);
  };

  const filteredTrainees = trainees.filter(trainee => {
    const matchesSearch = trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) || trainee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const traineePrograms = programs.filter(p => p.trainees?.some(t => t._id === trainee._id));
    const matchesProgram = filterProgram === 'all' || traineePrograms.some(p => p._id === filterProgram);
    return matchesSearch && matchesProgram;
  });

  // Get trainee's programs
  const getTraineePrograms = (traineeId: string) => {
    return programs.filter(p => p.trainees?.some(t => t._id === traineeId));
  };

  // Group trainees by program for program view
  const getTraineesByProgram = () => {
    const result: { [key: string]: { program: Program; trainees: Trainee[] } } = {};
    
    programs.forEach(program => {
      const programTrainees = trainees.filter(trainee => 
        program.trainees?.some(t => t._id === trainee._id) &&
        (searchTerm === '' || 
         trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         trainee.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      if (programTrainees.length > 0) {
        result[program._id] = { program, trainees: programTrainees };
      }
    });

    // Add unassigned trainees
    const unassignedTrainees = trainees.filter(trainee => 
      !programs.some(p => p.trainees?.some(t => t._id === trainee._id)) &&
      (searchTerm === '' || 
       trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       trainee.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (unassignedTrainees.length > 0) {
      result['unassigned'] = { 
        program: { _id: 'unassigned', name: 'Unassigned Trainees' } as Program, 
        trainees: unassignedTrainees 
      };
    }

    return result;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Excel file handling functions (keeping all the existing bulk upload logic)
  const handleExcelFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setExcelFile(event.target.files[0]);
      setParsedTrainees([]);
      setBulkRegisterResults(null);
      setSelectedParsedTraineeIds([]);
    }
  };

  const parseExcelFile = () => {
    if (!excelFile) {
      toast.error("Please select an Excel or CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

        if (rawData.length < 2) {
          toast.error("The file is empty or contains only headers.");
          setParsedTrainees([]);
          return;
        }

        const headers = rawData[0].map(h => h?.trim());
        const requiredHeaders = ['Name', 'Email'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          toast.error(`Missing required headers: ${missingHeaders.join(', ')}. Please ensure your file has 'Name' and 'Email' columns.`);
          setParsedTrainees([]);
          return;
        }

        const emailColIndex = headers.indexOf('Email');
        const nameColIndex = headers.indexOf('Name');
        const genderColIndex = headers.indexOf('Gender');
        const phoneColIndex = headers.indexOf('Phone');

        const parsed: ParsedTraineeData[] = rawData.slice(1).map((row, index) => {
          const errors: string[] = [];
          const name = row[nameColIndex]?.trim() || '';
          const email = row[emailColIndex]?.trim()?.toLowerCase() || '';

          if (!name) errors.push('Name is missing.');
          if (!email) errors.push('Email is missing.');
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format.');

          const tempId = email || `temp-${index}-${Date.now()}`; 

          return {
            _id: tempId,
            name,
            email,
            gender: genderColIndex !== -1 && row[genderColIndex] ? row[genderColIndex]?.trim() : undefined,
            phone: phoneColIndex !== -1 && row[phoneColIndex] ? row[phoneColIndex]?.trim() : undefined,
            errors: errors.length > 0 ? errors : undefined,
            selected: errors.length === 0
          };
        });

        setParsedTrainees(parsed);
        setSelectedParsedTraineeIds(parsed.filter(t => !t.errors).map(t => t._id!));

        toast.success(`Successfully parsed ${parsed.length} rows.`);

      } catch (readError: any) {
        toast.error(`Error parsing file: ${readError.message}. Ensure it's a valid Excel/CSV format.`);
        setParsedTrainees([]);
      }
    };
    reader.readAsBinaryString(excelFile);
  };

  const handleBulkRegister = async () => {
    if (selectedParsedTraineeIds.length === 0) {
      toast.error("Please select trainees to register.");
      return;
    }

    const traineesToRegister = parsedTrainees.filter(t => selectedParsedTraineeIds.includes(t._id!));
    if (traineesToRegister.some(t => t.errors && t.errors.length > 0)) {
      toast.error("Cannot register trainees with errors. Please fix or deselect them.");
      return;
    }

    if (!excelFile) {
      toast.error("File missing. Please re-upload.");
      return;
    }

    setBulkRegistering(true);
    setBulkRegisterResults(null);

    try {
      const results = await bulkRegisterUsers(excelFile, 'Trainee');
      
      setBulkRegisterResults(results);
      if (results.successful > 0) {
        toast.success(`Successfully registered ${results.successful} trainees.`);
      }
      if (results.failed > 0) {
        toast.warning(`Failed to register ${results.failed} trainees. Check results for details.`);
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bulk registration failed.");
      console.error("Bulk registration error:", err);
    } finally {
      setBulkRegistering(false);
    }
  };

  const handleParsedTraineeSelection = (id: string) => {
    setSelectedParsedTraineeIds(prev =>
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };
  
  const handleSelectAllParsedTrainees = () => {
    const traineesWithoutErrors = parsedTrainees.filter(t => !t.errors);
    if (selectedParsedTraineeIds.length === traineesWithoutErrors.length) {
      setSelectedParsedTraineeIds([]);
    } else {
      setSelectedParsedTraineeIds(traineesWithoutErrors.map(t => t._id!));
    }
  };

  // Render different views
  const renderCardsView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredTrainees.map((trainee) => (
        <Card key={trainee._id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <GraduationCap className="h-8 w-8 text-blue-600"/>
                <div>
                  <CardTitle className="text-lg">{trainee.name}</CardTitle>
                  <CardDescription>{trainee.email}</CardDescription>
                </div>
              </div>
              <Badge variant={trainee.isActive ? "default" : "outline"}>
                {trainee.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enrolled in: {
                getTraineePrograms(trainee._id)
                  .map(p => p.name)
                  .join(', ') || 'No programs'
              }
            </p>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1" 
                onClick={() => openAssignModal(trainee)}
              >
                <UserPlus className="h-4 w-4 mr-2" /> Assign
              </Button>
              {(() => {
                const traineePrograms = getTraineePrograms(trainee._id);
                return traineePrograms.length > 0 && (
                  <Select onValueChange={(programId) => openUnenrollConfirm(trainee, programId)} value="">
                    <SelectTrigger className="w-[140px] h-9 text-xs">
                      <SelectValue placeholder="Unenroll" />
                    </SelectTrigger>
                    <SelectContent>
                      {traineePrograms.map(p => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })()}
              <Button variant="ghost" size="icon">
                <Eye className="h-4 w-4"/>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredTrainees.map((trainee) => (
        <Card key={trainee._id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {getInitials(trainee.name)}
                </span>
              </div>
              <div>
                <h3 className="font-medium">{trainee.name}</h3>
                <p className="text-sm text-muted-foreground">{trainee.email}</p>
                <p className="text-xs text-muted-foreground">
                  Programs: {getTraineePrograms(trainee._id).map(p => p.name).join(', ') || 'None'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={trainee.isActive ? "default" : "outline"}>
                {trainee.status}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => openAssignModal(trainee)}>
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderTableView = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Programs</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrainees.map((trainee) => (
              <TableRow key={trainee._id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {getInitials(trainee.name)}
                      </span>
                    </div>
                    <span className="font-medium">{trainee.name}</span>
                  </div>
                </TableCell>
                <TableCell>{trainee.email}</TableCell>
                <TableCell>
                  <Badge variant={trainee.isActive ? "default" : "outline"}>
                    {trainee.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getTraineePrograms(trainee._id).map(program => (
                      <Badge key={program._id} variant="secondary" className="text-xs">
                        {program.name}
                      </Badge>
                    ))}
                    {getTraineePrograms(trainee._id).length === 0 && (
                      <span className="text-sm text-muted-foreground">No programs</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" onClick={() => openAssignModal(trainee)}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderProgramsView = () => {
    const groupedData = getTraineesByProgram();
    
    return (
      <div className="space-y-6">
        {Object.entries(groupedData).map(([programId, data]) => (
          <Card key={programId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {programId === 'unassigned' ? (
                      <Users className="h-5 w-5 text-gray-500" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-blue-500" />
                    )}
                    {data.program.name}
                  </CardTitle>
                  <CardDescription>
                    {data.trainees.length} trainee{data.trainees.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {data.trainees.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {data.trainees.map((trainee) => (
                  <div key={trainee._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {getInitials(trainee.name)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{trainee.name}</p>
                        <p className="text-xs text-muted-foreground">{trainee.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openAssignModal(trainee)}>
                        <UserPlus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trainee Management</h1>
          <p className="text-muted-foreground">Add new trainees and assign them to your programs.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setBulkUploadModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <FileUp className="mr-2 h-4 w-4" />
            Import Trainees
          </Button>
          <Button onClick={() => setCreateModalOpen(true)} className="bg-[#1f497d] hover:bg-[#1a3f6b]">
            <Plus className="mr-2 h-4 w-4" />
            Add Single Trainee
          </Button>
        </div>
      </div>

      {/* Filters and View Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search trainees by name or email..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-72"
                />
              </div>
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map(p => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* View Mode Controls */}
            <div className="flex items-center space-x-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'programs' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('programs')}
                className="h-8"
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin"/>
            </div>
          ) : (
            <>
              {viewMode === 'cards' && renderCardsView()}
              {viewMode === 'list' && renderListView()}
              {viewMode === 'table' && renderTableView()}
              {viewMode === 'programs' && renderProgramsView()}
              
              {filteredTrainees.length === 0 && viewMode !== 'programs' && (
                <p className="text-center text-muted-foreground py-10">
                  No trainees found matching your criteria.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* All existing modals remain the same */}
      
      {/* Create Trainee Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Trainee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTrainee} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={newTraineeData.name} 
                onChange={(e) => setNewTraineeData(d => ({...d, name: e.target.value}))} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={newTraineeData.email} 
                onChange={(e) => setNewTraineeData(d => ({...d, email: e.target.value}))} 
                required 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} 
                Add Trainee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Program Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Program to {selectedTrainee?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Program</Label>
            <Select value={programToAssign} onValueChange={setProgramToAssign}>
              <SelectTrigger>
                <SelectValue placeholder="Select a program to enroll" />
              </SelectTrigger>
              <SelectContent>
                {programs.map(p => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignProgram} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} 
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Trainee Modal */}
      <Dialog open={isBulkUploadModalOpen} onOpenChange={setBulkUploadModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <DialogHeader>
            <DialogTitle>Import Trainees</DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx) or CSV file to register multiple trainees at once.
              File must contain 'Name' and 'Email' columns. 'Gender' and 'Phone' are optional.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="excelFile" className="whitespace-nowrap">Upload File:</Label>
              <Input 
                type="file" 
                id="excelFile" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleExcelFileChange} 
              />
              <Button 
                onClick={parseExcelFile} 
                disabled={!excelFile || bulkRegistering} 
                className="whitespace-nowrap"
              >
                {bulkRegistering ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                ) : (
                  <BookOpen className="mr-2 h-4 w-4"/>
                )}
                {bulkRegistering ? 'Parsing...' : 'Parse File'}
              </Button>
            </div>

            {parsedTrainees.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>File Preview ({parsedTrainees.length} rows)</CardTitle>
                  <CardDescription>
                    Review parsed data. Deselect any rows you do not wish to register.
                    Rows with errors are automatically deselected.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input 
                              type="checkbox" 
                              checked={
                                selectedParsedTraineeIds.length === parsedTrainees.filter(t => !t.errors).length && 
                                parsedTrainees.filter(t => !t.errors).length > 0
                              }
                              onChange={handleSelectAllParsedTrainees}
                              disabled={parsedTrainees.filter(t => !t.errors).length === 0}
                              className="rounded border-gray-300"
                            />
                          </TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedTrainees.map((trainee, index) => (
                          <TableRow 
                            key={trainee._id || index} 
                            className={trainee.errors ? "bg-red-50" : ""}
                          >
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedParsedTraineeIds.includes(trainee._id!)}
                                onChange={() => handleParsedTraineeSelection(trainee._id!)}
                                disabled={!!trainee.errors}
                                className="rounded border-gray-300"
                              />
                            </TableCell>
                            <TableCell className={trainee.errors?.includes('Name is missing.') ? 'text-red-600' : ''}>
                              {trainee.name || 'N/A'}
                            </TableCell>
                            <TableCell className={
                              trainee.errors?.includes('Email is missing.') || 
                              trainee.errors?.includes('Invalid email format.') ? 'text-red-600' : ''
                            }>
                              {trainee.email || 'N/A'}
                            </TableCell>
                            <TableCell>{trainee.gender || 'N/A'}</TableCell>
                            <TableCell>{trainee.phone || 'N/A'}</TableCell>
                            <TableCell>
                              {trainee.errors && trainee.errors.length > 0 ? (
                                <Badge 
                                  variant="destructive" 
                                  className="flex items-center gap-1" 
                                  title={trainee.errors.join(', ')}
                                >
                                  <XCircle className="h-3 w-3"/> Error
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3"/> Ready
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {bulkRegisterResults && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Import Results</CardTitle>
                  <CardDescription>Summary of the last trainee import attempt.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p><strong>Total Processed:</strong> {bulkRegisterResults.totalProcessed}</p>
                  <p className="text-green-600"><strong>Successful:</strong> {bulkRegisterResults.successful}</p>
                  <p className="text-red-600"><strong>Failed:</strong> {bulkRegisterResults.failed}</p>
                  {bulkRegisterResults.errors.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-semibold mb-2">Errors:</h5>
                      <ul className="list-disc list-inside text-sm text-red-600 max-h-40 overflow-y-auto">
                        {bulkRegisterResults.errors.map((err, index) => (
                          <li key={index}>
                            Row {err.row}: {err.message} (Data: {JSON.stringify(err.data)})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          <DialogFooter className="pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setBulkUploadModalOpen(false)} 
              disabled={bulkRegistering}
            >
              Close
            </Button>
            <Button 
              type="button" 
              onClick={handleBulkRegister} 
              disabled={selectedParsedTraineeIds.length === 0 || bulkRegistering}
            >
              {bulkRegistering ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              ) : (
                <UserPlus className="mr-2 h-4 w-4"/>
              )}
              Register {selectedParsedTraineeIds.length} Trainee(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unenroll Confirmation Dialog */}
      <AlertDialog open={isUnenrollConfirmOpen} onOpenChange={setUnenrollConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <MinusCircle/>Confirm Unenrollment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unenroll <strong>{traineeToUnenroll?.name}</strong> from program{' '}
              <strong>{programs.find(p => p._id === programToAssign)?.name || 'this program'}</strong>?
              This action cannot be undone and will remove them from all future activities of this program.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnenrollTrainee} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              ) : (
                <MinusCircle className="mr-2 h-4 w-4"/>
              )}
              Unenroll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TraineesPage;