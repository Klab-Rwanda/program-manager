"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, FileText, BarChart3, Users, Calendar, Archive, BookOpen } from "lucide-react";
import {
  exportProgramsPDF,
  exportProgramsExcel,
  exportArchivedPDF,
  exportArchivedExcel,
  downloadBlob
} from "@/lib/services/export.service";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ExportType = 'programs-pdf' | 'programs-excel' | 'archived-pdf' | 'archived-excel';

export default function ReportsExportPage() {
    const [loading, setLoading] = useState<ExportType | null>(null);

    const handleExport = async (type: ExportType) => {
        setLoading(type);
        try {
            let blob: Blob;
            let filename: string;
            const date = new Date().toISOString().split('T')[0];

            switch (type) {
                case 'programs-pdf':
                    blob = await exportProgramsPDF();
                    filename = `active-programs-report-${date}.pdf`;
                    break;
                case 'programs-excel':
                    blob = await exportProgramsExcel();
                    filename = `active-programs-report-${date}.xlsx`;
                    break;
                case 'archived-pdf':
                    blob = await exportArchivedPDF();
                    filename = `archived-programs-report-${date}.pdf`;
                    break;
                case 'archived-excel':
                    blob = await exportArchivedExcel();
                    filename = `archived-programs-report-${date}.xlsx`;
                    break;
                default:
                    throw new Error("Invalid export type");
            }

            downloadBlob(blob, filename);
            toast.success("Report downloaded successfully!");

        } catch (err) {
            toast.error("Failed to generate report. Please try again.");
            console.error("Export error:", err);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports & Data Export</h1>
                <p className="text-muted-foreground">
                  Generate and download comprehensive reports for your records.
                </p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BookOpen /> Active Programs Reports</CardTitle>
                    <CardDescription>
                        Export a full list of all programs currently in 'Draft', 'Pending Approval', or 'Active' states.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button 
                        onClick={() => handleExport('programs-pdf')} 
                        disabled={!!loading}
                        className="w-full sm:w-auto"
                    >
                        {loading === 'programs-pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Export as PDF
                    </Button>
                     <Button 
                        onClick={() => handleExport('programs-excel')} 
                        disabled={!!loading}
                        className="w-full sm:w-auto"
                    >
                        {loading === 'programs-excel' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export as Excel
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Archive /> Archived Programs Reports</CardTitle>
                    <CardDescription>
                        Export a historical record of all programs that have been archived.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                     <Button 
                        onClick={() => handleExport('archived-pdf')} 
                        disabled={!!loading}
                        className="w-full sm:w-auto"
                        variant="secondary"
                    >
                        {loading === 'archived-pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Export as PDF
                    </Button>
                     <Button 
                        onClick={() => handleExport('archived-excel')} 
                        disabled={!!loading}
                        className="w-full sm:w-auto"
                        variant="secondary"
                    >
                        {loading === 'archived-excel' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export as Excel
                    </Button>
                </CardContent>
            </Card>

            <Separator />

           

        </div>
    );
}