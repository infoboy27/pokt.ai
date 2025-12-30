'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UsageChart } from '@/components/usage-chart';
import PaymentStatusBanner from '@/components/PaymentStatusBanner';

interface DashboardStats {
  totalRelays: number;
  relayChangePercent: number;
  activeEndpoints: number;
  newEndpointsThisMonth: number;
  teamMembers: number;
  newMembersThisMonth: number;
  monthlyCost: number;
  planType: string;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login?redirect=/dashboard');
          return;
        }
        setAuthChecked(true);
      } catch (error) {
        router.push('/login?redirect=/dashboard');
        return;
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    
    const fetchStats = async () => {
      try {
        console.log('[DASHBOARD] Fetching stats from /api/dashboard/stats');
        console.log('[DASHBOARD] Timestamp:', Date.now());
        console.log('[DASHBOARD] ENV Check - NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'NOT SET (GOOD!)');
        
        // Force bypass ALL caching with timestamp and headers
        const timestamp = Date.now();
        const url = `/api/dashboard/stats?_nocache=${timestamp}&v=2`;
        console.log('[DASHBOARD] Fetching URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        console.log('[DASHBOARD] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[DASHBOARD] Raw received data:', JSON.stringify(data, null, 2));
          
          // Check if data is nested under 'stats' property or at root level
          const statsData = data.stats || data;
          console.log('[DASHBOARD] Using stats:', statsData);
          console.log('[DASHBOARD] Total Relays:', statsData.totalRelays);
          console.log('[DASHBOARD] Monthly Cost:', statsData.monthlyCost);
          
          setStats(statsData);
          setRecentActivity(data.recentActivity || statsData.recentActivity || []);
        } else {
          const errorData = await response.text();
          console.error('[DASHBOARD] API error:', response.status, errorData);
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        console.error('[DASHBOARD] Fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    const fetchChartData = async () => {
      try {
        const response = await fetch('/api/dashboard/usage-chart?days=7');
        if (response.ok) {
          const data = await response.json();
          setChartData(data);
        } else {
          // Generate sample data if API fails
          const sampleData = [];
          const today = new Date();
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            sampleData.push({
              date: date.toISOString().split('T')[0],
              relays: Math.floor(1000 + Math.random() * 2000),
              latency: Math.floor(40 + Math.random() * 20),
              errors: Math.random() * 5
            });
          }
          setChartData(sampleData);
        }
      } catch (err) {
        // Generate sample data on error
        const sampleData = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          sampleData.push({
            date: date.toISOString().split('T')[0],
            relays: Math.floor(1000 + Math.random() * 2000),
            latency: Math.floor(40 + Math.random() * 20),
            errors: Math.random() * 5
          });
        }
        setChartData(sampleData);
      }
    };

    fetchStats();
    fetchChartData();
  }, [authChecked]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!authChecked) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-8 bg-muted rounded animate-pulse mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your pokt.ai dashboard. Monitor your RPC gateway performance and usage.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium leading-none tracking-tight">Total Relays</p>
            <div className="h-4 w-4 text-muted-foreground">📊</div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{formatNumber(stats?.totalRelays || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.relayChangePercent && stats.relayChangePercent > 0 ? '+' : ''}{stats?.relayChangePercent || 0}% from last month
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium leading-none tracking-tight">Monthly Cost</p>
            <div className="h-4 w-4 text-muted-foreground">💳</div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{formatCurrency(stats?.monthlyCost || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.planType || 'Pay-as-you-go'} plan
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium leading-none tracking-tight">Active Endpoints</p>
            <div className="h-4 w-4 text-muted-foreground">🖥️</div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats?.activeEndpoints || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.newEndpointsThisMonth || 0} new this month
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium leading-none tracking-tight">Team Members</p>
            <div className="h-4 w-4 text-muted-foreground">👥</div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats?.teamMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.newMembersThisMonth || 0} new member
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold">Overview</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your RPC gateway performance over the last 30 days
            </p>
            <UsageChart data={chartData} height={200} />
          </div>
        </div>

        <div className="lg:col-span-3 rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Latest events and updates
            </p>
            <div className="space-y-4">
              {recentActivity?.map((activity, index) => (
                <div key={activity.id} className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    index === 0 ? 'bg-green-500' : 
                    index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-sm text-muted-foreground">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}