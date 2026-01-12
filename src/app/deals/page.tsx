import { db } from '@/lib/db';
import { deals, contacts, companies } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { PipelineBoard } from '@/components/deals/pipeline-board';

export default async function DealsPage() {
  const allDeals = await db.select().from(deals).orderBy(desc(deals.createdAt));

  // Fetch all contacts for the dialog
  const allContacts = await db
    .select({ id: contacts.id, name: contacts.name })
    .from(contacts)
    .orderBy(contacts.name);

  // Fetch all companies for the dialog
  const allCompanies = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .orderBy(companies.name);

  return (
    <div className="min-h-screen bg-white">
      <PipelineBoard
        initialDeals={allDeals}
        contacts={allContacts}
        companies={allCompanies}
      />
    </div>
  );
}
