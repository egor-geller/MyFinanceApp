import { computeWhatIf, computeCostOfDelay } from './simulator';

describe('computeWhatIf', () => {
  it('returns the same date when extra is 0', () => {
    const result = computeWhatIf(1000, 100, 10, 0);
    expect(result.days_saved).toBe(0);
    expect(result.new_required_weekly).toBe(100);
  });

  it('saves days when extra weekly savings are added', () => {
    const result = computeWhatIf(1000, 100, 10, 50);
    expect(result.days_saved).toBeGreaterThan(0);
    expect(result.new_required_weekly).toBe(150);
  });

  it('reduces weeks needed proportionally with extra savings', () => {
    // remaining=1000, required=100/wk → 10 weeks normally
    // with +100 extra → 200/wk → 5 weeks → saves 5*7=35 days
    const result = computeWhatIf(1000, 100, 10, 100);
    expect(result.days_saved).toBe(35);
    expect(result.new_required_weekly).toBe(200);
  });

  it('clamps days_saved to 0 when extra is negative', () => {
    const result = computeWhatIf(1000, 100, 10, -200);
    expect(result.days_saved).toBe(0);
  });

  it('handles zero remaining gracefully', () => {
    const result = computeWhatIf(0, 100, 0, 50);
    expect(result.days_saved).toBeGreaterThanOrEqual(0);
  });
});

describe('computeCostOfDelay', () => {
  it('increases required monthly payment when delayed', () => {
    const result = computeCostOfDelay(12000, 1000, 12, 2);
    // 10 months left instead of 12 → 12000/10 = 1200/mo
    expect(result.new_required_monthly).toBe(1200);
    expect(result.extra_per_month).toBe(200);
    expect(result.delay_months).toBe(2);
  });

  it('handles delay equal to months remaining', () => {
    // 0 months left → full amount required immediately
    const result = computeCostOfDelay(12000, 1000, 12, 12);
    expect(result.new_required_monthly).toBe(12000);
  });

  it('returns no extra cost when delay is 0', () => {
    const result = computeCostOfDelay(12000, 1000, 12, 0);
    expect(result.extra_per_month).toBe(0);
    expect(result.new_required_monthly).toBe(1000);
  });
});
