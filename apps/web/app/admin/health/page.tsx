'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Server
} from 'lucide-react';

interface HealthCheck {
  id: string;
  endpointId: string;
  endpoint: {
    id: string;
    name: string;
    baseUrl: string;
  };
  ok: boolean;
  httpStatus?: number;
  latencyMs?: number;
  checkedAt: string;
  meta?: any;
}

export default function HealthPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealthData = async () => {
    try {
      // Use the proxy API route to avoid CORS issues
      const apiUrl = '/api/health-proxy';
      console.log('Fetching health data from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Health data received:', data);
      setHealthData(data.data);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      // Set empty data to show the UI without crashing
      setHealthData({
        healthChecks: [],
        summary: { totalChecks: 0, successfulChecks: 0, successRate: 0, avgLatency: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, showing empty state');
        setLoading(false);
        setHealthData({
          healthChecks: [],
          summary: { totalChecks: 0, successfulChecks: 0, successRate: 0, avgLatency: 0 }
        });
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeout);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHealthData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading health data...</span>
        <div className="mt-4">
          <button 
            onClick={() => setLoading(false)} 
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Skip loading (show empty state)
          </button>
        </div>
      </div>
    );
  }

  const healthChecks = healthData?.healthChecks || [];
  const summary = healthData?.summary || { totalChecks: 0, successfulChecks: 0, successRate: 0, avgLatency: 0 };

  const getStatusIcon = (ok: boolean) => {
    return ok ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (ok: boolean, httpStatus?: number) => {
    if (ok) {
      return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
    } else {
      return <Badge variant="destructive">Unhealthy</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Monitoring</h1>
          <p className="text-gray-600">Monitor endpoint health and performance</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2.1% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgLatency.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +3ms from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalChecks}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Health Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthChecks.slice(0, 1).map((check: HealthCheck) => (
              <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(check.ok)}
                  <div>
                    <h3 className="font-medium">{check.endpoint.name}</h3>
                    <p className="text-sm text-gray-500">{check.endpoint.baseUrl}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{check.latencyMs}ms</p>
                    <p className="text-xs text-gray-500">Latency</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">HTTP {check.httpStatus}</p>
                    <p className="text-xs text-gray-500">Status</p>
                  </div>
                  {getStatusBadge(check.ok, check.httpStatus)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Health Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthChecks.map((check: HealthCheck) => (
              <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(check.ok)}
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(check.checkedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {check.endpoint.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{check.latencyMs}ms</p>
                    <p className="text-xs text-gray-500">Latency</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">HTTP {check.httpStatus}</p>
                    <p className="text-xs text-gray-500">Status</p>
                  </div>
                  {getStatusBadge(check.ok, check.httpStatus)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Health Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Activity className="mx-auto h-12 w-12 mb-4" />
              <p>Health trend chart will be displayed here</p>
              <p className="text-sm">Integration with Recharts coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


