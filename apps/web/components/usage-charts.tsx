'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

type UsageDatum = {
  date: string;
  relays: number;
  latency: number;
  errors: number;
  endpoint: string;
};

type EndpointDatum = {
  name: string;
  relays: number;
  percentage: number;
};

export default function UsageCharts({
  usageData,
  endpointData,
  COLORS,
}: {
  usageData: UsageDatum[];
  endpointData: EndpointDatum[];
  COLORS: string[];
}) {
  return (
    <>
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
                  labelFormatter={(value) => new Date(value as string).toLocaleDateString()}
                  formatter={(value) => [`${Number(value as number).toLocaleString()}`, 'Relays']}
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
                  labelFormatter={(value) => new Date(value as string).toLocaleDateString()}
                  formatter={(value) => [`${value as number}ms`, 'Latency']}
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
                <Tooltip formatter={(value) => [`${Number(value as number).toLocaleString()} relays`, 'Relays']} />
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
                labelFormatter={(value) => new Date(value as string).toLocaleDateString()}
                formatter={(value) => [`${(Number(value as number) * 100).toFixed(2)}%`, 'Error Rate']}
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
    </>
  );
}

