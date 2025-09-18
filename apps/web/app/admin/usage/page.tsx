'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Clock,
  Activity,
  Download
} from 'lucide-react';

interface UsageData {
  period: string;
  totalRequests: number;
  avgLatencyP50: number;
  avgLatencyP95: number;
  avgErrorRate: number;
}

const mockUsageData: UsageData[] = [
  { period: '2024-01-15 10:00', totalRequests: 1250, avgLatencyP50: 45, avgLatencyP95: 89, avgErrorRate: 0.2 },
  { period: '2024-01-15 11:00', totalRequests: 1380, avgLatencyP50: 42, avgLatencyP95: 85, avgErrorRate: 0.1 },
  { period: '2024-01-15 12:00', totalRequests: 1520, avgLatencyP50: 48, avgLatencyP95: 92, avgErrorRate: 0.3 },
  { period: '2024-01-15 13:00', totalRequests: 1680, avgLatencyP50: 44, avgLatencyP95: 87, avgErrorRate: 0.2 },
  { period: '2024-01-15 14:00', totalRequests: 1450, avgLatencyP50: 46, avgLatencyP95: 90, avgErrorRate: 0.1 },
  { period: '2024-01-15 15:00', totalRequests: 1620, avgLatencyP50: 43, avgLatencyP95: 88, avgErrorRate: 0.2 },
  { period: '2024-01-15 16:00', totalRequests: 1780, avgLatencyP50: 47, avgLatencyP95: 91, avgErrorRate: 0.3 },
];

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [granularity, setGranularity] = useState('hour');

  const totalRequests = mockUsageData.reduce((sum, data) => sum + data.totalRequests, 0);
  const avgLatency = mockUsageData.reduce((sum, data) => sum + data.avgLatencyP50, 0) / mockUsageData.length;
  const avgErrorRate = mockUsageData.reduce((sum, data) => sum + data.avgErrorRate, 0) / mockUsageData.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usage Analytics</h1>
          <p className="text-gray-600">Monitor API usage and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={granularity} onValueChange={setGranularity}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minute">Minute</SelectItem>
              <SelectItem value="hour">Hour</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLatency.toFixed(1)}ms</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2ms from last period
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
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +0.1% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P95 Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89ms</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +3ms from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Request Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 mb-4" />
              <p>Usage chart will be displayed here</p>
              <p className="text-sm">Integration with Recharts coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Time</th>
                  <th className="text-right py-2">Requests</th>
                  <th className="text-right py-2">P50 Latency</th>
                  <th className="text-right py-2">P95 Latency</th>
                  <th className="text-right py-2">Error Rate</th>
                </tr>
              </thead>
              <tbody>
                {mockUsageData.map((data, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{new Date(data.period).toLocaleTimeString()}</td>
                    <td className="text-right py-2">{data.totalRequests.toLocaleString()}</td>
                    <td className="text-right py-2">{data.avgLatencyP50}ms</td>
                    <td className="text-right py-2">{data.avgLatencyP95}ms</td>
                    <td className="text-right py-2">
                      <Badge variant={data.avgErrorRate < 0.5 ? 'default' : 'destructive'}>
                        {(data.avgErrorRate * 100).toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


