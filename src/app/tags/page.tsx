import { db } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { TagList } from '@/components/tags/tag-list';

export default async function TagsPage() {
  const allTags = await db
    .select()
    .from(tags)
    .orderBy(tags.name);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">태그 관리</h1>
      </div>

      <TagList initialTags={allTags} />
    </div>
  );
}
