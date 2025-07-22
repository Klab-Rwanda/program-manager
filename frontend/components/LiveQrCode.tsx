"use client"
import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { RefreshCw } from "lucide-react"

interface LiveQRCodeProps {
  data: string
  size?: number
  className?: string
}

export default function LiveQRCode({ data, size = 200, className = "" }: LiveQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current || !data) return

      setIsLoading(true)
      setError(null)

      try {
        await QRCode.toCanvas(canvasRef.current, data, {
          width: size,
          margin: 2,
          color: {
            dark: "#1f497d",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        })
      } catch (err) {
        console.error("Error generating QR code:", err)
        setError("Failed to generate QR code")
      } finally {
        setIsLoading(false)
      }
    }

    generateQRCode()
  }, [data, size])

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-center text-gray-500">
          <div className="text-xs">QR Code Error</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg"
          style={{ width: size, height: size }}
        >
          <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`rounded-lg ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        style={{ width: size, height: size }}
      />
      {!isLoading && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-gray-500">Live Session QR</p>
        </div>
      )}
    </div>
  )
}
