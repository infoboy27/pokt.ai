'use client';

import React, { useState, useEffect } from 'react';

interface Endpoint {
  id: string;
  name: string;
  chainId: string;
  endpointUrl: string;
  token: string;
  rateLimit: number;
  status: string;
}

export default function EndpointsTestPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/endpoints?orgId=org_current_user');
        
        if (response.ok) {
          const data = await response.json();
          setEndpoints(data.endpoints || []);
        } else {
          setError(`Failed to fetch endpoints: ${response.status}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchEndpoints();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Endpoints Test</h1>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading endpoints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Endpoints Test</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Error:</strong> {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Endpoints Test</h1>
      <p className="mb-4">Found {endpoints.length} endpoints:</p>
      
      <div className="grid gap-4">
        {endpoints.map((endpoint) => (
          <div key={endpoint.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{endpoint.name}</h3>
            <p className="text-sm text-gray-600">ID: {endpoint.id}</p>
            <p className="text-sm text-gray-600">Chain: {endpoint.chainId}</p>
            <p className="text-sm text-gray-600">Status: {endpoint.status}</p>
            <p className="text-sm text-gray-600">Rate Limit: {endpoint.rateLimit}/s</p>
            <p className="text-sm text-gray-600 break-all">URL: {endpoint.endpointUrl}</p>
            <p className="text-sm text-gray-600 break-all">Token: {endpoint.token}</p>
          </div>
        ))}
      </div>
      
      {endpoints.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No endpoints found</p>
        </div>
      )}
    </div>
  );
}



