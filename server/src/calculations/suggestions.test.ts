import { computeSavingPaths, computeRecategorization, computeAllocation } from './suggestions';

describe('computeSavingPaths', () => {
  it('returns three paths: Conservative, Moderate, Aggressive', () => {
    const paths = computeSavingPaths(100, 1000);
    expect(paths).toHaveLength(3);
    expect(paths[0].label).toBe('Conservative');
    expect(paths[1].label).toBe('Moderate');
    expect(paths[2].label).toBe('Aggressive');
  });

  it('Moderate weekly is 1.2× Conservative', () => {
    const paths = computeSavingPaths(100, 1000);
    expect(paths[1].weekly).toBeCloseTo(paths[0].weekly * 1.2, 1);
  });

  it('Aggressive weekly is 1.5× Conservative', () => {
    const paths = computeSavingPaths(100, 1000);
    expect(paths[2].weekly).toBeCloseTo(paths[0].weekly * 1.5, 1);
  });

  it('monthly is weekly × (52/12)', () => {
    const paths = computeSavingPaths(100, 1000);
    for (const p of paths) {
      expect(p.monthly).toBeCloseTo(p.weekly * (52 / 12), 1);
    }
  });

  it('Aggressive path reaches target sooner than Conservative', () => {
    const paths = computeSavingPaths(100, 5200);
    const conservativeDate = new Date(paths[0].target_date);
    const aggressiveDate = new Date(paths[2].target_date);
    expect(aggressiveDate.getTime()).toBeLessThan(conservativeDate.getTime());
  });
});

describe('computeRecategorization', () => {
  it('returns empty array when gap is 0', () => {
    expect(computeRecategorization(0, [{ name: 'Food', monthly_amount: 500 }])).toEqual([]);
  });

  it('returns empty array when no categories', () => {
    expect(computeRecategorization(200, [])).toEqual([]);
  });

  it('suggests cutting from largest category first', () => {
    const cats = [
      { name: 'Food', monthly_amount: 300 },
      { name: 'Entertainment', monthly_amount: 800 },
    ];
    const suggestions = computeRecategorization(100, cats);
    expect(suggestions[0].params?.name).toBe('Entertainment');
  });

  it('cuts at most 30% of a category', () => {
    const cats = [{ name: 'Food', monthly_amount: 1000 }];
    const suggestions = computeRecategorization(500, cats);
    const cut = suggestions[0].params?.cut as number;
    expect(cut).toBeLessThanOrEqual(300); // 30% of 1000
  });
});

describe('computeAllocation', () => {
  it('returns empty array when no active goals', () => {
    expect(computeAllocation([], 500)).toEqual([]);
  });

  it('returns empty array when all goals are completed', () => {
    const goals = [{ id: 1, name: 'Trip', priority: 1, weeks_remaining: 5, remaining: 0 }];
    expect(computeAllocation(goals, 500)).toEqual([]);
  });

  it('allocates all budget across active goals', () => {
    const goals = [
      { id: 1, name: 'A', priority: 1, weeks_remaining: 4, remaining: 1000 },
      { id: 2, name: 'B', priority: 2, weeks_remaining: 8, remaining: 500 },
    ];
    const result = computeAllocation(goals, 600);
    const total = result.reduce((s, g) => s + g.suggested_extra, 0);
    expect(total).toBeCloseTo(600, 0);
  });

  it('gives more to goals with fewer weeks remaining', () => {
    const goals = [
      { id: 1, name: 'Urgent', priority: 1, weeks_remaining: 2, remaining: 500 },
      { id: 2, name: 'Later', priority: 1, weeks_remaining: 20, remaining: 500 },
    ];
    const result = computeAllocation(goals, 1000);
    const urgent = result.find((g) => g.goal_id === 1)!;
    const later = result.find((g) => g.goal_id === 2)!;
    expect(urgent.suggested_extra).toBeGreaterThan(later.suggested_extra);
  });
});
