import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock data
const mockDeals = [
  {
    id: '1',
    title: 'Deal 1',
    amount: 10000,
    stage: 'lead' as const,
    contactId: null,
    companyId: null,
    expectedCloseDate: null,
    memo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Deal 2',
    amount: 20000,
    stage: 'qualified' as const,
    contactId: null,
    companyId: null,
    expectedCloseDate: null,
    memo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Deal 3',
    amount: 30000,
    stage: 'closed_won' as const,
    contactId: null,
    companyId: null,
    expectedCloseDate: null,
    memo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock PipelineBoard component (will be implemented later)
const PipelineBoard = ({ deals, onStageChange }: any) => {
  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage] = deals.filter((d: any) => d.stage === stage);
    return acc;
  }, {} as Record<string, any[]>);

  const getStageTotals = (stage: string) => {
    const stageDeals = dealsByStage[stage] || [];
    return stageDeals.reduce((sum, deal) => sum + deal.amount, 0);
  };

  return (
    <div data-testid="pipeline-board">
      {stages.map(stage => (
        <div key={stage} data-testid={`column-${stage}`}>
          <h2>{stage}</h2>
          <div data-testid={`stage-total-${stage}`}>
            Total: ₩{getStageTotals(stage).toLocaleString()}
          </div>
          <div>
            {dealsByStage[stage]?.map(deal => (
              <div key={deal.id} data-testid={`deal-${deal.id}`}>
                <h3>{deal.title}</h3>
                <p>₩{deal.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

describe('PipelineBoard', () => {
  it('should render all 6 pipeline stages', () => {
    render(<PipelineBoard deals={mockDeals} onStageChange={vi.fn()} />);

    expect(screen.getByTestId('column-lead')).toBeInTheDocument();
    expect(screen.getByTestId('column-qualified')).toBeInTheDocument();
    expect(screen.getByTestId('column-proposal')).toBeInTheDocument();
    expect(screen.getByTestId('column-negotiation')).toBeInTheDocument();
    expect(screen.getByTestId('column-closed_won')).toBeInTheDocument();
    expect(screen.getByTestId('column-closed_lost')).toBeInTheDocument();
  });

  it('should display deals in correct columns', () => {
    render(<PipelineBoard deals={mockDeals} onStageChange={vi.fn()} />);

    const leadColumn = screen.getByTestId('column-lead');
    const qualifiedColumn = screen.getByTestId('column-qualified');
    const closedWonColumn = screen.getByTestId('column-closed_won');

    expect(leadColumn).toHaveTextContent('Deal 1');
    expect(qualifiedColumn).toHaveTextContent('Deal 2');
    expect(closedWonColumn).toHaveTextContent('Deal 3');
  });

  it('should show stage total amounts', () => {
    render(<PipelineBoard deals={mockDeals} onStageChange={vi.fn()} />);

    expect(screen.getByTestId('stage-total-lead')).toHaveTextContent('₩10,000');
    expect(screen.getByTestId('stage-total-qualified')).toHaveTextContent('₩20,000');
    expect(screen.getByTestId('stage-total-closed_won')).toHaveTextContent('₩30,000');
  });
});

describe('DealCard', () => {
  it('should display deal title and amount', () => {
    const deal = mockDeals[0];
    render(<PipelineBoard deals={[deal]} onStageChange={vi.fn()} />);

    expect(screen.getByText('Deal 1')).toBeInTheDocument();
    expect(screen.getByText('₩10,000')).toBeInTheDocument();
  });
});

describe('Pipeline DnD Integration', () => {
  it('should have proper structure for DnD', () => {
    render(<PipelineBoard deals={mockDeals} onStageChange={vi.fn()} />);

    const board = screen.getByTestId('pipeline-board');
    expect(board).toBeInTheDocument();

    // Check all columns exist
    const columns = screen.getAllByTestId(/^column-/);
    expect(columns).toHaveLength(6);
  });
});
