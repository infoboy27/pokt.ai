'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Server, 
  Key, 
  Activity, 
  BarChart3, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

interface DashboardStats {
  endpoints: {
    total: number;
    active: number;
    inactive: number;
  };
  apiKeys: {
    total: number;
    active: number;
    inactive: number;
  };
  networks: {
    total: number;
    enabled: number;
    disabled: number;
  };
  health: {
    successRate: number;
    avgLatency: number;
    lastCheck: string;
  };
  usage: {
    totalRequests: number;
    avgLatency: number;
    errorRate: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard statistics
    const fetchStats = async () => {
      try {
        // In a real implementation, you'd fetch from your API
        // For now, we'll use mock data
        setStats({
          endpoints: { total: 1, active: 1, inactive: 0 },
          apiKeys: { total: 1, active: 1, inactive: 0 },
          networks: { total: 7, enabled: 7, disabled: 0 },
          health: { successRate: 99.8, avgLatency: 45, lastCheck: new Date().toISOString() },
          usage: { totalRequests: 1250000, avgLatency: 42, errorRate: 0.2 },
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Loading dashboard statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your POKT.ai portal infrastructure</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Endpoints */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.endpoints.total}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-green-600 bg-green-100">
                {stats?.endpoints.active} active
              </Badge>
              {stats?.endpoints.inactive > 0 && (
                <Badge variant="secondary" className="text-red-600 bg-red-100">
                  {stats?.endpoints.inactive} inactive
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.apiKeys.total}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-green-600 bg-green-100">
                {stats?.apiKeys.active} active
              </Badge>
              {stats?.apiKeys.inactive > 0 && (
                <Badge variant="secondary" className="text-red-600 bg-red-100">
                  {stats?.apiKeys.inactive} inactive
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Networks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Networks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.networks.total}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-green-600 bg-green-100">
                {stats?.networks.enabled} enabled
              </Badge>
              {stats?.networks.disabled > 0 && (
                <Badge variant="secondary" className="text-red-600 bg-red-100">
                  {stats?.networks.disabled} disabled
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Health Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.health.successRate}%</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>Avg: {stats?.health.avgLatency}ms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Usage Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Requests</span>
                <span className="font-semibold">{stats?.usage.totalRequests.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Latency</span>
                <span className="font-semibold">{stats?.usage.avgLatency}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Error Rate</span>
                <span className="font-semibold">{stats?.usage.errorRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Health Check</span>
                <div className="flex items-center">
                  <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Check</span>
                <span className="text-sm text-gray-500">
                  <Clock className="inline mr-1 h-3 w-3" />
                  {stats?.health.lastCheck ? new Date(stats.health.lastCheck).toLocaleTimeString() : 'Never'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm text-green-600">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col">
              <Server className="mb-2 h-6 w-6" />
              Manage Endpoints
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Key className="mb-2 h-6 w-6" />
              API Keys
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="mb-2 h-6 w-6" />
              View Usage
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Activity className="mb-2 h-6 w-6" />
              Health Checks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}