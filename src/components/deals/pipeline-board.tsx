'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, closestCenter, DragOverlay } from '@dnd-kit/core';
import { Deal } from '@/lib/db/schema';
import { DealStage } from '@/lib/validations';
import { PIPELINE_STAGES } from '@/lib/constants';
import { PipelineColumn } from './pipeline-column';
import { DealCard } from './deal-card';
import { DealDialog } from './deal-dialog';
import { Button } from '@/components/ui/button';

interface PipelineBoardProps {
  initialDeals: Deal[];
  contacts: { id: string; name: string }[];
  companies: { id: string; name: string }[];
}

export function PipelineBoard({ initialDeals, contacts, companies }: PipelineBoardProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Group deals by stage
  const dealsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = deals.filter(deal => deal.stage === stage.id);
    return acc;
  }, {} as Record<string, Deal[]>);

  // Get active deal for overlay
  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as string;
    const deal = deals.find(d => d.id === dealId);

    if (!deal || deal.stage === newStage) return;

    // Check if moving from closed stage
    if (deal.stage.startsWith('closed_') && !newStage.startsWith('closed_')) {
      const confirmed = confirm('마감된 거래를 다시 열겠습니까?');
      if (!confirmed) return;
    }

    // Store original for rollback
    const originalStage = deal.stage;

    // Optimistic update
    setDeals(prev =>
      prev.map(d => d.id === dealId ? { ...d, stage: newStage as DealStage } : d)
    );

    try {
      // Update via API with optimistic locking
      const response = await fetch(`/api/deals/${dealId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          updatedAt: deal.updatedAt,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          alert('다른 사용자가 수정했습니다. 새로고침해주세요.');
          window.location.reload();
        }
        throw new Error('Failed to update deal stage');
      }

      const updated = await response.json();

      // Update with new updatedAt from server
      setDeals(prev =>
        prev.map(d => d.id === dealId ? { ...d, updatedAt: updated.updatedAt } : d)
      );
    } catch (error) {
      console.error('Failed to update deal stage:', error);

      // Rollback on error
      setDeals(prev =>
        prev.map(d => d.id === dealId ? { ...d, stage: originalStage } : d)
      );

      alert('단계 변경에 실패했습니다.');
    }
  };

  const handleSaveDeal = (savedDeal: Deal) => {
    if (selectedDeal) {
      // Update existing deal
      setDeals(prev => prev.map(d => d.id === savedDeal.id ? savedDeal : d));
    } else {
      // Add new deal
      setDeals(prev => [savedDeal, ...prev]);
    }
    setDialogOpen(false);
    setSelectedDeal(null);
  };

  const handleNewDeal = () => {
    setSelectedDeal(null);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            거래 파이프라인
          </h1>
          <Button onClick={handleNewDeal}>새 거래</Button>
        </div>
      </div>

      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
      >
        <div data-testid="pipeline-board" className="flex gap-4 overflow-x-auto p-4">
          {PIPELINE_STAGES.map(stage => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage[stage.id] || []}
              disabled={isDragging}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <DealCard deal={activeDeal} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deal={selectedDeal}
        onSave={handleSaveDeal}
        contacts={contacts}
        companies={companies}
      />
    </>
  );
}
