// app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { User, Key, Save, Loader2, AlertCircle, XCircle } from "lucide-react"; // Added AlertCircle, XCircle
import { useAuth } from "@/lib/contexts/RoleContext";
import api from "@/lib/api";
import { toast } from "sonner"; // Import toast for notifications

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert"; // For error display


export default function SettingsPage() {
  const { user, setUser, loading: authLoading } = useAuth(); // Access setUser to update context after name change
  
  // State for forms
  const [name, setName] = useState(user?.name || "");
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  
  // State for loading and errors
  const [isNameSubmitting, setIsNameSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null); // Changed to nullable string
  const [passwordError, setPasswordError] = useState<string | null>(null); // Changed to nullable string
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null); // Changed to nullable string

  // Effect to update name field if user data loads after initial render
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  // Handle profile information save
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsNameSubmitting(true);
    setNameError(null); // Clear previous errors

    if (!name.trim()) {
        setNameError("Full name cannot be empty.");
        setIsNameSubmitting(false);
        toast.error("Full name cannot be empty.");
        return;
    }

    try {
      const response = await api.patch("/users/update-account", { name });
      const updatedUser = response.data.data;
      
      // Update the user in the AuthContext and localStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success("Profile updated successfully!");

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to update profile.";
      setNameError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setIsNameSubmitting(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null); // Clear previous errors
    setPasswordSuccess(null); // Clear previous success messages

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError("All password fields are required.");
        toast.error("All password fields are required.");
        return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError("New passwords do not match.");
        toast.error("New passwords do not match.");
        return;
    }
    if (passwordData.newPassword.length < 8) { // Basic password strength validation
        setPasswordError("New password must be at least 8 characters long.");
        toast.error("New password must be at least 8 characters long.");
        return;
    }
    if (passwordData.oldPassword === passwordData.newPassword) {
        setPasswordError("New password cannot be the same as the old password.");
        toast.error("New password cannot be the same as the old password.");
        return;
    }


    setIsPasswordSubmitting(true);
    try {
      await api.post("/users/change-password", {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      
      setPasswordSuccess("Password changed successfully! Please log in again with your new password.");
      toast.success("Password changed successfully! Please log in again.");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" }); // Clear fields after success

      // Optionally force logout after password change for security
      // await logout(); // Assuming logout is available in useAuth
      // router.push('/auth/login'); // Redirect to login

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to change password.";
      setPasswordError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  // Render nothing or a loading spinner if authentication is still loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Access control: All authenticated users can see this page
  if (!user && !authLoading) {
    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You must be logged in to view your settings.</p></CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>Password & Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={user?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isNameSubmitting}
                  />
                  {nameError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                            {nameError}
                            <Button variant="ghost" size="sm" onClick={() => setNameError(null)}><XCircle className="h-4 w-4" /></Button>
                        </AlertDescription>
                    </Alert>
                  )}
                </div>
                <Button type="submit" disabled={isNameSubmitting}>
                  {isNameSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password. You will be logged out after a successful change.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData(p => ({...p, oldPassword: e.target.value}))}
                    disabled={isPasswordSubmitting}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(p => ({...p, newPassword: e.target.value}))}
                    disabled={isPasswordSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(p => ({...p, confirmPassword: e.target.value}))}
                    disabled={isPasswordSubmitting}
                  />
                </div>
                {passwordError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                            {passwordError}
                            <Button variant="ghost" size="sm" onClick={() => setPasswordError(null)}><XCircle className="h-4 w-4" /></Button>
                        </AlertDescription>
                    </Alert>
                )}
                {passwordSuccess && (
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{passwordSuccess}</AlertDescription>
                    </Alert>
                )}
                <Button type="submit" disabled={isPasswordSubmitting}>
                   {isPasswordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}