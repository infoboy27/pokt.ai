'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  Filter
} from 'lucide-react';

const UsageCharts = dynamic(() => import('@/components/usage-charts'), { ssr: false });

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
      <UsageCharts usageData={usageData} endpointData={endpointData} COLORS={COLORS} />
    </div>
  );
}
