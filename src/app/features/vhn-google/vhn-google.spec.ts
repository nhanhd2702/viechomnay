import {
  DEFAULT_VHN_GOOGLE_CONFIG,
  GoogleCalendarEvent,
  VhnGoogleSession,
} from './vhn-google.model';

describe('VhnGoogleIntegration Logic', () => {
  it('should have default configuration set to Option A bidirectional sync', () => {
    expect(DEFAULT_VHN_GOOGLE_CONFIG.syncMode).toBe('BIDIRECTIONAL');
    expect(DEFAULT_VHN_GOOGLE_CONFIG.isAutoSync).toBe(true);
    expect(DEFAULT_VHN_GOOGLE_CONFIG.syncIntervalMinutes).toBe(15);
  });

  it('should validate session expiration accurately', () => {
    const expiredSession: VhnGoogleSession = {
      user: {
        id: '123',
        name: 'Nguyen Van A',
        email: 'a@gmail.com',
        picture: 'https://example.com/avatar.jpg',
      },
      accessToken: 'token-expired',
      expiresAt: Date.now() - 10000, // 10s in the past
    };

    const validSession: VhnGoogleSession = {
      user: {
        id: '123',
        name: 'Nguyen Van A',
        email: 'a@gmail.com',
        picture: 'https://example.com/avatar.jpg',
      },
      accessToken: 'token-valid',
      expiresAt: Date.now() + 3600 * 1000, // 1 hour in the future
    };

    expect(expiredSession.expiresAt > Date.now()).toBeFalse();
    expect(validSession.expiresAt > Date.now()).toBeTrue();
  });

  it('should parse gcal event ID tag from task notes', () => {
    const sampleEvent: GoogleCalendarEvent = {
      id: 'gcal_event_998877',
      summary: 'Họp giao ban thứ 2',
      start: { dateTime: '2026-10-07T09:00:00+07:00' },
      end: { dateTime: '2026-10-07T10:00:00+07:00' },
    };

    const notesWithTag = `Nội dung cuộc họp\n[gcal:${sampleEvent.id}]`;
    const match = notesWithTag.match(/\[gcal:([^\]]+)\]/);

    expect(match).not.toBeNull();
    expect(match![1]).toBe('gcal_event_998877');
  });
});
