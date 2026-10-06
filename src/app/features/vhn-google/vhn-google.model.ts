export interface VhnGoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export interface VhnGoogleSession {
  user: VhnGoogleUser;
  accessToken: string;
  expiresAt: number; // Unix timestamp ms
}

export type VhnGoogleSyncMode = 'BIDIRECTIONAL' | 'PULL_ONLY' | 'PUSH_ONLY';

export interface VhnGoogleConfig {
  clientId: string;
  clientSecret?: string;
  syncMode: VhnGoogleSyncMode;
  isAutoSync: boolean;
  syncIntervalMinutes: number;
  lastSyncTimestamp: number | null;
  calendarId: string;
}

export interface GoogleCalendarEventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: GoogleCalendarEventDateTime;
  end: GoogleCalendarEventDateTime;
  status?: string;
  htmlLink?: string;
}

export const DEFAULT_GOOGLE_CLIENT_ID = '';

export const DEFAULT_VHN_GOOGLE_CONFIG: VhnGoogleConfig = {
  clientId: DEFAULT_GOOGLE_CLIENT_ID,
  syncMode: 'BIDIRECTIONAL',
  isAutoSync: true,
  syncIntervalMinutes: 15,
  lastSyncTimestamp: null,
  calendarId: 'primary',
};
