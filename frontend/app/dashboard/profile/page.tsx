// app/dashboard/profile/page.tsx
"use client";

import { useAuth } from "@/lib/contexts/RoleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
// FIX: Import the missing Clock icon
import { Mail, Briefcase, Calendar, Clock } from "lucide-react"; 
import { getRoleDisplayName } from "@/lib/roles";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <div>User not found. Please log in again.</div>;
    }
    
    const getInitials = (name: string = "") => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                    <p className="text-muted-foreground">View your account details and role information.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/settings')}>
                    Edit Profile
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <Avatar className="h-24 w-24 border-2 border-primary">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                            <AvatarFallback className="text-3xl">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left">
                            <CardTitle className="text-2xl">{user.name}</CardTitle>
                            <CardDescription className="text-lg">
                                <Badge className="mt-2 text-base">{getRoleDisplayName(user.role)}</Badge>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email}</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Account Details</h3>
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Member since: {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                         <div className="flex items-center gap-3 text-sm">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>Status: <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-green-100 text-green-800" : ""}>{user.status}</Badge></span>
                        </div>
                         {user.lastLogin && (
                             <div className="flex items-center gap-3 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Last login: {new Date(user.lastLogin).toLocaleString()}</span>
                            </div>
                         )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}