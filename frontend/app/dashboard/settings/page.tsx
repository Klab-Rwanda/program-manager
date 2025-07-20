// app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { User, Key, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/RoleContext";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user, setUser } = useAuth(); // We need setUser to update the context after a name change
  
  // State for forms
  const [name, setName] = useState(user?.name || "");
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  
  // State for loading and errors
  const [isNameSubmitting, setIsNameSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    // If user data loads after initial render, update the name field
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsNameSubmitting(true);
    setNameError("");

    if (!name.trim()) {
        setNameError("Name cannot be empty.");
        setIsNameSubmitting(false);
        return;
    }

    try {
      const response = await api.patch("/users/update-account", { name });
      const updatedUser = response.data.data;
      
      // Update the user in the context and localStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      alert("Profile updated successfully!");

    } catch (err: any) {
      setNameError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsNameSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
        setPasswordError("New password must be at least 6 characters long.");
        return;
    }

    setIsPasswordSubmitting(true);
    try {
      await api.post("/users/change-password", {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess("Password changed successfully! You may need to log in again.");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" }); // Clear fields
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

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
                  />
                  {nameError && <p className="text-sm text-destructive mt-1">{nameError}</p>}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(p => ({...p, confirmPassword: e.target.value}))}
                  />
                </div>
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
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