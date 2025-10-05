import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthStore } from "~/stores/auth";
import { useTRPC } from "~/trpc/react";
import { DashboardLayout } from "~/components/Layout/DashboardLayout";
import { FolderOpen, Key, QrCode, ChartBar as BarChart3, Plus, TrendingUp, Shield, Users, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/dashboard/")({
  component: Dashboard,
});

function Dashboard() {
  const { isAuthenticated, token, user, isAdmin } = useAuthStore();
  const trpc = useTRPC();
  const [dateRange, setDateRange] = useState("7d");

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const userIsAdmin = isAdmin();

  const projectsQuery = useQuery(
    trpc.getProjects.queryOptions({
      token: token!,
    })
  );

  const projects = projectsQuery.data || [];
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "ACTIVE").length;
  const totalCodes = projects.reduce((sum, p) => sum + p._count.codes, 0);
  const totalKeys = projects.reduce((sum, p) => sum + p._count.keys, 0);

  // Mock analytics data for charts
  const scanAnalyticsData = [
    { date: "Jan 1", scans: 245, validScans: 230, invalidScans: 15 },
    { date: "Jan 2", scans: 312, validScans: 298, invalidScans: 14 },
    { date: "Jan 3", scans: 189, validScans: 175, invalidScans: 14 },
    { date: "Jan 4", scans: 278, validScans: 265, invalidScans: 13 },
    { date: "Jan 5", scans: 356, validScans: 340, invalidScans: 16 },
    { date: "Jan 6", scans: 423, validScans: 405, invalidScans: 18 },
    { date: "Jan 7", scans: 398, validScans: 380, invalidScans: 18 },
  ];

  const keyUsageData = [
    { name: "Encryption Keys", value: 45, color: "#3B82F6" },
    { name: "Signing Keys", value: 25, color: "#10B981" },
    { name: "NFC Pairing", value: 20, color: "#F59E0B" },
    { name: "RFID Pairing", value: 10, color: "#EF4444" },
  ];

  const projectStatusData = [
    { status: "Active", count: 12, color: "#10B981" },
    { status: "Draft", count: 5, color: "#F59E0B" },
    { status: "Completed", count: 8, color: "#6B7280" },
    { status: "Paused", count: 2, color: "#EF4444" },
  ];

  const monthlyTrendsData = [
    { month: "Aug", projects: 8, keys: 25, scans: 1200 },
    { month: "Sep", projects: 12, keys: 32, scans: 1800 },
    { month: "Oct", projects: 15, keys: 38, scans: 2400 },
    { month: "Nov", projects: 18, keys: 42, scans: 3200 },
    { month: "Dec", projects: 22, keys: 48, scans: 4100 },
    { month: "Jan", projects: 27, keys: 55, scans: 5200 },
  ];

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Welcome back, {user?.firstName}!
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Here's what's happening with your Optropic projects today.
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <BarChart3 className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                View Analytics
              </button>
              <button
                type="button"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Project
              </button>
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FolderOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                        <dd className="text-lg font-medium text-gray-900">{activeProjects}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-green-600">+{Math.floor(activeProjects * 0.15)} this month</span>
                    <span className="text-gray-500"> • {totalProjects} total</span>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Key className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Keys</dt>
                        <dd className="text-lg font-medium text-gray-900">{totalKeys}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-green-600">All secure</span>
                    <span className="text-gray-500"> • 2 expiring soon</span>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Scans This Month</dt>
                        <dd className="text-lg font-medium text-gray-900">5,247</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-green-600">+28% from last month</span>
                    <span className="text-gray-500"> • 98.2% valid</span>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <QrCode className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Optropic Codes</dt>
                        <dd className="text-lg font-medium text-gray-900">{totalCodes}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-blue-600">+{Math.floor(totalCodes * 0.08)} this week</span>
                    <span className="text-gray-500"> • All encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Analytics Overview</h3>
              <div className="flex items-center space-x-4">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="block pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Scan Analytics */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Scan Activity</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scanAnalyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="validScans"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                        name="Valid Scans"
                      />
                      <Area
                        type="monotone"
                        dataKey="invalidScans"
                        stackId="1"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.6}
                        name="Invalid Scans"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Usage Distribution */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Key Usage Distribution</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={keyUsageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {keyUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Trends */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="projects"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        name="Projects"
                      />
                      <Line
                        type="monotone"
                        dataKey="keys"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Keys"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Project Status */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Project Status Distribution</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectStatusData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="status" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6">
                        {projectStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Projects and Activity */}
          <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
            {/* Recent Projects */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Projects</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <FolderOpen className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500">
                            {project._count.codes} codes • Created {new Date(project.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          project.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Security Overview */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Security Overview</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span className="ml-3 text-sm text-gray-900">All systems operational</span>
                  </div>
                  <div className="flex items-center">
                    <Key className="h-5 w-5 text-green-500" />
                    <span className="ml-3 text-sm text-gray-900">Key rotation up to date</span>
                  </div>
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-yellow-500" />
                    <span className="ml-3 text-sm text-gray-900">2 codes pending review</span>
                  </div>
                  {userIsAdmin && (
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-blue-500" />
                      <span className="ml-3 text-sm text-gray-900">3 active users</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    <p>Last security scan: <span className="font-medium text-gray-900">2 hours ago</span></p>
                    <p className="mt-1">Next key rotation: <span className="font-medium text-gray-900">in 28 days</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
