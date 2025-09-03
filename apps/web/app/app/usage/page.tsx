'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  Filter
} from 'lucide-react';

// Mock data
const usageData = [
  { date: '2024-01-01', relays: 125000, latency: 45, errors: 0.2, endpoint: 'Ethereum' },
  { date: '2024-01-02', relays: 142000, latency: 42, errors: 0.1, endpoint: 'Ethereum' },
  { date: '2024-01-03', relays: 138000, latency: 48, errors: 0.3, endpoint: 'Ethereum' },
  { date: '2024-01-04', relays: 156000, latency: 41, errors: 0.1, endpoint: 'Ethereum' },
  { date: '2024-01-05', relays: 168000, latency: 39, errors: 0.2, endpoint: 'Ethereum' },
  { date: '2024-01-06', relays: 175000, latency: 37, errors: 0.1, endpoint: 'Ethereum' },
  { date: '2024-01-07', relays: 182000, latency: 35, errors: 0.1, endpoint: 'Ethereum' },
];

const endpointData = [
  { name: 'Ethereum Mainnet', relays: 850000, percentage: 45 },
  { name: 'Polygon', relays: 450000, percentage: 24 },
  { name: 'BSC', relays: 320000, percentage: 17 },
  { name: 'Arbitrum', relays: 200000, percentage: 11 },
  { name: 'Others', relays: 80000, percentage: 3 },
];

const COLORS = ['#7851EC', '#57C3FF', '#192633', '#F5F6FA', '#E5E7EB'];

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedEndpoint, setSelectedEndpoint] = useState('all');

  const totalRelays = usageData.reduce((sum, day) => sum + day.relays, 0);
  const avgLatency = usageData.reduce((sum, day) => sum + day.latency, 0) / usageData.length;
  const avgErrorRate = usageData.reduce((sum, day) => sum + day.errors, 0) / usageData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">Usage Analytics</h1>
          <p className="text-muted-foreground">Monitor your RPC endpoint performance and usage</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Relays</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRelays.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgLatency)}ms</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="w-3 h-3 mr-1 text-green-600" />
              -8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgErrorRate * 100).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="w-3 h-3 mr-1 text-green-600" />
              -0.05% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              +1 this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Relay Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Relay Usage Over Time</CardTitle>
            <CardDescription>Daily relay count and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [`${Number(value).toLocaleString()}`, 'Relays']}
                />
                <Area 
                  type="monotone" 
                  dataKey="relays" 
                  stroke="#7851EC" 
                  fill="#7851EC" 
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Latency Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Response Latency</CardTitle>
            <CardDescription>Average response time in milliseconds</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [`${value}ms`, 'Latency']}
                />
                <Line 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#57C3FF" 
                  strokeWidth={2}
                  dot={{ fill: '#57C3FF', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Endpoint</CardTitle>
          <CardDescription>Relay distribution across your endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={endpointData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="relays"
                >
                  {endpointData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} relays`, 'Relays']} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Endpoint Breakdown</h3>
              <div className="space-y-3">
                {endpointData.map((endpoint, index) => (
                  <div key={endpoint.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{endpoint.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{endpoint.relays.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{endpoint.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Error Rate Trends</CardTitle>
          <CardDescription>Daily error rates and patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value) => [`${(Number(value) * 100).toFixed(2)}%`, 'Error Rate']}
              />
              <Bar 
                dataKey="errors" 
                fill="#EF4444" 
                fillOpacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
