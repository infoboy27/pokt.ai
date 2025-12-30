'use client';

import { useState, useEffect } from 'react';

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

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity || []);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              {stats?.planType || 'Free'} plan
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold">Overview</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your RPC gateway performance over the last 30 days
            </p>
            <div className="h-[200px] flex items-center justify-center bg-muted rounded">
              <p className="text-muted-foreground">📈 Usage Chart - {formatNumber(stats?.totalRelays || 0)} total relays</p>
            </div>
          </div>
        </div>

        <div className="col-span-3 rounded-lg border bg-card text-card-foreground shadow-sm">
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










