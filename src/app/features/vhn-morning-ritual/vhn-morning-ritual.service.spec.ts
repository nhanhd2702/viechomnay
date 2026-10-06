import { VhnMorningRitualService } from './vhn-morning-ritual.service';
import { parseTaskLines } from './vhn-morning-ritual.component';

describe('VhnMorningRitualService', () => {
  let service: VhnMorningRitualService;

  beforeEach(() => {
    localStorage.clear();
    service = new VhnMorningRitualService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('shouldShowToday returns true when never shown', () => {
    expect(service.shouldShowToday()).toBeTrue();
  });

  it('shouldShowToday returns false after markShownToday called', () => {
    service.markShownToday();
    expect(service.shouldShowToday()).toBeFalse();
  });

  it('shouldShowToday returns true on a new calendar day', () => {
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString(
      'sv-SE',
      { timeZone: 'Asia/Ho_Chi_Minh' },
    );
    localStorage.setItem('vhn_lastRitualDay', yesterday);
    expect(service.shouldShowToday()).toBeTrue();
  });

  it('shouldShowToday returns false if stored day matches today VN', () => {
    const today = service.getTodayVN();
    localStorage.setItem('vhn_lastRitualDay', today);
    expect(service.shouldShowToday()).toBeFalse();
  });
});

describe('parseTaskLines', () => {
  it('splits multiline string by newline and trims whitespace', () => {
    const input = 'Việc 1\n  Việc 2  \nViệc 3\n';
    expect(parseTaskLines(input)).toEqual(['Việc 1', 'Việc 2', 'Việc 3']);
  });

  it('ignores empty and blank lines', () => {
    const input = 'Việc 1\n\n   \nViệc 2';
    expect(parseTaskLines(input)).toEqual(['Việc 1', 'Việc 2']);
  });

  it('returns empty array for blank input', () => {
    expect(parseTaskLines('   \n\t\n')).toEqual([]);
  });
});
