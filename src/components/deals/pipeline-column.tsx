'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Deal } from '@/lib/db/schema';
import { formatCurrencyShort } from '@/lib/constants';
import { DraggableDealCard } from './draggable-deal-card';

interface PipelineColumnProps {
  stage: {
    id: string;
    label: string;
    color: string;
  };
  deals: Deal[];
  disabled?: boolean;
}

export function PipelineColumn({ stage, deals, disabled }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    disabled,
  });

  const total = deals.reduce((sum, deal) => sum + deal.amount, 0);

  return (
    <div
      ref={setNodeRef}
      data-testid={`column-${stage.id}`}
      className={`
        flex flex-col w-80 bg-gray-50 rounded-lg p-4
        ${isOver ? 'ring-2 ring-blue-400' : ''}
      `}
    >
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold" style={{ color: stage.color }}>
            {stage.label}
          </h2>
          <span className="text-sm text-gray-500">
            {deals.length}
          </span>
        </div>
        <div data-testid={`stage-total-${stage.id}`} className="text-sm font-medium text-gray-700">
          Total: {formatCurrencyShort(total)}
        </div>
      </div>

      {/* Deals List */}
      <SortableContext
        items={deals.map(d => d.id)}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <div className="flex-1 space-y-2 min-h-[200px]">
          {deals.map(deal => (
            <DraggableDealCard
              key={deal.id}
              deal={deal}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
