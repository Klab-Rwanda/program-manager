"use client"

import { useState } from "react"
import { Mail, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      // TODO: Replace this with real API call
      await new Promise((res) => setTimeout(res, 1000))
      setMessage("A password reset link has been sent to your email.")
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-['Inter'] bg-gray-50">
      {/* Left Panel */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-start p-8 md:p-20 z-10">
        <div className="animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4 md:mb-6">
            Reset Your Password.
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-xl mb-2">
            Forgot your password? Don’t worry — we’ll send you a reset link.
          </p>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            Let’s get you back into your account.
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
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 flex items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <BookOpen className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">Forgot Password</h2>
            <p className="text-gray-200 text-sm md:text-base">
              Enter your email to receive a reset link.
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
            <label htmlFor="email" className="text-sm font-medium mb-2 block text-gray-200">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-4 pl-12 rounded-lg border border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 text-base transition-all duration-200 focus:outline-none focus:border-blue-400 focus:bg-white/20 focus:shadow-[0_0_0_3px_rgba(96,165,250,0.4)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-gray-600 py-4 font-semibold text-base border-none rounded-lg cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-gray-300 hover:text-white hover:font-bold disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>

          <div className="text-center mt-2">
            <a
              href="/"
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
  )
}
