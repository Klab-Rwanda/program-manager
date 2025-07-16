"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRole } from "@/lib/contexts/RoleContext"

export default function HomePage() {
  const { isAuthenticated } = useRole()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    } else {
      router.push("/auth/login")
    }
  }, [isAuthenticated, router])

  return null
} 