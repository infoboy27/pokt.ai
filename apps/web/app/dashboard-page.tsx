export default function DashboardPage() {
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
            <div className="text-2xl font-bold">4.7M</div>
            <p className="text-xs text-muted-foreground">
              +12.3% from last month
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium leading-none tracking-tight">Monthly Cost</p>
            <div className="h-4 w-4 text-muted-foreground">💳</div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">$474.75</div>
            <p className="text-xs text-muted-foreground">
              Enterprise plan
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium leading-none tracking-tight">Active Endpoints</p>
            <div className="h-4 w-4 text-muted-foreground">🖥️</div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              +1 new this month
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium leading-none tracking-tight">Team Members</p>
            <div className="h-4 w-4 text-muted-foreground">👥</div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              +1 new member
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
              <p className="text-muted-foreground">📈 Usage Chart - 4.7M total relays</p>
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
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-3 bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Endpoint created with 4,747,487 total relays</p>
                  <p className="text-xs text-muted-foreground">30 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-3 bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Generated $474.75 in usage costs this month</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-3 bg-purple-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">demo@pokt.ai joined the organization</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}



