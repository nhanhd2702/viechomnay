import {
  buildHeatmapDays,
  computeKpis,
  HeatmapDay,
} from './vhn-year-review.service';

describe('VhnYearReviewService Helpers', () => {
  describe('buildHeatmapDays', () => {
    it('returns 365 days for normal year 2025', () => {
      const dayMap = new Map<string, { count: number; timeSpentMs: number }>();
      const days = buildHeatmapDays(2025, dayMap);
      expect(days.length).toBe(365);
      expect(days[0].date).toBe('2025-01-01');
      expect(days[364].date).toBe('2025-12-31');
    });

    it('returns 366 days for leap year 2024', () => {
      const dayMap = new Map<string, { count: number; timeSpentMs: number }>();
      const days = buildHeatmapDays(2024, dayMap);
      expect(days.length).toBe(366);
      expect(days[0].date).toBe('2024-01-01');
      expect(days[365].date).toBe('2024-12-31');
    });

    it('correctly maps task counts and time spent', () => {
      const dayMap = new Map<string, { count: number; timeSpentMs: number }>();
      dayMap.set('2025-05-01', { count: 8, timeSpentMs: 14400000 });

      const days = buildHeatmapDays(2025, dayMap);
      const target = days.find((d) => d.date === '2025-05-01');

      expect(target).toBeDefined();
      expect(target?.count).toBe(8);
      expect(target?.timeSpentMs).toBe(14400000);
    });
  });

  describe('computeKpis', () => {
    it('calculates totalDone, activeDays and longestStreak correctly', () => {
      const mockDays: HeatmapDay[] = [
        { date: '2025-01-01', count: 3, timeSpentMs: 3600000 },
        { date: '2025-01-02', count: 2, timeSpentMs: 3600000 },
        { date: '2025-01-03', count: 5, timeSpentMs: 7200000 },
        { date: '2025-01-04', count: 0, timeSpentMs: 0 },
        { date: '2025-01-05', count: 1, timeSpentMs: 1800000 },
      ];

      const kpis = computeKpis(mockDays);

      expect(kpis.totalDone).toBe(11);
      expect(kpis.activeDays).toBe(4);
      expect(kpis.longestStreak).toBe(3); // 1st, 2nd, 3rd
      expect(kpis.totalTrackedMs).toBe(16200000);
    });

    it('handles empty activity gracefully', () => {
      const mockDays: HeatmapDay[] = [
        { date: '2025-01-01', count: 0, timeSpentMs: 0 },
        { date: '2025-01-02', count: 0, timeSpentMs: 0 },
      ];

      const kpis = computeKpis(mockDays);

      expect(kpis.totalDone).toBe(0);
      expect(kpis.activeDays).toBe(0);
      expect(kpis.longestStreak).toBe(0);
      expect(kpis.totalTrackedMs).toBe(0);
    });
  });
});
