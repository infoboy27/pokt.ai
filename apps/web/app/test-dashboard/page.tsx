'use client';

import { useEffect, useState } from 'react';

export default function TestDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Dashboard</h1>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Dashboard - API Data</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="border p-4 rounded">
          <h3 className="font-semibold">Total Relays</h3>
          <p className="text-2xl">{data?.stats?.totalRelays?.toLocaleString() || 'N/A'}</p>
        </div>
        <div className="border p-4 rounded">
          <h3 className="font-semibold">Monthly Cost</h3>
          <p className="text-2xl">${data?.stats?.monthlyCost || 'N/A'}</p>
        </div>
        <div className="border p-4 rounded">
          <h3 className="font-semibold">Active Endpoints</h3>
          <p className="text-2xl">{data?.stats?.activeEndpoints || 'N/A'}</p>
        </div>
        <div className="border p-4 rounded">
          <h3 className="font-semibold">Plan Type</h3>
          <p className="text-2xl">{data?.stats?.planType || 'N/A'}</p>
        </div>
      </div>

      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-2">Raw API Response:</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}













