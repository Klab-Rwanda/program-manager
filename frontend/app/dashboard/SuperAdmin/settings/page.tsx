"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Save, Settings as SettingsIcon } from 'lucide-react';
import { getAppSettings, updateAppSettings, AppSettings } from '@/lib/services/settings.service';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const settingsSchema = z.object({
    siteName: z.string().min(3, "Site name must be at least 3 characters."),
    defaultProgramDurationDays: z.coerce.number().int().positive("Duration must be a positive number."),
    allowManagerProgramCreation: z.boolean(),
    sendWelcomeEmail: z.boolean(),
    adminNotificationEmail: z.string().email("Must be a valid email.").optional().or(z.literal('')),
});

export default function SystemSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<z.infer<typeof settingsSchema>>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            siteName: '',
            defaultProgramDurationDays: 90,
            allowManagerProgramCreation: true,
            sendWelcomeEmail: true,
            adminNotificationEmail: ''
        },
    });

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const settings = await getAppSettings();
            form.reset(settings); // Populate the form with fetched data
        } catch (err) {
            toast.error("Failed to load system settings.");
        } finally {
            setLoading(false);
        }
    }, [form]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const onSubmit = async (values: z.infer<typeof settingsSchema>) => {
        setIsSaving(true);
        try {
            await updateAppSettings(values);
            toast.success("Settings updated successfully!");
        } catch (err) {
            toast.error("Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground">Manage system-wide configurations and default behaviors.</p>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField name="siteName" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Site Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Program Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <FormField name="defaultProgramDurationDays" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Default Program Duration (Days)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Default duration when creating a new program.</FormDescription><FormMessage /></FormItem>
                            )}/>
                            <FormField name="allowManagerProgramCreation" control={form.control} render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Allow Program Manager Creation</FormLabel><FormDescription>Can Program Managers create their own programs (as drafts)?</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )}/>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Notification Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <FormField name="sendWelcomeEmail" control={form.control} render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Send Welcome Emails</FormLabel><FormDescription>Send an email with credentials to newly created users.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                            )}/>
                             <FormField name="adminNotificationEmail" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Admin Notification Email</FormLabel><FormControl><Input placeholder="admin@example.com" {...field} /></FormControl><FormDescription>Email address to receive system alerts (e.g., new program pending approval).</FormDescription><FormMessage /></FormItem>
                            )}/>
                        </CardContent>
                    </Card>
                    
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            Save Settings
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}