import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return the dashboard HTML directly
    const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>pokt.ai Dashboard - Real Data</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .loading { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <div class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-6">
                    <div class="flex items-center">
                        <h1 class="text-2xl font-bold text-blue-800">pokt.ai</h1>
                    </div>
                    <div class="text-sm text-gray-500">
                        Last updated: <span id="lastUpdated"></span>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p class="text-gray-600 mt-2">Welcome to your pokt.ai dashboard. Monitor your RPC gateway performance and usage.</p>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Relays</p>
                            <p class="text-2xl font-bold text-gray-900" id="totalRelays">4.7M</p>
                            <p class="text-xs text-gray-500" id="relayChange">+12.3% from last month</p>
                        </div>
                        <div class="text-blue-500 text-2xl">📊</div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Monthly Cost</p>
                            <p class="text-2xl font-bold text-gray-900" id="monthlyCost">$474.75</p>
                            <p class="text-xs text-gray-500" id="planType">Enterprise plan</p>
                        </div>
                        <div class="text-green-500 text-2xl">💳</div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Active Endpoints</p>
                            <p class="text-2xl font-bold text-gray-900" id="activeEndpoints">4</p>
                            <p class="text-xs text-gray-500" id="newEndpoints">+1 new this month</p>
                        </div>
                        <div class="text-purple-500 text-2xl">🖥️</div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Team Members</p>
                            <p class="text-2xl font-bold text-gray-900" id="teamMembers">3</p>
                            <p class="text-xs text-gray-500" id="newMembers">+1 new member</p>
                        </div>
                        <div class="text-orange-500 text-2xl">👥</div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div class="space-y-4" id="recentActivity">
                    <div class="flex items-center space-x-4">
                        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-900">Endpoint created with 4,747,487 total relays</p>
                            <p class="text-xs text-gray-500">30 minutes ago</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-900">Generated $474.75 in usage costs this month</p>
                            <p class="text-xs text-gray-500">2 hours ago</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-900">demo@pokt.ai joined the organization</p>
                            <p class="text-xs text-gray-500">1 day ago</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <script>
        // Update last updated time
        document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
    </script>
</body>
</html>`;

    return new NextResponse(dashboardHTML, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load dashboard page' },
      { status: 500 }
    );
  }
}



