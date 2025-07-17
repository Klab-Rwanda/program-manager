"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  Users,
  GraduationCap,
  Award,
  BarChart3,
  Activity,
  ArrowUpRight,
  Eye,
  Download,
  Filter,
  Loader2,
  AlertTriangle,
  Target
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import api from "@/lib/api"

// Updated interface to reflect a mix of backend and frontend data
interface AnalyticsData {
  totalPrograms: number
  activePrograms: number
  totalTrainees: number
  totalFacilitators: number
  completionRate: number
  attendanceRate: number
  // Optional fields that will be mocked
  averageProgress?: number;
  totalRevenue?: number;
  monthlyGrowth?: number;
  programPerformance?: Array<{ name: string; enrollment: number; completion: number; satisfaction: number; revenue: number; }>;
  recentActivities?: Array<{ id: number; type: string; message: string; time: string; impact: string; }>;
  topPerformers?: Array<{ name: string; program: string; progress: number; attendance: number; projects: number; }>;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedProgram, setSelectedProgram] = useState("all")

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/reports/analytics');
        const backendData = response.data.data;

        // Mock data for UI components that don't have a backend endpoint yet
        const mockUIData = {
          averageProgress: 73,
          totalRevenue: 125000,
          monthlyGrowth: 15,
          programPerformance: [
            { name: "Data Science Bootcamp", enrollment: backendData.totalTrainees, completion: Math.round(backendData.totalTrainees * (backendData.completionRate / 100)), satisfaction: 4.8, revenue: 45000 },
            { name: "Web Development Mastery", enrollment: 32, completion: 28, satisfaction: 4.6, revenue: 32000 },
          ],
          recentActivities: [
            { id: 1, type: "enrollment", message: `${backendData.totalTrainees} total trainees`, time: "Live Data", impact: "+15%" },
            { id: 2, type: "completion", message: `Overall completion rate is ${backendData.completionRate}%`, time: "Live Data", impact: "+8%" },
          ],
          topPerformers: [
            { name: "John Doe", program: "Data Science", progress: 95, attendance: 98, projects: 10 },
            { name: "Jane Smith", program: "Web Development", progress: 88, attendance: 95, projects: 8 },
          ],
        };

        // Merge backend data with mock data
        setAnalyticsData({ ...backendData, ...mockUIData });
      } catch (err) {
        setError("Failed to load analytics data. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [timeRange]); // You can add filters here to refetch data if needed

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "enrollment":
        return <Users className="h-4 w-4 text-blue-600" />
      case "completion":
        return <Award className="h-4 w-4 text-green-600" />
      case "assignment":
        return <GraduationCap className="h-4 w-4 text-purple-600" />
      case "certificate":
        return <Award className="h-4 w-4 text-yellow-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getImpactColor = (impact: string) => {
    return impact.startsWith("+") ? "text-green-600" : "text-red-600"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analyticsData) {
    return <div className="p-4">No analytics data available.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Program Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into program performance and trainee progress
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {analyticsData.programPerformance?.map(p => (
                <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalPrograms}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{analyticsData.monthlyGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trainees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalTrainees}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Program Performance</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          <TabsTrigger value="performers">Top Performers</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span>Attendance Rate</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{analyticsData.attendanceRate}%</div>
                        <p className="text-sm text-muted-foreground">Average across all programs</p>
                        <div className="mt-4 h-2 bg-gray-200 rounded-full">
                            <div
                                className="h-2 bg-green-600 rounded-full"
                                style={{ width: `${analyticsData.attendanceRate}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span>Average Progress</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{analyticsData.averageProgress || 0}%</div>
                        <p className="text-sm text-muted-foreground">Overall trainee progress</p>
                        <div className="mt-4 h-2 bg-gray-200 rounded-full">
                        <div 
                            className="h-2 bg-blue-600 rounded-full" 
                            style={{ width: `${analyticsData.averageProgress || 0}%` }}
                        ></div>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        <span>Facilitators</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">{analyticsData.totalFacilitators}</div>
                        <p className="text-sm text-muted-foreground">Active facilitators</p>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        +3 new this month
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
        {/* Other TabsContent would follow, using the merged analyticsData state */}
      </Tabs>
      {/* ... Quick Actions ... */}
    </div>
  )
}