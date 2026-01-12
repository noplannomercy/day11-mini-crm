import { db } from '@/lib/db';
import { activities } from '@/lib/db/schema';
import { desc, and, gte, lt, isNull } from 'drizzle-orm';
import { Dashboard } from '@/components/dashboard/dashboard';

export default async function DashboardPage() {
  // Fetch stats
  const statsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stats`, {
    cache: 'no-store',
  });
  const stats = statsRes.ok ? await statsRes.json() : null;

  // Fetch recent activities (last 5)
  const recentActivities = await db
    .select()
    .from(activities)
    .orderBy(desc(activities.createdAt))
    .limit(5);

  // Fetch today's scheduled activities
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayActivities = await db
    .select()
    .from(activities)
    .where(
      and(
        gte(activities.scheduledAt, today),
        lt(activities.scheduledAt, tomorrow),
        isNull(activities.completedAt)
      )
    )
    .orderBy(activities.scheduledAt)
    .limit(10);

  return (
    <Dashboard
      stats={stats}
      recentActivities={recentActivities}
      todayActivities={todayActivities}
    />
  );
}
