"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Award, Download, Loader2, BookOpen, AlertCircle, XCircle } from "lucide-react";
import { useAuth } from "@/lib/contexts/RoleContext";
import { 
  fetchCertificates, 
  DisplayCertificate, 
  downloadCertificateFile // NEW: Import the download service function
} from "@/lib/services/certificates.services";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// No explicit need for getRoleDisplayName here, as role is "trainee" already

export default function MyCertificatesPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [myCertificates, setMyCertificates] = useState<DisplayCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null); // To track which cert is downloading

 const fetchMyCertificates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const data = await fetchCertificates(role); // Pass the role here
        setMyCertificates(data);
    } catch (err: any) {
        const errorMessage = err.response?.data?.message || "Failed to load your certificates.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error fetching trainee certificates:", err);
    } finally {
        setIsLoading(false);
    }
}, [role]); // Include role in dependencies

  useEffect(() => {
    // Only fetch for trainees after auth loading is complete
    if (!authLoading && role === 'trainee') { 
      fetchMyCertificates();
    }
  }, [authLoading, role, fetchMyCertificates]);

  // NEW: Handle Download Certificate via Service
  const handleDownloadCertificate = async (certificateId: string, traineeName: string, programName: string) => {
    setIsDownloading(certificateId); // Set downloading state for this specific certificate
    try {
      const filename = `${traineeName.replace(/\s+/g, '_')}_${programName.replace(/\s+/g, '_')}_Certificate.pdf`;
      await downloadCertificateFile(certificateId, filename);
      toast.success(`Certificate download initiated.`);
    } catch (err: any) {
      toast.error("Failed to download certificate. Please try again.");
      console.error("Download error:", err);
    } finally {
      setIsDownloading(null); // Reset downloading state
    }
  };


  // --- Access Control & Loading States ---
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  // Access control: Ensure user is logged in and has the 'trainee' role
  if (!user || role !== 'trainee') {
    return (
      <Card className="p-6 text-center">
        <CardHeader>
          <CardTitle className="text-destructive">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You do not have permission to view this page. This page is restricted to Trainees.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2 text-muted-foreground">Loading your certificates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
        <p className="text-muted-foreground">View and download your earned program completion certificates.</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle> {/* This was CardTitle, changed to AlertTitle */}
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Certificates Display */}
      {myCertificates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold">No Certificates Yet</h3>
            <p className="text-muted-foreground">You haven't earned any certificates. Keep up the great work in your programs!</p>
            <Button onClick={() => window.location.href = '/dashboard/Trainee/my-learning'} className="mt-4">
                <BookOpen className="mr-2 h-4 w-4"/> Continue My Learning
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myCertificates.map((cert) => (
            <Card key={cert._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{cert.program}</CardTitle>
                  <Badge className="bg-green-100 text-green-800">Issued</Badge>
                </div>
                <CardDescription>
                  For: <span className="font-medium">{cert.traineeName}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Issued on: {new Date(cert.issueDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Certificate ID: <span className="font-mono text-xs">{cert.certificateId}</span>
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => handleDownloadCertificate(cert._id, cert.traineeName, cert.program)}
                  disabled={isDownloading === cert._id} // Disable during download
                >
                  {isDownloading === cert._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                  {isDownloading === cert._id ? 'Downloading...' : 'Download Certificate'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}