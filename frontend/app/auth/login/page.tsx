"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, BookOpen } from "lucide-react"
import { useAuth } from "@/lib/contexts/RoleContext"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err) {
      setError("Invalid email or password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const demoCredentials = [
    { role: "Super Admin", email: "admin@klab.rw", password: "admin123" },
    { role: "Program Manager", email: "manager@klab.rw", password: "manager123" },
    { role: "Facilitator", email: "facilitator@klab.rw", password: "facilitator123" },
    { role: "Trainee", email: "trainee@klab.rw", password: "trainee123" },
    { role: "IT Support", email: "support@klab.rw", password: "support123" }
  ]

  return (
    <div className="min-h-screen flex font-['Inter'] bg-gray-50 overflow-hidden">
      {/* Left Panel (Branding & Welcome Text) */}
      <div className="w-1/2 bg-white flex flex-col justify-center items-start p-20 box-border z-10">
        <div className="animate-fadeIn">
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6 animate-fadeIn">
            Unlock Your Potential.
          </h1>
          <div className="animate-fadeInDelayed opacity-0">
            <p className="text-lg text-gray-600 leading-relaxed max-w-lg mb-4">
              Welcome to the Klab ecosystem. Your central hub for learning, managing, and creating the future of tech in Rwanda.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Let's build something amazing together.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel (The Form with the Angled Shape) */}
      <div className="w-[55%] text-white flex items-center justify-center p-8 pl-[15%] box-border relative -ml-[5%] z-20 bg-gradient-to-br bg-[#1f497d] bg-[length:400%_400%] animate-gradientAnimation clip-path-polygon">
        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-6 relative z-20 opacity-0 animate-fadeInDelayed">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white shadow-lg">
                <BookOpen className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-3xl font-semibold mb-2">Welcome Back!</h2>
            <p className="text-gray-200">
              Sign in to access your dashboard.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-600 border border-red-400 text-white px-3 py-3 rounded-md text-center">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="text-sm font-medium mb-2 block text-gray-200">
              Email
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

          <div>
            <label htmlFor="password" className="text-sm font-medium mb-2 block text-gray-200">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
           {isLoading ? 'ACCESSING...' : 'ACCESS DASHBOARD'}
           </button>


          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <h3 className="text-sm font-semibold text-white mb-3">Demo Credentials</h3>
            <div className="space-y-2">
              {demoCredentials.map((credential, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <span className="text-xs text-gray-200">{credential.role}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(credential.email)
                      setPassword(credential.password)
                    }}
                    className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded transition-colors"
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
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
        
        @media screen and (max-width: 900px) {
          .clip-path-polygon {
            clip-path: none;
          }
        }
      `}</style>
    </div>
  )
} 