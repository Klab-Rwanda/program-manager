"use client";

import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams(); // ✅ Dynamic token from /reset-password/[token]

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Invalid or missing token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/auth/reset-password/${token}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: password,
          confirm: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setMessage("✅ Password reset successful! Redirecting to login...");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-['Inter'] bg-gray-50">
      {/* Left Panel */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-start p-8 md:p-20 z-10">
        <div className="animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4 md:mb-6">
            Create a New Password.
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-xl mb-2">
            Secure your account with a new password.
          </p>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            Password must be at least 8 characters.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-[55%] flex items-center justify-center p-6 sm:p-10 md:pl-[15%] relative bg-[#1f497d] text-white animate-gradientAnimation clip-path-polygon md:clip-path-polygon">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md flex flex-col gap-6 animate-fadeInDelayed"
        >
          <div className="text-center mb-4">
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">Reset Password</h2>
            <p className="text-gray-200 text-sm md:text-base">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="bg-red-600 border border-red-400 text-white px-3 py-3 rounded-md text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-600 border border-green-400 text-white px-3 py-3 rounded-md text-center">
              {message}
            </div>
          )}

          <div>
            <label htmlFor="password" className="text-sm font-medium mb-2 block text-gray-200">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-4 pl-12 rounded-lg border border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 text-base focus:outline-none focus:border-blue-400 focus:bg-white/20 focus:shadow-[0_0_0_3px_rgba(96,165,250,0.4)]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium mb-2 block text-gray-200">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-4 pl-12 rounded-lg border border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 text-base focus:outline-none focus:border-blue-400 focus:bg-white/20 focus:shadow-[0_0_0_3px_rgba(96,165,250,0.4)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-gray-600 py-4 font-semibold text-base border-none rounded-lg cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-gray-300 hover:text-white hover:font-bold disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>

          <div className="text-center mt-2">
            <a
              href="/auth/login"
              className="text-sm text-blue-300 hover:underline hover:text-white transition duration-200"
            >
              Back to Login
            </a>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInDelayed {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-fadeInDelayed {
          animation: fadeInDelayed 1.2s ease-out 0.4s forwards;
        }

        .animate-gradientAnimation {
          animation: gradientAnimation 15s ease infinite;
        }

        .clip-path-polygon {
          clip-path: polygon(20% 0, 100% 0, 100% 100%, 0% 100%);
        }

        @media (max-width: 768px) {
          .clip-path-polygon {
            clip-path: none;
          }
        }
      `}</style>
    </div>
  );
}
