import { db } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { PipelineBoard } from '@/components/deals/pipeline-board';

export default async function DealsPage() {
  const allDeals = await db.select().from(deals).orderBy(desc(deals.createdAt));

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            거래 파이프라인
          </h1>
          <a
            href="/deals/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            새 거래
          </a>
        </div>
      </div>

      <PipelineBoard initialDeals={allDeals} />
    </div>
  );
}
