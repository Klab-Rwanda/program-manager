"use client"
import { useState, useEffect, useCallback } from "react"
import {
  MapPin,
  QrCode,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Wifi,
  RefreshCw,
  Timer,
  Map,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import LiveMap from "@/components/LiveMap" // New import
import LiveQRCode from "@/components/LiveQrCode" // New import

// Type definitions
interface Location {
  lat: number
  lng: number
  address: string
  radius: number
}

interface UserLocation {
  lat: number
  lng: number
  accuracy: number
}

interface ProgramId {
  name: string
}

interface FacilitatorId {
  name: string
}

interface Session {
  _id: string
  sessionId: string
  title: string
  type: "physical" | "online"
  programId: ProgramId
  facilitatorId: { name: string }
  startTime: string
  endTime: string
  location: Location
  status: "active" | "inactive"
  qrCodeData: string
  accessLink: string
}

type AttendanceStatus = "pending" | "success" | "failed" | "location_denied"

export default function Index() {
  // Changed export name to Index
  // State management
  const [selectedSessionType, setSelectedSessionType] = useState<"physical" | "online" | null>(null)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>("pending")
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [sessionLocation, setSessionLocation] = useState<Location | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [isScanning, setIsScanning] = useState<boolean>(false) // Added isScanning state
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState<boolean>(false)

  // kLab Rwanda location
  const klabLocation: Location = {
    lat: -1.9441,
    lng: 30.0619,
    address: "44 KG 548 St, Kigali - kLab Rwanda",
    radius: 100, // meters
  }

  // Mock session data (now serves as a base)
  const baseMockSession: Omit<Session, "type"> = {
    _id: "session_001",
    sessionId: "WEB_DEV_001",
    title: "Advanced JavaScript - Module 3",
    programId: { name: "Web Development Bootcamp" },
    facilitatorId: { name: "Bonae Ineza" },
    startTime: new Date(Date.now() + 2 * 60000).toISOString(), // 2 minutes from now
    endTime: new Date(Date.now() + 7 * 60000).toISOString(), // 7 minutes from now (5 min attendance window)
    location: klabLocation,
    status: "active",
    qrCodeData: "SESSION_WEB_DEV_001_FACILITATOR_QR", // This is the facilitator's session QR
    accessLink: "https://attend.klab.rw/join/WEB_DEV_001",
  }

  // Handle session type selection
  const handleSelectSessionType = useCallback((type: "physical" | "online") => {
    setSelectedSessionType(type)
    const sessionWithChosenType: Session = {
      ...baseMockSession,
      type: type,
    }
    setCurrentSession(sessionWithChosenType)
    if (type === "physical") {
      setSessionLocation(sessionWithChosenType.location)
    }
  }, [])

  // Timer for session countdown
  useEffect(() => {
    if (!currentSession) return // Only run timer if a session is selected

    const updateTimer = (): void => {
      const now = new Date()
      const endTime = new Date(currentSession.endTime)
      const diff = endTime.getTime() - now.getTime()
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      if (diff > 0) {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
        setSessionExpired(false)
      } else {
        setTimeRemaining("Expired")
        setSessionExpired(true)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [currentSession])

  // Function to open Google Maps in a new tab
  const handleViewOnMap = useCallback(() => {
    if (sessionLocation) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${sessionLocation.lat},${sessionLocation.lng}&travelmode=driving`
      window.open(googleMapsUrl, "_blank")
    }
  }, [sessionLocation])

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  // Get user's current location
  const getCurrentLocation = useCallback((): Promise<UserLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"))
        return
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }

      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const location: UserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
          resolve(location)
        },
        (error: GeolocationPositionError) => {
          let errorMessage = "Failed to get location"
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enable location services."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable."
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out."
              break
          }
          reject(new Error(errorMessage))
        },
        options,
      )
    })
  }, [])

  // Simulate saving attendance to backend
  const saveAttendanceToBackend = async (
    sessionId: string,
    studentId: string, // Assuming student ID is part of the QR data or user context
    sessionType: "physical" | "online",
    locationData?: UserLocation,
    distanceData?: number,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, simulate successful save
      return {
        success: true,
        message: `Attendance marked successfully for ${sessionType} session`,
      }
    } catch (error) {
      console.error("Error saving attendance to backend:", error)
      return { success: false, message: error instanceof Error ? error.message : "Unknown error saving attendance." }
    }
  }

  // Mark physical attendance
  const markPhysicalAttendance = async (): Promise<void> => {
    if (sessionExpired) {
      setError("Attendance period has ended. Contact your instructor.")
      return
    }
    try {
      setLoading(true)
      setIsScanning(true) // Set scanning true for physical attendance
      setError(null)

      const location = await getCurrentLocation()
      setUserLocation(location)

      if (sessionLocation) {
        const dist = calculateDistance(location.lat, location.lng, sessionLocation.lat, sessionLocation.lng)
        setDistance(Math.round(dist))

        // Add scanning animation delay
        await new Promise((resolve) => setTimeout(resolve, 2000))

        if (dist <= sessionLocation.radius) {
          // Call backend API to save physical attendance
          const backendResult = await saveAttendanceToBackend(
            currentSession!.sessionId, // currentSession is guaranteed to exist here
            "STUDENT_ID_DEMO", // Placeholder student ID
            "physical",
            location,
            Math.round(dist),
          )

          if (backendResult.success) {
            setAttendanceStatus("success")
          } else {
            setAttendanceStatus("failed")
            setError(backendResult.message)
          }
        } else {
          setAttendanceStatus("failed")
          setError(
            `You are ${Math.round(dist)}m away from kLab. You need to be within ${sessionLocation.radius}m to mark attendance.`,
          )
        }
      }
    } catch (err) {
      console.error("Location or backend error:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      setAttendanceStatus("location_denied")
    } finally {
      setLoading(false)
      setIsScanning(false) // Reset scanning state
    }
  }

  // Handle QR code attendance (simplified: no camera, no face recognition)
  const markQRAttendance = async (): Promise<void> => {
    if (sessionExpired) {
      setError("Attendance period has ended. Contact your instructor.")
      return
    }
    try {
      setLoading(true)
      setError(null)
      // Simulate a brief moment for the student to acknowledge the QR code
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Call backend API to save online attendance
      const backendResult = await saveAttendanceToBackend(
        currentSession!.sessionId, // currentSession is guaranteed to exist here
        "STUDENT_ID_DEMO", // Placeholder student ID
        "online",
      )

      if (backendResult.success) {
        setAttendanceStatus("success")
      } else {
        setAttendanceStatus("failed")
        setError(backendResult.message)
      }
    } catch (err) {
      console.error("Online attendance error:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      setAttendanceStatus("failed")
    } finally {
      setLoading(false)
    }
  }

  // Reset attendance state
  const resetAttendance = (): void => {
    setAttendanceStatus("pending")
    setError(null)
    setUserLocation(null)
    setDistance(null)
    setIsScanning(false) // Reset scanning state
    setSelectedSessionType(null) // Allow user to choose again
    setCurrentSession(null)
  }

  // Render session type selection if not chosen yet
  if (!selectedSessionType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center max-w-sm w-full space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-[#1f497d] rounded-xl flex items-center justify-center shadow-sm">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-2xl">Choose Session Type</h1>
              <p className="text-sm text-gray-500">How will you be attending today?</p>
            </div>
          </div>
          <div className="space-y-4">
            <Button
              onClick={() => handleSelectSessionType("physical")}
              className="w-full bg-[#1f497d] hover:bg-[#1a3d6b] text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <MapPin className="h-5 w-5" />
              Physical Session
            </Button>
            <Button
              onClick={() => handleSelectSessionType("online")}
              className="w-full bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Wifi className="h-5 w-5" />
              Online Session
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Render loading state if session is being prepared after selection
  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Preparing session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1f497d] rounded-xl flex items-center justify-center shadow-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Student Attendance</h1>
                <p className="text-sm text-gray-500">Mark your presence</p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  sessionExpired
                    ? "text-red-600"
                    : timeRemaining && timeRemaining.startsWith("0:")
                      ? "text-orange-600"
                      : "text-gray-600"
                }`}
              >
                <Timer className="h-4 w-4" />
                {timeRemaining}
              </div>
              <p className="text-xs text-gray-500">Time left</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Session Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900 mb-1 text-lg">{currentSession.title}</h2>
              <p className="text-sm text-gray-600">{currentSession.programId.name}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#1f497d]" />
                <span>{new Date(currentSession.startTime).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#1f497d]" />
                <span>
                  {new Date(currentSession.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentSession.type === "physical" ? (
                  <MapPin className="h-4 w-4 text-[#1f497d]" />
                ) : (
                  <QrCode className="h-4 w-4 text-[#1f497d]" />
                )}
                <span className="text-sm font-medium text-gray-700 capitalize">{currentSession.type} Session</span>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentSession.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}
              >
                {currentSession.status}
              </span>
            </div>
          </div>
        </div>
        {/* Session Expired Warning */}
        {sessionExpired && attendanceStatus === "pending" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Attendance Period Ended</h3>
                <p className="text-sm text-red-700 mt-1">
                  The attendance window has closed. Please contact your instructor for assistance.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Attendance Status */}
        {attendanceStatus !== "pending" && (
          <div
            className={`rounded-xl border p-6 ${
              attendanceStatus === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {attendanceStatus === "success" ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold ${attendanceStatus === "success" ? "text-green-900" : "text-red-900"}`}>
                  {attendanceStatus === "success" ? "Attendance Marked Successfully!" : "Attendance Failed"}
                </h3>
                <p className={`text-sm mt-1 ${attendanceStatus === "success" ? "text-green-700" : "text-red-700"}`}>
                  {attendanceStatus === "success"
                    ? `Successfully marked present for ${currentSession.title}`
                    : error || "Failed to mark attendance"}
                </p>
                {attendanceStatus === "success" && userLocation && distance !== null && (
                  <div className="mt-3 p-3 bg-white/50 rounded-lg">
                    <p className="text-xs text-green-700 font-medium">
                      📍 Marked from {distance}m away • {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {attendanceStatus !== "success" && !sessionExpired && (
              <Button
                onClick={resetAttendance}
                variant="link"
                className="mt-4 text-sm text-[#1f497d] hover:text-[#1a3d6b] font-medium transition-colors p-0 h-auto"
              >
                Try Again
              </Button>
            )}
          </div>
        )}
        {/* Physical Session Attendance */}
        {currentSession.type === "physical" && attendanceStatus === "pending" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1f497d]/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-[#1f497d]" />
                </div>
                <h3 className="font-semibold text-gray-900">Location-Based Attendance</h3>
              </div>

              {/* Live Interactive Map */}
              <LiveMap
                sessionLocation={sessionLocation!}
                userLocation={userLocation}
                isScanning={isScanning}
                distance={distance}
              />

              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">📍 Class Location:</p>
                  <p className="text-sm text-gray-800 font-medium">{sessionLocation?.address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be within {sessionLocation?.radius}m radius to mark attendance
                  </p>
                </div>

                {userLocation && distance !== null && (
                  <div
                    className={`rounded-lg p-4 ${
                      distance <= (sessionLocation?.radius ?? 0)
                        ? "bg-green-50 border border-green-200"
                        : "bg-orange-50 border border-orange-200"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium mb-1 ${
                        distance <= (sessionLocation?.radius ?? 0) ? "text-green-800" : "text-orange-800"
                      }`}
                    >
                      Your Distance:
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        distance <= (sessionLocation?.radius ?? 0) ? "text-green-900" : "text-orange-900"
                      }`}
                    >
                      {distance}m away
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        distance <= (sessionLocation?.radius ?? 0) ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      GPS accuracy: ±{Math.round(userLocation.accuracy)}m
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={markPhysicalAttendance}
                disabled={loading || sessionExpired}
                className="w-full bg-[#1f497d] hover:bg-[#1a3d6b] disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {isScanning ? "Scanning Location..." : "Getting Location..."}
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    Mark Attendance
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center">
                <Button
                  onClick={handleViewOnMap}
                  variant="outline"
                  size="sm"
                  className="text-[#1f497d] hover:text-[#1a3d6b] border-[#1f497d]/20 bg-transparent"
                >
                  <Map className="h-4 w-4 mr-2" />
                  Open in Google Maps
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Online Session QR Display and Attendance */}
        {currentSession.type === "online" && attendanceStatus === "pending" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1f497d]/10 rounded-lg">
                  <QrCode className="h-5 w-5 text-[#1f497d]" />
                </div>
                <h3 className="font-semibold text-gray-900">Online Session Attendance</h3>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">📋 Steps to mark attendance:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#1f497d] text-white rounded-full flex items-center justify-center text-xs font-medium">
                        1
                      </span>
                      <p className="text-xs text-gray-600">Confirm you see the QR code displayed by your instructor.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#1f497d] text-white rounded-full flex items-center justify-center text-xs font-medium">
                        2
                      </span>
                      <p className="text-xs text-gray-600">Click 'Mark Attendance' below.</p>
                    </div>
                  </div>
                </div>

                {/* Live QR Code Display */}
                <div className="bg-gray-100 rounded-xl overflow-hidden w-full h-48 relative flex items-center justify-center p-4">
                  <LiveQRCode data={currentSession.qrCodeData} size={180} className="mx-auto" />
                </div>
              </div>

              <Button
                onClick={markQRAttendance}
                disabled={loading || sessionExpired}
                className="w-full bg-[#1f497d] hover:bg-[#1a3d6b] disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Marking Attendance...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    Mark Attendance
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        {/* Session Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-[#1f497d]" />
            Session Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Instructor:</span>
              <span className="text-gray-900 font-medium">{currentSession.facilitatorId.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Session ID:</span>
              <span className="text-gray-900 font-mono text-xs bg-gray-50 px-2 py-1 rounded">
                {currentSession.sessionId}
              </span>
            </div>
            {currentSession.type === "online" && currentSession.accessLink && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-gray-600 text-xs mb-2 flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Join Link:
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[#1f497d] text-xs break-all font-medium">{currentSession.accessLink}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Help Section */}
        <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Need Help?</h4>
              <p className="text-sm text-gray-600">
                Having trouble marking attendance? Contact your instructor or kLab IT support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
