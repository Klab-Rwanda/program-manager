"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { getAllPrograms } from "@/lib/services/program.service";
import { getCoursesForProgram } from "@/lib/services/course.service";
import { Program, Course } from "@/types";

interface ProgramWithCourses extends Program {
    courses?: Course[];
}

export default function ResourcesPage() {
    const [programsWithCourses, setProgramsWithCourses] = useState<ProgramWithCourses[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeAccordionItem, setActiveAccordionItem] = useState<string>("");

    const fetchResources = useCallback(async () => {
        setLoading(true);
        try {
            const enrolledPrograms = await getAllPrograms();

            if (enrolledPrograms.length === 0) {
                setProgramsWithCourses([]);
                return;
            }

            const programsData = await Promise.all(
                enrolledPrograms.map(async (program) => {
                    const courses = await getCoursesForProgram(program._id);
                    return { ...program, courses };
                })
            );

            setProgramsWithCourses(programsData);
            
            // Automatically open the first program in the accordion
            if (programsData.length > 0) {
                setActiveAccordionItem(programsData[0]._id);
            }
        } catch (err) {
            toast.error("Failed to load learning resources.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchResources(); }, [fetchResources]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Learning Resources</h1>
                <p className="text-muted-foreground">Access all learning materials for your enrolled programs.</p>
            </div>

            {programsWithCourses.length === 0 ? (
                 <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        You are not enrolled in any programs with available resources.
                    </CardContent>
                </Card>
            ) : (
                <Accordion type="single" collapsible value={activeAccordionItem} onValueChange={setActiveAccordionItem} className="w-full">
                    {programsWithCourses.map(program => (
                        <AccordionItem value={program._id} key={program._id}>
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline p-4">
                               {program.name}
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="border-t">
                                    {program.courses && program.courses.length > 0 ? (
                                        <div className="space-y-2 p-4">
                                            {program.courses.map(course => (
                                                <div key={course._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-primary"/>
                                                        <div>
                                                            <h4 className="font-medium">{course.title}</h4>
                                                            <p className="text-xs text-muted-foreground">{course.description}</p>
                                                        </div>
                                                    </div>
                                                    <a href={course.contentUrl} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="outline" size="sm">
                                                            <Download className="mr-2 h-4 w-4"/> Download
                                                        </Button>
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm p-4">No course materials have been uploaded for this program yet.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
}