"use client"

import { useState, useEffect } from "react"
import { 
  Server, 
  Activity, 
  Wifi, 
  HardDrive, 
  Cpu, 
  Memory, 
  Network, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Eye,
  Power,
  Database,
  Monitor,
  Shield
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface ServerStatus {
  id: string
  name: string
  status: "online" | "offline" | "warning"
  ip: string
  uptime: string
  cpu: number
  memory: number
  disk: number
  network: number
  lastUpdate: string
  services: Array<{
    name: string
    status: "running" | "stopped" | "error"
  }>
}

interface NetworkDevice {
  id: string
  name: string
  type: "router" | "switch" | "firewall" | "access_point"
  status: "online" | "offline" | "warning"
  ip: string
  uptime: string
  latency: number
  packetLoss: number
  throughput: number
}

interface SystemAlert {
  id: string
  severity: "critical" | "warning" | "info"
  message: string
  timestamp: string
  source: string
  resolved: boolean
}

export default function SystemMonitoringPage() {
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [selectedServer, setSelectedServer] = useState<ServerStatus | null>(null)
  const [showServerDetails, setShowServerDetails] = useState(false)

  const [servers] = useState<ServerStatus[]>([
    {
      id: "web01",
      name: "Web Server 01",
      status: "online",
      ip: "192.168.1.10",
      uptime: "15 days, 8 hours",
      cpu: 45,
      memory: 67,
      disk: 23,
      network: 78,
      lastUpdate: "2 minutes ago",
      services: [
        { name: "Apache", status: "running" },
        { name: "MySQL", status: "running" },
        { name: "Redis", status: "running" },
        { name: "Nginx", status: "running" }
      ]
    },
    {
      id: "db01",
      name: "Database Server 01",
      status: "warning",
      ip: "192.168.1.20",
      uptime: "8 days, 12 hours",
      cpu: 78,
      memory: 89,
      disk: 45,
      network: 34,
      lastUpdate: "1 minute ago",
      services: [
        { name: "PostgreSQL", status: "running" },
        { name: "MongoDB", status: "running" },
        { name: "Redis", status: "error" },
        { name: "Backup Service", status: "stopped" }
      ]
    },
    {
      id: "app01",
      name: "Application Server 01",
      status: "online",
      ip: "192.168.1.30",
      uptime: "22 days, 3 hours",
      cpu: 32,
      memory: 54,
      disk: 12,
      network: 56,
      lastUpdate: "30 seconds ago",
      services: [
        { name: "Node.js", status: "running" },
        { name: "PM2", status: "running" },
        { name: "Docker", status: "running" },
        { name: "Monitoring Agent", status: "running" }
      ]
    },
    {
      id: "backup01",
      name: "Backup Server 01",
      status: "online",
      ip: "192.168.1.40",
      uptime: "45 days, 7 hours",
      cpu: 15,
      memory: 28,
      disk: 67,
      network: 23,
      lastUpdate: "5 minutes ago",
      services: [
        { name: "Backup Service", status: "running" },
        { name: "FTP Server", status: "running" },
        { name: "Monitoring Agent", status: "running" }
      ]
    }
  ])

  const [networkDevices] = useState<NetworkDevice[]>([
    {
      id: "router01",
      name: "Core Router",
      type: "router",
      status: "online",
      ip: "192.168.1.1",
      uptime: "99.9%",
      latency: 2,
      packetLoss: 0.1,
      throughput: 950
    },
    {
      id: "switch01",
      name: "Main Switch",
      type: "switch",
      status: "online",
      ip: "192.168.1.2",
      uptime: "99.7%",
      latency: 1,
      packetLoss: 0.05,
      throughput: 1200
    },
    {
      id: "firewall01",
      name: "Firewall",
      type: "firewall",
      status: "warning",
      ip: "192.168.1.3",
      uptime: "98.5%",
      latency: 5,
      packetLoss: 0.3,
      throughput: 800
    },
    {
      id: "ap01",
      name: "Access Point 1",
      type: "access_point",
      status: "online",
      ip: "192.168.1.4",
      uptime: "99.2%",
      latency: 3,
      packetLoss: 0.2,
      throughput: 450
    }
  ])

  const [alerts] = useState<SystemAlert[]>([
    {
      id: "1",
      severity: "warning",
      message: "High CPU usage on DB01 (78%)",
      timestamp: "5 minutes ago",
      source: "db01",
      resolved: false
    },
    {
      id: "2",
      severity: "critical",
      message: "Redis service stopped on DB01",
      timestamp: "10 minutes ago",
      source: "db01",
      resolved: false
    },
    {
      id: "3",
      severity: "warning",
      message: "High latency on Firewall (5ms)",
      timestamp: "15 minutes ago",
      source: "firewall01",
      resolved: false
    },
    {
      id: "4",
      severity: "info",
      message: "Backup completed successfully",
      timestamp: "1 hour ago",
      source: "backup01",
      resolved: true
    }
  ])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLoading(false)
    }
    loadData()
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLastRefresh(new Date())
      setLoading(false)
    }, 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "offline":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 dark:bg-green-900/20"
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-900/20"
      case "offline":
        return "bg-red-100 dark:bg-red-900/20"
      default:
        return "bg-gray-100 dark:bg-gray-900/20"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-100"
      case "warning":
        return "text-yellow-600 bg-yellow-100"
      case "info":
        return "text-blue-600 bg-blue-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getServiceStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "stopped":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const totalServers = servers.length
  const onlineServers = servers.filter(s => s.status === "online").length
  const warningServers = servers.filter(s => s.status === "warning").length
  const offlineServers = servers.filter(s => s.status === "offline").length

  const totalDevices = networkDevices.length
  const onlineDevices = networkDevices.filter(d => d.status === "online").length
  const warningDevices = networkDevices.filter(d => d.status === "warning").length

  const activeAlerts = alerts.filter(a => !a.resolved).length
  const criticalAlerts = alerts.filter(a => a.severity === "critical" && !a.resolved).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of servers, network devices, and system alerts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineServers}/{totalServers}</div>
            <p className="text-xs text-muted-foreground">
              {warningServers} warnings, {offlineServers} offline
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Devices</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineDevices}/{totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              {warningDevices} warnings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts} critical
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Good</div>
            <p className="text-xs text-muted-foreground">
              All critical systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="servers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="servers">Servers ({totalServers})</TabsTrigger>
          <TabsTrigger value="network">Network ({totalDevices})</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({activeAlerts})</TabsTrigger>
        </TabsList>

        <TabsContent value="servers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {servers.map((server) => (
              <Card key={server.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getStatusBgColor(server.status)}`}>
                        <Server className={`h-5 w-5 ${getStatusColor(server.status)}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{server.name}</CardTitle>
                        <CardDescription>{server.ip}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={server.status === "online" ? "default" : "secondary"}>
                      {server.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Uptime:</span>
                      <p className="font-medium">{server.uptime}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Update:</span>
                      <p className="font-medium">{server.lastUpdate}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CPU</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={server.cpu} className="w-20" />
                        <span className="text-sm font-medium">{server.cpu}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Memory</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={server.memory} className="w-20" />
                        <span className="text-sm font-medium">{server.memory}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Disk</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={server.disk} className="w-20" />
                        <span className="text-sm font-medium">{server.disk}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Network</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={server.network} className="w-20" />
                        <span className="text-sm font-medium">{server.network}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Services</h4>
                    <div className="space-y-1">
                      {server.services.map((service, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{service.name}</span>
                          {getServiceStatusIcon(service.status)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedServer(server)
                      setShowServerDetails(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {networkDevices.map((device) => (
              <Card key={device.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getStatusBgColor(device.status)}`}>
                        {device.type === "router" && <Network className={`h-5 w-5 ${getStatusColor(device.status)}`} />}
                        {device.type === "switch" && <Activity className={`h-5 w-5 ${getStatusColor(device.status)}`} />}
                        {device.type === "firewall" && <Shield className={`h-5 w-5 ${getStatusColor(device.status)}`} />}
                        {device.type === "access_point" && <Wifi className={`h-5 w-5 ${getStatusColor(device.status)}`} />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{device.name}</CardTitle>
                        <CardDescription>{device.ip}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={device.status === "online" ? "default" : "secondary"}>
                      {device.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Uptime:</span>
                      <p className="font-medium">{device.uptime}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Latency:</span>
                      <p className="font-medium">{device.latency}ms</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Packet Loss:</span>
                      <p className="font-medium">{device.packetLoss}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Throughput:</span>
                      <p className="font-medium">{device.throughput} Mbps</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Performance</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={device.latency > 10 ? 100 - device.latency * 5 : 100 - device.latency * 2} className="w-20" />
                        <span className="text-sm font-medium">
                          {device.latency > 10 ? <TrendingDown className="h-4 w-4 text-red-600" /> : <TrendingUp className="h-4 w-4 text-green-600" />}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={alert.resolved ? "opacity-60" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                        {alert.severity === "critical" && <AlertTriangle className="h-4 w-4" />}
                        {alert.severity === "warning" && <Clock className="h-4 w-4" />}
                        {alert.severity === "info" && <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.timestamp} • Source: {alert.source}
                        </p>
                      </div>
                    </div>
                    <Badge variant={alert.resolved ? "secondary" : "default"}>
                      {alert.resolved ? "Resolved" : "Active"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Server Details Modal */}
      <Dialog open={showServerDetails} onOpenChange={setShowServerDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedServer?.name}</DialogTitle>
            <DialogDescription>
              Detailed server information and metrics
            </DialogDescription>
          </DialogHeader>
          {selectedServer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <p className="text-sm mt-1">{selectedServer.status}</p>
                </div>
                <div>
                  <Label>IP Address</Label>
                  <p className="text-sm mt-1">{selectedServer.ip}</p>
                </div>
                <div>
                  <Label>Uptime</Label>
                  <p className="text-sm mt-1">{selectedServer.uptime}</p>
                </div>
                <div>
                  <Label>Last Update</Label>
                  <p className="text-sm mt-1">{selectedServer.lastUpdate}</p>
                </div>
              </div>

              <div>
                <Label>Resource Usage</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CPU Usage</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={selectedServer.cpu} className="w-32" />
                      <span className="text-sm font-medium">{selectedServer.cpu}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={selectedServer.memory} className="w-32" />
                      <span className="text-sm font-medium">{selectedServer.memory}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Disk Usage</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={selectedServer.disk} className="w-32" />
                      <span className="text-sm font-medium">{selectedServer.disk}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network Usage</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={selectedServer.network} className="w-32" />
                      <span className="text-sm font-medium">{selectedServer.network}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Services</Label>
                <div className="space-y-2 mt-2">
                  {selectedServer.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{service.name}</span>
                      {getServiceStatusIcon(service.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 