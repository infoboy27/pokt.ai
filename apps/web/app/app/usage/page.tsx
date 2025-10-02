'use client';

import { useState, useEffect } from 'react';
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
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';

const COLORS = ['#7851EC', '#57C3FF', '#192633', '#F5F6FA', '#E5E7EB'];

interface UsageAnalytics {
  totalRelays: number;
  avgResponseTime: number;
  errorRate: number;
  activeEndpoints: number;
  relayChangePercent: number;
  latencyChangePercent: number;
  errorChangePercent: number;
  endpointChangeCount: number;
  dailyData: Array<{
    date: string;
    relays: number;
    latency: number;
    errors: number;
  }>;
  endpointBreakdown: Array<{
    name: string;
    relays: number;
    percentage: number;
    avgLatency: number;
    avgErrorRate: number;
  }>;
  errorTrends: Array<{
    date: string;
    errors: number;
  }>;
}

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedEndpoint, setSelectedEndpoint] = useState('all');
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const days = timeRange === '1d' ? '1' : timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90';
      const endpointParam = selectedEndpoint === 'all' ? '' : selectedEndpoint;
      
      const url = new URL('/api/usage/analytics', window.location.origin);
      url.searchParams.set('days', days);
      if (endpointParam) {
        url.searchParams.set('endpointId', endpointParam);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, selectedEndpoint]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading usage analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span>No analytics data available</span>
      </div>
    );
  }

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
          <Button variant="outline" size="sm" onClick={() => fetchAnalytics()}>
            <Download className="w-4 h-4 mr-2" />
            Refresh
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
            <div className="text-2xl font-bold">{analytics.totalRelays.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {analytics.relayChangePercent >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
              )}
              {analytics.relayChangePercent >= 0 ? '+' : ''}{analytics.relayChangePercent.toFixed(1)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {analytics.latencyChangePercent <= 0 ? (
                <TrendingDown className="w-3 h-3 mr-1 text-green-600" />
              ) : (
                <TrendingUp className="w-3 h-3 mr-1 text-red-600" />
              )}
              {analytics.latencyChangePercent >= 0 ? '+' : ''}{analytics.latencyChangePercent.toFixed(1)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.errorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {analytics.errorChangePercent <= 0 ? (
                <TrendingDown className="w-3 h-3 mr-1 text-green-600" />
              ) : (
                <TrendingUp className="w-3 h-3 mr-1 text-red-600" />
              )}
              {analytics.errorChangePercent >= 0 ? '+' : ''}{analytics.errorChangePercent.toFixed(2)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeEndpoints}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              +{analytics.endpointChangeCount} this month
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
              <AreaChart data={analytics.dailyData}>
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
              <LineChart data={analytics.dailyData}>
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
      {analytics.endpointBreakdown.length > 0 && (
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
                    data={analytics.endpointBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="relays"
                  >
                    {analytics.endpointBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} relays`, 'Relays']} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Endpoint Breakdown</h3>
                <div className="space-y-3">
                  {analytics.endpointBreakdown.map((endpoint, index) => (
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
      )}

      {/* Error Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Error Rate Trends</CardTitle>
          <CardDescription>Daily error rates and patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.errorTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Error Rate']}
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
