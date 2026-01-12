# CLAUDE.md - Small Business CRM

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x |
| Database | PostgreSQL | 15+ |
| ORM | Drizzle ORM | latest |
| UI Components | shadcn/ui | latest |
| Styling | Tailwind CSS | 3.x |
| Charts | Recharts | 2.x |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable | latest |
| Validation | Zod | latest |
| Testing | Vitest + React Testing Library | latest |
| Container | Docker (PostgreSQL) | - |

---

## Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint check
npm run type-check       # TypeScript check

# Database
npm run db:generate      # Generate Drizzle migrations
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio
npm run db:migrate       # Run migrations
npm run db:seed          # Seed initial data

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:ui          # Vitest UI

# Docker
docker-compose up -d     # Start PostgreSQL
docker-compose down      # Stop PostgreSQL
```

---

## Project Structure

```
day11-mini-crm/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Dashboard
│   ├── contacts/                 # Contact pages
│   ├── companies/                # Company pages
│   ├── deals/                    # Deal/Pipeline pages
│   ├── activities/               # Activity pages
│   ├── tasks/                    # Task pages
│   ├── templates/                # Email template pages
│   ├── tags/                     # Tag management
│   └── api/                      # API Routes
│       ├── contacts/
│       ├── companies/
│       ├── deals/
│       ├── activities/
│       ├── tasks/
│       ├── tags/
│       ├── templates/
│       ├── search/
│       └── stats/
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Layout components
│   ├── contacts/                 # Contact components
│   ├── companies/                # Company components
│   ├── deals/                    # Deal/Pipeline components
│   ├── activities/               # Activity components
│   ├── tasks/                    # Task components
│   ├── tags/                     # Tag components
│   ├── templates/                # Template components
│   ├── dashboard/                # Dashboard components
│   └── shared/                   # Shared components
├── lib/
│   ├── db/
│   │   ├── index.ts              # DB connection
│   │   ├── schema.ts             # Drizzle schema
│   │   └── migrations/
│   ├── utils.ts
│   ├── constants.ts
│   └── validations.ts            # Zod schemas
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types
├── __tests__/                    # Test files
│   ├── components/
│   ├── api/
│   └── lib/
└── docs/
    ├── PRD.md
    ├── ARCHITECTURE.md
    └── DATABASE.md
```

---

## TDD Workflow

> **CRITICAL: YOU MUST follow TDD workflow for ALL features.**

### Step 1: Write Failing Test FIRST

```typescript
// __tests__/api/contacts.test.ts
describe('POST /api/contacts', () => {
  it('should create a new contact', async () => {
    const response = await POST('/api/contacts', {
      body: { name: '홍길동', email: 'hong@example.com' }
    });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('홍길동');
  });

  it('should return 400 if name is missing', async () => {
    const response = await POST('/api/contacts', {
      body: { email: 'hong@example.com' }
    });

    expect(response.status).toBe(400);
  });
});
```

### Step 2: Run Test (Must Fail)

```bash
npm run test -- contacts.test.ts
# Expected: FAIL
```

### Step 3: Write Minimal Implementation

```typescript
// app/api/contacts/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name) {
    return Response.json({ error: 'Name is required' }, { status: 400 });
  }

  const contact = await db.insert(contacts).values(body).returning();
  return Response.json(contact[0], { status: 201 });
}
```

### Step 4: Run Test (Must Pass)

```bash
npm run test -- contacts.test.ts
# Expected: PASS
```

### Step 5: Refactor

```typescript
// Improve with validation
import { contactSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const body = await request.json();
  const result = contactSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }

  const contact = await db.insert(contacts).values(result.data).returning();
  return Response.json(contact[0], { status: 201 });
}
```

### Test Coverage Requirements

| Area | Minimum Coverage |
|------|-----------------|
| API Routes | 90% |
| Components | 80% |
| Utilities | 95% |
| Hooks | 85% |

### Test File Naming

```
__tests__/
├── api/
│   ├── contacts.test.ts
│   ├── companies.test.ts
│   ├── deals.test.ts
│   └── ...
├── components/
│   ├── contact-form.test.tsx
│   ├── pipeline-board.test.tsx
│   └── ...
└── lib/
    ├── utils.test.ts
    └── validations.test.ts
```

---

## Key Business Rules

### Entity Relationships

```
Company (1) ←→ (N) Contact
Company (1) ←→ (N) Deal
Contact (1) ←→ (N) Deal
Contact/Company/Deal (N) ←→ (N) Tag
Contact/Company/Deal (1) ←→ (N) Activity
Contact/Company/Deal (1) ←→ (N) Task
```

### Pipeline Stages (Fixed)

```typescript
const PIPELINE_STAGES = [
  'lead',        // 리드
  'qualified',   // 검증됨
  'proposal',    // 제안
  'negotiation', // 협상
  'closed_won',  // 성사
  'closed_lost'  // 실패
] as const;
```

### Amount Formatting

```typescript
// Display: ₩1,234,567
formatCurrency(1234567); // "₩1,234,567"

// Pipeline summary: ₩5M
formatCurrencyShort(5000000); // "₩5M"
```

### Activity Types

```typescript
type ActivityType = 'call' | 'email' | 'meeting' | 'note';
```

### Task Priority

```typescript
type Priority = 'low' | 'medium' | 'high';
```

---

## DnD Rules (Drag & Drop)

### Pipeline Board Rules

```typescript
// IMPORTANT: Pipeline DnD Configuration
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
```

### Stage Change Rules

| Rule | Description |
|------|-------------|
| **Any-to-Any** | 모든 단계 간 이동 가능 |
| **Closed Confirmation** | `closed_won` 또는 `closed_lost`에서 다른 단계로 이동 시 확인 다이얼로그 표시 |
| **Optimistic Update** | DnD 완료 즉시 UI 업데이트, 실패 시 롤백 |
| **Auto-Record** | 단계 변경 시 Activity 자동 생성 |

### DnD Implementation Pattern

```typescript
// ALWAYS use this pattern for pipeline DnD with concurrency control
function PipelineBoard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as DealStage;
    const deal = deals.find(d => d.id === dealId);

    if (!deal || deal.stage === newStage) return;

    // Check if moving from closed stage
    if (deal.stage.startsWith('closed_') && !newStage.startsWith('closed_')) {
      const confirmed = await showConfirmDialog(
        '마감된 거래를 다시 열겠습니까?'
      );
      if (!confirmed) return;
    }

    // Store original for rollback
    const originalDeal = { ...deal };

    // Optimistic update
    setDeals(prev =>
      prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d)
    );

    try {
      // IMPORTANT: Include updatedAt for optimistic locking
      const updated = await updateDealStage(dealId, newStage, deal.updatedAt);
      // Update local state with new updatedAt
      setDeals(prev =>
        prev.map(d => d.id === dealId ? { ...d, updatedAt: updated.updatedAt } : d)
      );
    } catch (error) {
      // Rollback on error
      setDeals(prev =>
        prev.map(d => d.id === dealId ? originalDeal : d)
      );

      if (error instanceof ConflictError) {
        toast.error('다른 사용자가 수정했습니다. 새로고침해주세요.');
        // Optionally auto-refresh
        await refetchDeals();
      } else {
        toast.error('단계 변경 실패');
      }
    }
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      {PIPELINE_STAGES.map(stage => (
        <PipelineColumn
          key={stage}
          stage={stage}
          deals={deals.filter(d => d.stage === stage)}
          disabled={isDragging} // Prevent re-drag during update
        />
      ))}
    </DndContext>
  );
}
```

### DnD Accessibility

```typescript
// ALWAYS include accessibility announcements
const announcements = {
  onDragStart: ({ active }) => `${active.data.current.title} 드래그 시작`,
  onDragOver: ({ over }) => over ? `${over.id} 단계 위` : '드롭 영역 밖',
  onDragEnd: ({ active, over }) => over
    ? `${active.data.current.title}을(를) ${over.id} 단계로 이동`
    : '이동 취소',
};
```

### DnD Edge Cases

| Edge Case | Handling |
|-----------|----------|
| **동시 수정 충돌** | `updatedAt` 기반 낙관적 락, 409 응답 시 롤백 + 새로고침 |
| **같은 컬럼 내 이동** | 무시 (stage 변경 없음) |
| **네트워크 지연 중 재드래그** | `isDragging` 상태로 disable |
| **빈 컬럼으로 드롭** | 컬럼 자체를 droppable로 설정 |
| **Closed 단계에서 이동** | 확인 다이얼로그 필수 |

---

## Critical Rules

### IMPORTANT - Database Operations

```typescript
// IMPORTANT: Always use transactions for multi-table operations
await db.transaction(async (tx) => {
  await tx.delete(contactTags).where(eq(contactTags.contactId, id));
  await tx.delete(contacts).where(eq(contacts.id, id));
});

// IMPORTANT: Always validate input with Zod before DB operations
const result = schema.safeParse(data);
if (!result.success) {
  return { error: result.error.issues };
}
```

### YOU MUST - API Response Format

```typescript
// YOU MUST use consistent API response format
// Success
return Response.json(data, { status: 200 });
return Response.json(created, { status: 201 });
return new Response(null, { status: 204 });

// Error
return Response.json({ error: 'Message' }, { status: 400 });
return Response.json({ error: 'Not found' }, { status: 404 });
return Response.json({ error: 'Concurrent modification' }, { status: 409 });
return Response.json({ error: 'Server error' }, { status: 500 });

// Paginated Response
return Response.json({
  data: items,
  pagination: { page, limit, total, totalPages, hasNext, hasPrev }
}, { status: 200 });
```

### YOU MUST - TypeScript

```typescript
// YOU MUST define types for all data structures
interface Contact {
  id: string;
  name: string;
  email: string | null;
  // ...
}

// YOU MUST use type-safe Drizzle queries
const contacts = await db.select().from(contactsTable);
// Type: Contact[]
```

### NEVER - Security

```typescript
// NEVER expose sensitive data in API responses
// NEVER log sensitive information
// NEVER trust client-side data without validation
// NEVER use string concatenation for SQL queries
// NEVER store passwords in plain text

// BAD - NEVER do this
const query = `SELECT * FROM contacts WHERE id = '${id}'`; // SQL injection!

// GOOD - Use parameterized queries (Drizzle handles this)
await db.select().from(contacts).where(eq(contacts.id, id));
```

### NEVER - State Management

```typescript
// NEVER mutate state directly
// BAD
deals.push(newDeal); // NEVER!

// GOOD
setDeals(prev => [...prev, newDeal]);

// NEVER skip optimistic updates for DnD
// NEVER leave UI in loading state during DnD
// NEVER allow re-drag during API call (disable with isDragging)
// NEVER ignore 409 Conflict responses - always handle concurrency
```

### ALWAYS - Error Handling

```typescript
// ALWAYS wrap async operations in try-catch
try {
  const result = await db.insert(contacts).values(data).returning();
  return Response.json(result[0], { status: 201 });
} catch (error) {
  console.error('Failed to create contact:', error);
  return Response.json({ error: 'Failed to create contact' }, { status: 500 });
}

// ALWAYS show user-friendly error messages
toast.error('연락처 생성에 실패했습니다. 다시 시도해주세요.');
```

### ALWAYS - Component Structure

```typescript
// ALWAYS use 'use client' for interactive components
'use client';

// ALWAYS separate Server and Client components
// Server Component (default)
async function ContactList() {
  const contacts = await getContacts();
  return <ContactListClient contacts={contacts} />;
}

// Client Component
'use client';
function ContactListClient({ contacts }: { contacts: Contact[] }) {
  // Interactive logic here
}
```

### ALWAYS - Testing

```typescript
// ALWAYS write tests BEFORE implementation (TDD)
// ALWAYS test error cases, not just happy paths
// ALWAYS mock external dependencies
// ALWAYS clean up test data after each test

describe('Contact API', () => {
  afterEach(async () => {
    await db.delete(contacts); // Clean up
  });

  it('should handle duplicate email', async () => {
    // Error case testing
  });
});
```

### ALWAYS - Cascade Delete Awareness

```typescript
// ALWAYS be aware of cascade effects
// Deleting a Company:
//   - contacts.company_id → SET NULL
//   - deals.company_id → SET NULL
//   - activities (company_id) → CASCADE DELETE
//   - tasks (company_id) → CASCADE DELETE
//   - company_tags → CASCADE DELETE

// Deleting a Contact:
//   - deals.contact_id → SET NULL
//   - activities (contact_id) → CASCADE DELETE
//   - tasks (contact_id) → CASCADE DELETE
//   - contact_tags → CASCADE DELETE

// ALWAYS fetch delete preview before showing dialog
const preview = await fetch(`/api/companies/${id}/delete-preview`);
const impact = await preview.json();

// ALWAYS show detailed confirmation dialog
const confirmed = await showConfirmDialog({
  title: `"${impact.entityName}" 삭제`,
  message: `정말 삭제하시겠습니까?`,
  details: [
    `${impact.impact.setNull.contacts}개 연락처 연결 해제`,
    `${impact.impact.cascade.activities}개 활동 삭제`,
    `${impact.impact.cascade.tasks}개 태스크 삭제`,
  ],
  confirmText: '삭제',
  variant: 'destructive',
});
```

### ALWAYS - Activity Parent Validation

```typescript
// ALWAYS ensure Activity has at least one parent
// Database has CHECK constraint, but validate in code too
const activitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note']),
  title: z.string().min(1),
  contactId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  dealId: z.string().uuid().optional().nullable(),
}).refine(
  (data) => data.contactId || data.companyId || data.dealId,
  { message: '연락처, 회사, 거래 중 최소 하나는 연결해야 합니다' }
);
```

---

## Quick Reference

### File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component | kebab-case.tsx | `contact-form.tsx` |
| Page | page.tsx | `app/contacts/page.tsx` |
| API Route | route.ts | `app/api/contacts/route.ts` |
| Hook | use-*.ts | `use-contacts.ts` |
| Type | index.ts | `types/index.ts` |
| Test | *.test.ts(x) | `contact-form.test.tsx` |
| Schema | schema.ts | `lib/db/schema.ts` |

### Import Order

```typescript
// 1. React/Next
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

// 3. Internal - absolute imports
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';

// 4. Internal - relative imports
import { ContactCard } from './contact-card';

// 5. Types
import type { Contact } from '@/types';
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mini_crm

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
