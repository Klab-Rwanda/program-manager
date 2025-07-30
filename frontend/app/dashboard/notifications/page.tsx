"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Bell, CheckCheck, Loader2, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useNotifications } from "@/lib/contexts/NotificationContext"; // Use our context
import { markNotificationAsRead, Notification } from "@/lib/services/notification.service";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
    switch (type) {
        case 'success': return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
        case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />;
        case 'error': return <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
        case 'approval': return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />;
        default: return <Info className="h-5 w-5 text-gray-500 flex-shrink-0" />;
    }
};

export default function NotificationsPage() {
    const { notifications, unreadCount, isLoading, markAllAsRead } = useNotifications();

    const handleMarkOneRead = async (notification: Notification) => {
        if (notification.isRead) return; // Already read
        try {
            // Call the service to mark as read
            await markNotificationAsRead(notification._id);
            // Optimistically update the UI by mapping over existing notifications
            // Note: The `useNotifications` context does not currently trigger a refetch of all notifications
            // when `markNotificationAsRead` is called directly. For a full update without a page reload,
            // the `NotificationContext` would need to have a `refreshNotifications` function,
            // or an optimistic update logic inside its state.
            toast.info("Notification marked as read."); 
            // The context will eventually update from a new server event or a general refresh.
        } catch {
            toast.error("Failed to mark notification as read.");
        }
    };

    // Filter notifications for display
    const allNotifications = notifications;
    const unreadNotifications = notifications.filter(n => !n.isRead);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">All your system alerts and messages in one place.</p>
                </div>
                <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark All as Read
                </Button>
            </div>

            <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">All ({allNotifications.length})</TabsTrigger>
                    <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            {isLoading ? <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8"/></div>
                            : allNotifications.length === 0 ? <p className="p-8 text-center text-muted-foreground">You have no notifications.</p>
                            : (
                                <div className="divide-y">
                                    {allNotifications.map(notif => (
                                        <div 
                                            key={notif._id} 
                                            className={`flex items-start gap-4 p-4 cursor-pointer transition-colors ${!notif.isRead ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'}`}
                                            onClick={() => handleMarkOneRead(notif)} // Mark as read on click
                                        >
                                            <NotificationIcon type={notif.type}/>
                                            <div className="flex-1">
                                                <p className={`font-semibold ${!notif.isRead ? 'text-primary' : ''}`}>{notif.title}</p>
                                                <p className="text-sm text-muted-foreground">{notif.message}</p>
                                                <p className="text-xs text-muted-foreground mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                                            </div>
                                            {notif.link && (
                                                <Link href={notif.link} onClick={(e) => e.stopPropagation()}> {/* Prevent parent div click from firing again */}
                                                    <Button size="sm" variant="outline">View</Button>
                                                </Link>
                                            )}
                                            {!notif.isRead && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1"></div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="unread" className="mt-4">
                     <Card><CardContent className="p-0">
                        {isLoading ? <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8"/></div>
                        : unreadNotifications.length === 0 ? <p className="p-8 text-center text-muted-foreground">No unread notifications.</p>
                        : (
                            <div className="divide-y">
                                {unreadNotifications.map(notif => (
                                    <div 
                                        key={notif._id} 
                                        className="flex items-start gap-4 p-4 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                                        onClick={() => handleMarkOneRead(notif)}
                                    >
                                        <NotificationIcon type={notif.type}/>
                                        <div className="flex-1">
                                            <p className="font-semibold text-primary">{notif.title}</p>
                                            <p className="text-sm text-muted-foreground">{notif.message}</p>
                                            <p className="text-xs text-muted-foreground mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                                        </div>
                                        {notif.link && (
                                            <Link href={notif.link} onClick={(e) => e.stopPropagation()}>
                                                <Button size="sm" variant="outline">View</Button>
                                            </Link>
                                        )}
                                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1"></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent></Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}