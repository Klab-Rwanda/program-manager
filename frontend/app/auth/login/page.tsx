"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      
      // Show a success toast to the user
      toast.success("Login Successful!", {
        description: "Redirecting you to the dashboard...",
        duration: 2000,
      });
      
      // Use window.location.href to force a full page reload.
      // This ensures all contexts and states are re-initialized correctly.
      // A short timeout allows the user to see the success toast.
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Invalid email or password. Please try again.";
      setError(errorMessage);
      setIsLoading(false); // Only set loading to false on error
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-['Inter'] bg-gray-50">
      {/* Left Branding Panel */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-start p-8 md:p-20 z-10">
        <div className="animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4 md:mb-6">
            Unlock Your Potential.
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-xl mb-2">
            Welcome to the kLab ecosystem. Your central hub for learning, managing, and creating the future of tech in Rwanda.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full md:w-[55%] flex items-center justify-center p-6 sm:p-10 md:pl-[15%] relative bg-[#1f497d] text-white animate-gradientAnimation clip-path-polygon md:clip-path-polygon">
        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-6 animate-fadeInDelayed">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 flex items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <BookOpen className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">Welcome Back!</h2>
            <p className="text-gray-200 text-sm md:text-base">
              Sign in to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="bg-red-600/90 border border-red-400 text-white px-4 py-3 rounded-md text-center text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-200">Email</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full h-12 px-4 pl-12 rounded-lg border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:border-blue-400 focus:bg-white/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-200">Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full h-12 px-4 pl-12 rounded-lg border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:border-blue-400 focus:bg-white/20"
              />
            </div>
            <div className="text-right">
              <a 
                href="/auth/forgot-password" 
                className="text-sm text-gray-200 hover:text-white transition-colors"
              >
                Forgot Password?
              </a>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full bg-white text-[#1f497d] font-semibold hover:bg-gray-200 disabled:opacity-70"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Signing In..." : "ACCESS DASHBOARD"}
          </Button>
        </form>
      </div>

      <style jsx>{`
        .animate-gradientAnimation { background-size: 400% 400%; animation: gradientAnimation 15s ease infinite; }
        @keyframes gradientAnimation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .clip-path-polygon { clip-path: polygon(20% 0, 100% 0, 100% 100%, 0% 100%); }
        @media (max-width: 768px) { .clip-path-polygon { clip-path: none; } }
      `}</style>
    </div>
  );
}