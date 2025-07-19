"use client";

import { useState, useCallback, useEffect } from "react";
import { 
  MapPin, QrCode, Clock, Users, CheckCircle, Share2, Copy, Eye, UserCheck, 
  ChevronLeft, Plus, CalendarIcon, Play, StopCircle, Settings, Download,
  AlertCircle, CheckCircle2, XCircle, UserX, BarChart3, Filter, CalendarDays
} from "lucide-react";

import { AppSidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/lib/contexts/RoleContext";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import api from "@/lib/api";

// Types matching backend models
interface Program {
  _id: string;
  name: string;
  description: string;
}

interface ClassSession {
  _id: string;
  type: 'physical' | 'online';
  programId: {
    _id: string;
    name: string;
  };
  facilitatorId: {
    _id: string;
    name: string;
    email: string;
  };
  sessionId: string;
  title: string;
  description?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    radius: number;
  };
  startTime: string;
  endTime?: string;
  expiresAt?: string;
  accessLink?: string;
  qrCodeData?: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  totalExpected: number;
  totalPresent: number;
  totalAbsent: number;
  allowLateAttendance: boolean;
  lateThreshold: number;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  sessionId: string;
  timestamp: string;
  method: 'qr_code' | 'geolocation' | 'manual';
  status: 'present' | 'absent' | 'excused' | 'late';
  location?: {
    lat: number;
    lng: number;
  };
  deviceInfo?: string;
  ipAddress?: string;
  markedBy?: {
    _id: string;
    name: string;
  };
}

export default function AttendanceTracking() {
  const { user, role } = useAuth();
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();
  
  // State management
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ClassSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null); // Separate error for form
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const [excuseDialogOpen, setExcuseDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AttendanceRecord | null>(null);

  // Form states
  const [sessionForm, setSessionForm] = useState({
    type: 'online' as 'physical' | 'online',
    programId: '',
    title: '',
    description: '',
    startDate: null as Date | null,
    startTime: '',
    endDate: null as Date | null,
    endTime: '',
    location: {
      lat: 0,
      lng: 0,
      address: '',
      radius: 50
    },
    allowLateAttendance: true,
    lateThreshold: 15
  });

  const [excuseReason, setExcuseReason] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDetails, setLocationDetails] = useState<{
    fullAddress: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
    country: string;
  } | null>(null);

  // Calculate margin based on sidebar state
  const sidebarMargin = isMobile ? '0' : (isCollapsed ? '80px' : '280px');

  // Load programs
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const response = await api.get('/programs'); // Fixed endpoint
        
        if (response.data.data && response.data.data.length > 0) {
          setPrograms(response.data.data);
        } else {
          loadFallbackPrograms();
        }
      } catch (err) {
        setError('Failed to load programs');
        loadFallbackPrograms();
      }
    };

    const loadFallbackPrograms = () => {
      const fallbackPrograms = [
        {
          _id: 'fallback-1',
          name: 'Web Development Bootcamp',
          description: 'Comprehensive web development program covering HTML, CSS, JavaScript, and modern frameworks.'
        },
        {
          _id: 'fallback-2', 
          name: 'Data Science Fundamentals',
          description: 'Introduction to data science, statistics, and machine learning concepts.'
        },
        {
          _id: 'fallback-3',
          name: 'Mobile App Development',
          description: 'Learn to build mobile applications using React Native and Flutter.'
        }
      ];
      setPrograms(fallbackPrograms);
    };

    loadPrograms();
  }, []); // Remove programs.length dependency to avoid infinite loop

  // Debug: Log sessions whenever they change
  useEffect(() => {
    console.log('Sessions state updated:', sessions);
  }, [sessions]);

  // Load facilitator sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/attendance/facilitator/sessions');
        setSessions(response.data.data || []);
      } catch (err) {
        console.error('Failed to load sessions:', err);
        setError('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, []);

  // Create new session
  const createSession = async () => {
    try {
      setLoading(true);
      setFormError(null); // Clear previous form errors
      
      // Validate required fields
      if (!sessionForm.programId || !sessionForm.title || !sessionForm.startDate || !sessionForm.startTime) {
        setFormError('Please fill in all required fields: Program, Title, Start Date, and Start Time');
        return;
      }
      
      // Combine date and time for backend
      const startDateTime = sessionForm.startDate && sessionForm.startTime 
        ? new Date(`${sessionForm.startDate.toISOString().split('T')[0]}T${sessionForm.startTime}`)
        : null;
      
      const endDateTime = sessionForm.endDate && sessionForm.endTime 
        ? new Date(`${sessionForm.endDate.toISOString().split('T')[0]}T${sessionForm.endTime}`)
        : null;

      const sessionData = {
        type: sessionForm.type,
        programId: sessionForm.programId,
        title: sessionForm.title,
        description: sessionForm.description,
        startTime: startDateTime?.toISOString(),
        endTime: endDateTime?.toISOString(),
        location: sessionForm.type === 'physical' ? sessionForm.location : undefined,
        allowLateAttendance: sessionForm.allowLateAttendance,
        lateThreshold: sessionForm.lateThreshold
      };

      console.log('Sending session data:', sessionData);
      console.log('Session form state:', sessionForm);

      const response = await api.post('/attendance/sessions', sessionData);
      console.log('Full API response:', response);
      const newSession = response.data.data;
      console.log('Session created successfully:', newSession);
      
      setSessions(prev => {
        console.log('Previous sessions:', prev);
        const updated = [newSession, ...prev];
        console.log('Updated sessions:', updated);
        return updated;
      });
      
      setCreateSessionOpen(false);
      setFormError(null); // Clear form error on success
      setSessionForm({
        type: 'online',
        programId: '',
        title: '',
        description: '',
        startDate: null,
        startTime: '',
        endDate: null,
        endTime: '',
        location: { lat: 0, lng: 0, address: '', radius: 50 },
        allowLateAttendance: true,
        lateThreshold: 15
      });
    } catch (err: any) {
      console.error('Failed to create session:', err);
      console.error('Error details:', err.response?.data);
      setFormError(err.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  // Start online session
  const startOnlineSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await api.post(`/attendance/sessions/${sessionId}/start-online`);
      const updatedSession = response.data.data.session;
      setSessions(prev => prev.map(s => s._id === updatedSession._id ? updatedSession : s));
      setCurrentSession(updatedSession);
      setQrCodeOpen(true);
    } catch (err: any) {
      console.error('Failed to start session:', err);
      setError(err.response?.data?.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  // Load session attendance
  const loadSessionAttendance = async (sessionId: string) => {
    try {
      const response = await api.get(`/attendance/sessions/${sessionId}/attendance`);
      setAttendanceRecords(response.data.data || []);
    } catch (err) {
      console.error('Failed to load attendance:', err);
      setError('Failed to load attendance records');
    }
  };

  // Mark student as excused
  const markStudentExcused = async () => {
    if (!selectedStudent || !excuseReason.trim()) {
      setError('Please provide a reason for the excuse');
      return;
    }

    try {
      // This would be a backend endpoint to mark as excused
      // For now, we'll update the local state
      setAttendanceRecords(prev => prev.map(record => 
        record._id === selectedStudent._id 
          ? { ...record, status: 'excused' as const }
          : record
      ));
      setExcuseDialogOpen(false);
      setSelectedStudent(null);
      setExcuseReason('');
    } catch (err: any) {
      console.error('Failed to mark as excused:', err);
      setError(err.response?.data?.message || 'Failed to mark as excused');
    }
  };

  // Get current location
  const getCurrentLocation = useCallback(() => {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'An unknown error occurred while getting location.';
          }
          
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }, []);

  // Get detailed address information from coordinates
  const getLocationDetails = useCallback(async (lat: number, lng: number) => {
    try {
      // Try using a CORS proxy or fallback to a simpler approach
      const response = await fetch(
        `https://cors-anywhere.herokuapp.com/https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
        {
          headers: {
            'Origin': 'http://localhost:3000'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location details');
      }

      const data = await response.json();

      // Extract address components
      const address = data.address || {};
      const details = {
        fullAddress: data.display_name || '',
        district: address.district || address.city_district || address.county || '',
        sector: address.suburb || address.neighbourhood || address.quarter || '',
        cell: address.city_block || address.house_number || '',
        village: address.village || address.town || address.city || '',
        country: address.country || ''
      };
      
      return details;
    } catch (error) {
      console.error('Error getting location details:', error);
      // Fallback: return basic location info without external API
      return {
        fullAddress: `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`,
        district: 'Location details unavailable',
        sector: 'Due to CORS restrictions',
        cell: 'Please enter manually',
        village: 'or use coordinates',
        country: 'Rwanda'
      };
    }
  }, []);

  // Mark physical attendance
  const markPhysicalAttendance = async (sessionId: string) => {
    try {
      const location = await getCurrentLocation();
      const response = await api.post(`/attendance/sessions/${sessionId}/physical-attendance`, {
        latitude: location.lat,
        longitude: location.lng
      });
      // Handle success
    } catch (err: any) {
      console.error('Failed to mark attendance:', err);
      setError(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Share session link
  const shareSessionLink = async (link: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Class Session',
          text: 'Click the link to join the class session',
          url: link,
        });
      } catch (error) {
        copyToClipboard(link);
      }
    } else {
      copyToClipboard(link);
    }
  };

  // Calculate attendance statistics
  const getAttendanceStats = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const excused = attendanceRecords.filter(r => r.status === 'excused').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;
    
    return {
      total,
      present,
      absent,
      excused,
      late,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0
    };
  };

  const stats = getAttendanceStats();

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div 
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarMargin }}
      >
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="-ml-1 h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Attendance Management</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
                      <div>
              <h2 className="text-2xl font-bold">Class Sessions</h2>
              <p className="text-muted-foreground">Manage and track attendance for your classes</p>
                      </div>
                    <Dialog open={createSessionOpen} onOpenChange={(open) => {
                      setCreateSessionOpen(open);
                      if (open) {
                        setFormError(null); // Clear form error when dialog opens
                      }
                    }}>
                      <DialogTrigger asChild>
                <Button className="bg-[#1f497d] hover:bg-[#1a3d6b]">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Session
                        </Button>
                      </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                  <DialogTitle>Create New Class Session</DialogTitle>
                          <DialogDescription>
                    Set up a new class session for attendance tracking
                          </DialogDescription>
                        </DialogHeader>
                
                {/* Form Error Display */}
                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-700 text-sm">{formError}</span>
                  </div>
                )}
                
                <div className="space-y-3">
                          <div className="space-y-2">
                    <Label>Session Type</Label>
                    <Select 
                      value={sessionForm.type} 
                      onValueChange={(value: 'physical' | 'online') => 
                        setSessionForm(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online Session</SelectItem>
                        <SelectItem value="physical">Physical Class</SelectItem>
                      </SelectContent>
                    </Select>
                          </div>

                          <div className="space-y-2">
                    <Label>Program</Label>
                    <Select 
                      value={sessionForm.programId} 
                      onValueChange={(value) => 
                        setSessionForm(prev => ({ ...prev, programId: value }))
                      }
                    >
                              <SelectTrigger>
                        <SelectValue placeholder="Select a program" />
                              </SelectTrigger>
                              <SelectContent>
                                {programs.map((program) => (
                          <SelectItem key={program._id} value={program._id}>
                                    {program.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                  <div className="space-y-2">
                    <Label>Session Title</Label>
                    <Input
                      placeholder="e.g., Advanced JavaScript - Module 3"
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                          </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Session description..."
                      value={sessionForm.description}
                      onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Start Date & Time</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !sessionForm.startDate && "text-muted-foreground"
                              )}
                    >
                              <CalendarDays className="mr-2 h-4 w-4" />
                              {sessionForm.startDate ? format(sessionForm.startDate, "PPP") : "Pick a date"}
                    </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={sessionForm.startDate || undefined}
                              onSelect={(date) => setSessionForm(prev => ({ ...prev, startDate: date || null }))}
                              initialFocus
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        <Select 
                          value={sessionForm.startTime} 
                          onValueChange={(value) => setSessionForm(prev => ({ ...prev, startTime: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, hour) => 
                              Array.from({ length: 4 }, (_, minute) => {
                                const time = `${hour.toString().padStart(2, '0')}:${(minute * 15).toString().padStart(2, '0')}`;
                                return (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                );
                              })
                            ).flat()}
                          </SelectContent>
                        </Select>
                    </div>
                  </div>

                    <div className="space-y-2">
                      <Label className="text-sm">End Date & Time (Optional)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !sessionForm.endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarDays className="mr-2 h-4 w-4" />
                              {sessionForm.endDate ? format(sessionForm.endDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={sessionForm.endDate || undefined}
                              onSelect={(date) => setSessionForm(prev => ({ ...prev, endDate: date || null }))}
                              initialFocus
                              disabled={(date) => 
                                date < new Date() || 
                                (sessionForm.startDate ? date < sessionForm.startDate : false)
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        <Select 
                          value={sessionForm.endTime} 
                          onValueChange={(value) => setSessionForm(prev => ({ ...prev, endTime: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, hour) => 
                              Array.from({ length: 4 }, (_, minute) => {
                                const time = `${hour.toString().padStart(2, '0')}:${(minute * 15).toString().padStart(2, '0')}`;
                                return (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                );
                              })
                            ).flat()}
                          </SelectContent>
                        </Select>
                                    </div>
                                  </div>
                  </div>

                  {sessionForm.type === 'physical' && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-sm">Latitude</Label>
                          <Input
                            type="number"
                            step="any"
                            placeholder="-1.9441"
                            value={sessionForm.location.lat}
                            onChange={(e) => setSessionForm(prev => ({ 
                              ...prev, 
                              location: { ...prev.location, lat: parseFloat(e.target.value) || 0 }
                            }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Longitude</Label>
                          <Input
                            type="number"
                            step="any"
                            placeholder="30.0619"
                            value={sessionForm.location.lng}
                            onChange={(e) => setSessionForm(prev => ({ 
                              ...prev, 
                              location: { ...prev.location, lng: parseFloat(e.target.value) || 0 }
                            }))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-sm">Address (Optional)</Label>
                        <Input
                          placeholder="Kigali, Rwanda"
                          value={sessionForm.location.address}
                          onChange={(e) => setSessionForm(prev => ({ 
                            ...prev, 
                            location: { ...prev.location, address: e.target.value }
                          }))}
                        />
                      </div>

                      {/* Location Details Display */}
                      {locationDetails && (
                        <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Location Details</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {locationDetails.country && (
                                  <div>
                                <span className="font-medium text-gray-600">Country:</span>
                                <span className="ml-1 text-gray-800">{locationDetails.country}</span>
                                  </div>
                            )}
                            {locationDetails.district && (
                              <div>
                                <span className="font-medium text-gray-600">District:</span>
                                <span className="ml-1 text-gray-800">{locationDetails.district}</span>
                              </div>
                            )}
                            {locationDetails.sector && (
                              <div>
                                <span className="font-medium text-gray-600">Sector:</span>
                                <span className="ml-1 text-gray-800">{locationDetails.sector}</span>
                              </div>
                            )}
                            {locationDetails.cell && (
                              <div>
                                <span className="font-medium text-gray-600">Cell:</span>
                                <span className="ml-1 text-gray-800">{locationDetails.cell}</span>
                              </div>
                            )}
                            {locationDetails.village && (
                              <div>
                                <span className="font-medium text-gray-600">Village:</span>
                                <span className="ml-1 text-gray-800">{locationDetails.village}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-2">
                            <span className="font-medium">Full Address:</span>
                            <p className="mt-1 text-gray-700">{locationDetails.fullAddress}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <Label className="text-sm">Radius (meters)</Label>
                        <Input
                          type="number"
                          placeholder="50"
                          value={sessionForm.location.radius}
                          onChange={(e) => setSessionForm(prev => ({ 
                            ...prev, 
                            location: { ...prev.location, radius: parseInt(e.target.value) || 50 }
                          }))}
                        />
                      </div>
                      
                                  <Button
                        type="button"
                        variant="outline"
                                    size="sm"
                        disabled={locationLoading}
                        onClick={async () => {
                          try {
                            setLocationLoading(true);
                            setError(null); // Clear any previous errors
                            
                            const location = await getCurrentLocation();
                            
                            // Get detailed address information
                            const details = await getLocationDetails(location.lat, location.lng);
                            setLocationDetails(details);
                            
                            setSessionForm(prev => ({
                              ...prev,
                              location: {
                                ...prev.location,
                                lat: location.lat,
                                lng: location.lng,
                                address: details?.fullAddress || ''
                              }
                            }));
                            
                          } catch (err: any) {
                            console.error('Location error:', err);
                            setError(err.message || 'Failed to get current location. Please enter coordinates manually.');
                          } finally {
                            setLocationLoading(false);
                          }
                        }}
                      >
                        {locationLoading ? (
                          <>
                            <div className="mr-1 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                            Getting Location...
                          </>
                        ) : (
                          <>
                            <MapPin className="mr-1 h-3 w-3" />
                            Use Current Location
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1 bg-[#1f497d] hover:bg-[#1a3d6b]" 
                      onClick={createSession}
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Session'}
                    </Button>
                    <Button 
                                    variant="outline"
                      onClick={() => setCreateSessionOpen(false)}
                                  >
                      Cancel
                                  </Button>
                                </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{error}</span>
                        <Button
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="ml-auto"
              >
                <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                  )}

          {/* Sessions Grid */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => {
              console.log('Rendering session:', session);
              console.log('Session status:', session.status);
              console.log('Session type:', session.type);
              console.log('Should show Start button:', session.status === 'scheduled' && session.type === 'online');
              return (
              <Card key={session._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{session.title || 'Untitled Session'}</CardTitle>
                      <CardDescription className="text-sm">
                        {session.programId && typeof session.programId === 'object' && 'name' in session.programId
                          ? (session.programId as any).name 
                          : session.programId && typeof session.programId === 'string' 
                          ? 'Program ID: ' + (session.programId as string).substring(0, 8) + '...'
                          : 'Unknown Program'}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={
                        session.status === 'active' ? 'default' :
                        session.status === 'completed' ? 'secondary' :
                        session.status === 'cancelled' ? 'destructive' : 'outline'
                      }
                      className={
                        session.status === 'active' ? 'bg-green-500' :
                        session.status === 'completed' ? 'bg-blue-500' :
                        session.status === 'cancelled' ? 'bg-red-500' : ''
                      }
                    >
                      {session.status || 'scheduled'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      {session.startTime ? new Date(session.startTime).toLocaleDateString() : 'No date'} at{' '}
                      {session.startTime ? new Date(session.startTime).toLocaleTimeString() : 'No time'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {session.type === 'online' ? (
                      <QrCode className="h-4 w-4" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    <span className="capitalize">{session.type || 'unknown'} Session</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-green-500" />
                      <span>{session.totalPresent || 0}</span>
                          </div>
                    <div className="flex items-center gap-1">
                      <UserX className="h-4 w-4 text-red-500" />
                      <span>{session.totalAbsent || 0}</span>
                        </div>
                      </div>

                        <div className="flex gap-2">
                    {session.status === 'scheduled' && session.type === 'online' && (
                          <Button
                            size="sm"
                        onClick={() => startOnlineSession(session.sessionId)}
                        disabled={loading}
                        className="flex-1"
                          >
                        <Play className="mr-1 h-3 w-3" />
                        Start
                          </Button>
                    )}

                    {session.status === 'scheduled' && session.type === 'physical' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentSession(session);
                          loadSessionAttendance(session._id);
                          setSessionDetailsOpen(true);
                        }}
                        className="flex-1"
                      >
                        <MapPin className="mr-1 h-3 w-3" />
                        View Location
                      </Button>
                    )}

                    {session.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentSession(session);
                          loadSessionAttendance(session._id);
                          setSessionDetailsOpen(true);
                        }}
                        className="flex-1"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                    )}

                    {session.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentSession(session);
                          loadSessionAttendance(session._id);
                          setSessionDetailsOpen(true);
                        }}
                        className="flex-1"
                      >
                        <BarChart3 className="mr-1 h-3 w-3" />
                        View Report
                      </Button>
                    )}

                    {session.accessLink && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => shareSessionLink(session.accessLink!)}
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>

          {sessions.length === 0 && !loading && (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first class session to start tracking attendance
              </p>
              <Button onClick={() => setCreateSessionOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Session
              </Button>
                </div>
              )}
        </div>

        {/* Session Details Dialog */}
        <Dialog open={sessionDetailsOpen} onOpenChange={setSessionDetailsOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Session Details - {currentSession?.title}</DialogTitle>
              <DialogDescription>
                View and manage attendance for this session
              </DialogDescription>
            </DialogHeader>
            
            {currentSession && (
              <div className="space-y-6">
                {/* Session Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Session Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Type:</span> {currentSession.type}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {currentSession.status}
                      </div>
                      <div>
                        <span className="font-medium">Start Time:</span> {new Date(currentSession.startTime).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Program:</span> {currentSession.programId.name}
                      </div>
                    </div>
            </CardContent>
          </Card>

                {/* Attendance Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Attendance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                        <div className="text-sm text-muted-foreground">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                        <div className="text-sm text-muted-foreground">Absent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.excused}</div>
                        <div className="text-sm text-muted-foreground">Excused</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{stats.percentage}%</div>
                        <div className="text-sm text-muted-foreground">Attendance Rate</div>
                      </div>
                    </div>
                </CardContent>
              </Card>

                {/* Attendance Records Table */}
                <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Attendance Records</CardTitle>
                      <Button size="sm" variant="outline">
                        <Download className="mr-1 h-3 w-3" />
                        Export
                      </Button>
                  </div>
                </CardHeader>
                <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceRecords.map((record) => (
                          <TableRow key={record._id}>
                            <TableCell>
                          <div>
                                <div className="font-medium">{record.userId.name}</div>
                                <div className="text-sm text-muted-foreground">{record.userId.email}</div>
                          </div>
                            </TableCell>
                            <TableCell>
                            <Badge
                              variant={
                                  record.status === 'present' ? 'default' :
                                  record.status === 'absent' ? 'destructive' :
                                  record.status === 'excused' ? 'secondary' : 'outline'
                              }
                              className={
                                  record.status === 'present' ? 'bg-green-500' :
                                  record.status === 'absent' ? 'bg-red-500' :
                                  record.status === 'excused' ? 'bg-blue-500' : ''
                              }
                            >
                                {record.status}
                            </Badge>
                            </TableCell>
                            <TableCell>
                              {record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {record.method === 'qr_code' && <QrCode className="h-3 w-3" />}
                                {record.method === 'geolocation' && <MapPin className="h-3 w-3" />}
                                {record.method === 'manual' && <UserCheck className="h-3 w-3" />}
                                <span className="text-sm capitalize">{record.method.replace('_', ' ')}</span>
                            </div>
                            </TableCell>
                            <TableCell>
                              {record.status === 'absent' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedStudent(record);
                                    setExcuseDialogOpen(true);
                                  }}
                                >
                                  <UserCheck className="mr-1 h-3 w-3" />
                                  Excuse
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={qrCodeOpen} onOpenChange={setQrCodeOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Session QR Code</DialogTitle>
              <DialogDescription>
                Share this QR code with students to mark attendance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {currentSession?.qrCodeData && (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block mb-4">
                    <div className="w-32 h-32 bg-black flex items-center justify-center text-white text-xs">
                      QR Code
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Students can scan this QR code to mark attendance
                  </p>
                </div>
              )}
              
              {currentSession?.accessLink && (
                <div className="space-y-2">
                  <Label>Access Link</Label>
                  <div className="flex gap-2">
                    <Input value={currentSession.accessLink} readOnly />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(currentSession.accessLink!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => shareSessionLink(currentSession?.accessLink || '')}
                >
                  <Share2 className="mr-1 h-3 w-3" />
                  Share with Students
                </Button>
                <Button variant="outline" onClick={() => setQrCodeOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Excuse Dialog */}
        <Dialog open={excuseDialogOpen} onOpenChange={setExcuseDialogOpen}>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Mark Student as Excused</DialogTitle>
                                  <DialogDescription>
                Mark {selectedStudent?.userId.name} as excused for this session
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                <Label>Reason for Excuse</Label>
                                    <Textarea
                                      placeholder="e.g., Medical appointment, Family emergency, etc."
                                      value={excuseReason}
                                      onChange={(e) => setExcuseReason(e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                  className="flex-1" 
                                      onClick={markStudentExcused}
                                    >
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Mark as Excused
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setExcuseDialogOpen(false);
                                        setSelectedStudent(null);
                    setExcuseReason('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                        </div>
                      </div>
  );
}
