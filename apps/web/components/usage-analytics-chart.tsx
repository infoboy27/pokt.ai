'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart } from 'recharts';

interface ChartData {
  period: string;
  totalRequests: number;
  avgLatencyP50: number;
  avgLatencyP95: number;
  avgErrorRate: number;
  latency: number;
  errors: number;
}

interface UsageAnalyticsChartProps {
  data: ChartData[];
  chartType?: 'line' | 'bar' | 'area' | 'composed';
  height?: number;
  showLatency?: boolean;
  showErrors?: boolean;
}

export function UsageAnalyticsChart({ 
  data, 
  chartType = 'line', 
  height = 300, 
  showLatency = true, 
  showErrors = true 
}: UsageAnalyticsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-muted rounded">
        <p className="text-muted-foreground">📊 No usage data available</p>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                name === 'totalRequests' ? 'Requests' : 
                name === 'avgLatencyP50' ? 'P50 Latency (ms)' :
                name === 'avgLatencyP95' ? 'P95 Latency (ms)' : 'Error Rate (%)'
              ]}
            />
            <Bar dataKey="totalRequests" fill="#3b82f6" />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                name === 'totalRequests' ? 'Requests' : 'Latency (ms)'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="totalRequests" 
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            />
            <YAxis yAxisId="requests" orientation="left" />
            <YAxis yAxisId="latency" orientation="right" />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                name === 'totalRequests' ? 'Requests' : 
                name === 'avgLatencyP50' ? 'P50 Latency (ms)' :
                name === 'avgLatencyP95' ? 'P95 Latency (ms)' : 'Error Rate (%)'
              ]}
            />
            <Bar yAxisId="requests" dataKey="totalRequests" fill="#3b82f6" />
            {showLatency && (
              <Line yAxisId="latency" type="monotone" dataKey="avgLatencyP50" stroke="#ef4444" strokeWidth={2} />
            )}
          </ComposedChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                name === 'totalRequests' ? 'Requests' : 
                name === 'avgLatencyP50' ? 'P50 Latency (ms)' :
                name === 'avgLatencyP95' ? 'P95 Latency (ms)' : 'Error Rate (%)'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="totalRequests" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {showLatency && (
              <Line 
                type="monotone" 
                dataKey="avgLatencyP50" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            {showErrors && (
              <Line 
                type="monotone" 
                dataKey="avgErrorRate" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        );
    }
  };

  return (
    <div style={{ width: '100%', height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
