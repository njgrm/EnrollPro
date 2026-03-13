import { useEffect, useState } from 'react';
import { ClipboardList, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '@/api/axiosInstance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalPending: number;
  totalEnrolled: number;
  totalApproved: number;
  sectionsAtCapacity: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data.stats))
      .catch(() => {
        // Use zeros on error
        setStats({ totalPending: 0, totalEnrolled: 0, totalApproved: 0, sectionsAtCapacity: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: 'Total Pending',
      value: stats?.totalPending ?? 0,
      icon: ClipboardList,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      title: 'Total Enrolled',
      value: stats?.totalEnrolled ?? 0,
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Approved (Awaiting)',
      value: stats?.totalApproved ?? 0,
      icon: CheckCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Sections at Capacity',
      value: stats?.sectionsAtCapacity ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Dashboard</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Overview of enrollment statistics
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bg} rounded-md p-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder sections for charts and activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Enrollment by Grade Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
              No enrollment data available yet.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
              No application data available yet.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[100px] items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
            No recent activity to display.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
