"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRole } from '@/lib/contexts/RoleContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertTriangle, BookOpen, Users, CheckCircle, Send, Clock, User, Plus } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddUserToProgramModal } from '@/components/programs/AddUserToProgramModal';

// --- Type Definitions ---
interface User { _id: string; name: string; email: string; }
interface Course {
  _id: string;
  title: string;
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';
  facilitator: User;
}
interface ProgramDetails {
  _id: string;
  name: string;
  description: string;
  status: string;
  trainees: User[];
  facilitators: User[];
  programManager?: User;
  startDate: string;
  endDate: string;
}

export default function ProgramDetailPage() {
    const params = useParams();
    const programId = params.programId as string;
    const { role } = useRole();
    const router = useRouter();

    const [program, setProgram] = useState<ProgramDetails | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('courses');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!programId) return;
        setLoading(true);
        setError(null);
        try {
            const [programRes, coursesRes] = await Promise.all([
                api.get(`/programs/${programId}`),
                api.get(`/courses/program/${programId}`)
            ]);
            setProgram(programRes.data.data);
            setCourses(coursesRes.data.data);
        } catch (err) {
            setError("Failed to fetch program details. The program may not exist or you may not have access.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [programId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleApproveCourse = async (courseId: string) => {
        if (!window.confirm("Are you sure you want to approve this course?")) return;
        try {
            await api.patch(`/courses/${courseId}/approve`);
            alert('Course approved successfully!');
            fetchData();
        } catch (err: any) {
            alert(`Error approving course: ${err.response?.data?.message || err.message}`);
        }
    };
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Draft': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1"/>Draft</Badge>;
            case 'PendingApproval': return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600"><Send className="h-3 w-3 mr-1"/>Pending Approval</Badge>;
            case 'Approved': return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1"/>Approved</Badge>;
            case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error || !program) {
        return (
            <div className="p-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || 'Program not found.'}</AlertDescription>
                </Alert>
                <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
        );
    }
    
    const canManage = role === 'program_manager' || role === 'super_admin';

    const renderUserTable = (users: User[], userRole: string) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.length > 0 ? users.map(user => (
                    <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center p-6 text-muted-foreground">No {userRole}s assigned to this program yet.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className='flex justify-between items-start'>
                        <div>
                            <CardTitle className="text-2xl">{program.name}</CardTitle>
                            <CardDescription>{program.description}</CardDescription>
                        </div>
                        <Badge className="text-sm">{program.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex gap-x-6 gap-y-2 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4"/> 
                        <span>{program.trainees.length} Trainees</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <User className="h-4 w-4"/> 
                        <span>{program.facilitators.length} Facilitators</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4"/> 
                        <span>{courses.length} Courses</span>
                    </div>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="courses">Courses</TabsTrigger>
                    <TabsTrigger value="trainees">Trainees</TabsTrigger>
                    <TabsTrigger value="facilitators">Facilitators</TabsTrigger>
                </TabsList>

                <TabsContent value="courses" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Courses in Program</CardTitle>
                            <CardDescription>Manage courses submitted by facilitators for this program.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {courses.length > 0 ? courses.map(course => (
                                <div key={course._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50">
                                    <div>
                                        <h4 className="font-medium">{course.title}</h4>
                                        <p className="text-xs text-muted-foreground">Facilitator: {course.facilitator.name}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(course.status)}
                                        {canManage && course.status === 'PendingApproval' && (
                                            <Button size="sm" onClick={() => handleApproveCourse(course._id)}>
                                                <CheckCircle className="h-4 w-4 mr-2"/>Approve
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-muted-foreground py-6">No courses have been created for this program yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="trainees" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Enrolled Trainees</CardTitle>
                                <CardDescription>List of all trainees currently enrolled in {program.name}.</CardDescription>
                            </div>
                            {canManage && <Button size="sm" onClick={() => setIsAddUserModalOpen(true)}><Plus className="h-4 w-4 mr-2"/>Add User</Button>}
                        </CardHeader>
                        <CardContent>
                            {renderUserTable(program.trainees, 'trainee')}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="facilitators" className="mt-4">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                             <div>
                                <CardTitle>Assigned Facilitators</CardTitle>
                                <CardDescription>List of all facilitators assigned to {program.name}.</CardDescription>
                            </div>
                            {canManage && <Button size="sm" onClick={() => setIsAddUserModalOpen(true)}><Plus className="h-4 w-4 mr-2"/>Add User</Button>}
                        </CardHeader>
                        <CardContent>
                            {renderUserTable(program.facilitators, 'facilitator')}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            {canManage && (
                <AddUserToProgramModal
                    isOpen={isAddUserModalOpen}
                    onClose={() => setIsAddUserModalOpen(false)}
                    programId={program._id}
                    programName={program.name}
                    onUserAdded={() => {
                        setIsAddUserModalOpen(false);
                        fetchData(); // Refresh the page data to show the new user
                    }}
                />
            )}
        </div>
    );
}