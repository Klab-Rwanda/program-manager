"use client"

import { useState, useEffect } from "react"
import { useRole } from "@/lib/contexts/RoleContext";
import api from "@/lib/api";
import { User, Bell, Shield, Palette, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  const { user, authLoading } = useRole();
  
  const [profileData, setProfileData] = useState({ name: "", email: "" });
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Populate form with user data once it's loaded from the context
    if (user) {
      setProfileData({ name: user.name, email: user.email });
    }
  }, [user]);

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/users/update-account', { name: profileData.name });
      alert("Profile updated successfully! The change will be reflected on your next login.");
    } catch(err: any) {
      alert(`Error: ${err.response?.data?.message || "Failed to update profile."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword.length < 6) {
      alert("New password must be at least 6 characters long.");
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/users/change-password', passwordData);
      alert("Password changed successfully! Please log out and log back in.");
      setPasswordData({ oldPassword: "", newPassword: "" });
    } catch(err: any) {
      alert(`Error: ${err.response?.data?.message || "Failed to change password."}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) return <div className="flex justify-center p-16"><Loader2 className="h-12 w-12 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-2" />Security</TabsTrigger>
          <TabsTrigger value="notifications" disabled><Bell className="h-4 w-4 mr-2" />Notifications</TabsTrigger>
          <TabsTrigger value="appearance" disabled><Palette className="h-4 w-4 mr-2" />Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (cannot be changed)</Label>
                <Input id="email" type="email" value={profileData.email} disabled />
              </div>
              <Button onClick={handleProfileSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your login password here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Current Password</Label>
                <Input id="oldPassword" type="password" value={passwordData.oldPassword} onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
              </div>
              <Button onClick={handlePasswordChange} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}