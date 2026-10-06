import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  DEFAULT_VHN_GOOGLE_CONFIG,
  VhnGoogleConfig,
  VhnGoogleSession,
  VhnGoogleUser,
} from './vhn-google.model';

const STORAGE_KEY_CONFIG = 'VHN_GOOGLE_CONFIG';
const STORAGE_KEY_SESSION = 'VHN_GOOGLE_SESSION';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              expires_in?: number | string;
              error?: string;
            }) => void;
            error_callback?: (err: unknown) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          revoke?: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class VhnGoogleAuthService {
  private readonly _http = inject(HttpClient);

  readonly config = signal<VhnGoogleConfig>(this._loadConfig());
  readonly session = signal<VhnGoogleSession | null>(this._loadSession());

  readonly isLoggedIn = computed(() => {
    const s = this.session();
    return !!s && s.expiresAt > Date.now();
  });

  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly isLoggingIn = signal<boolean>(false);

  private _gsiScriptLoadedPromise: Promise<void> | null = null;

  updateConfig(partial: Partial<VhnGoogleConfig>): void {
    const updated: VhnGoogleConfig = {
      ...this.config(),
      ...partial,
    };
    this.config.set(updated);
    this._saveConfig(updated);
  }

  resetConfigToDefault(): void {
    this.config.set({ ...DEFAULT_VHN_GOOGLE_CONFIG });
    this._saveConfig(DEFAULT_VHN_GOOGLE_CONFIG);
  }

  async login(): Promise<VhnGoogleSession> {
    this.isLoggingIn.set(true);
    try {
      await this.ensureGsiLoaded();

      const clientId = this.config().clientId || DEFAULT_VHN_GOOGLE_CONFIG.clientId;
      if (!clientId) {
        throw new Error('Chưa cấu hình Google Client ID.');
      }

      const scope = [
        'openid',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar.events',
      ].join(' ');

      const tokenResponse = await new Promise<{ access_token: string; expires_in: number }>(
        (resolve, reject) => {
          if (!window.google?.accounts?.oauth2) {
            reject(new Error('Thư viện Google Identity Services chưa tải xong.'));
            return;
          }

          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope,
            callback: (res) => {
              if (res.error) {
                reject(new Error(`Lỗi Google OAuth: ${res.error}`));
              } else if (res.access_token) {
                const expiresInSec =
                  typeof res.expires_in === 'number'
                    ? res.expires_in
                    : parseInt(String(res.expires_in || '3600'), 10);
                resolve({
                  access_token: res.access_token,
                  expires_in: expiresInSec || 3600,
                });
              } else {
                reject(new Error('Không nhận được Access Token từ Google.'));
              }
            },
            error_callback: (err) => {
              reject(err);
            },
          });

          client.requestAccessToken({ prompt: 'consent' });
        },
      );

      // Lấy thông tin User profile từ Google UserInfo API
      const user = await this._fetchUserInfo(tokenResponse.access_token);

      const newSession: VhnGoogleSession = {
        user,
        accessToken: tokenResponse.access_token,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      };

      this.session.set(newSession);
      this._saveSession(newSession);
      return newSession;
    } finally {
      this.isLoggingIn.set(false);
    }
  }

  logout(): void {
    const current = this.session();
    if (current && window.google?.accounts?.oauth2?.revoke) {
      try {
        window.google.accounts.oauth2.revoke(current.accessToken, () => {
          // Token revoked
        });
      } catch {
        // Ignore revocation errors
      }
    }
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }

  async getValidAccessToken(): Promise<string | null> {
    const s = this.session();
    if (!s) return null;

    // Còn hạn ít nhất 60 giây
    if (s.expiresAt > Date.now() + 60 * 1000) {
      return s.accessToken;
    }

    // Nếu hết hạn, gọi login để gia hạn
    try {
      const refreshed = await this.login();
      return refreshed.accessToken;
    } catch {
      return null;
    }
  }

  ensureGsiLoaded(): Promise<void> {
    if (window.google?.accounts?.oauth2) {
      return Promise.resolve();
    }

    if (!this._gsiScriptLoadedPromise) {
      this._gsiScriptLoadedPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Không thể tải Google Identity Services SDK'));
        document.head.appendChild(script);
      });
    }

    return this._gsiScriptLoadedPromise;
  }

  private async _fetchUserInfo(accessToken: string): Promise<VhnGoogleUser> {
    try {
      const info = await firstValueFrom(
        this._http.get<{ sub?: string; id?: string; name?: string; email?: string; picture?: string }>(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      return {
        id: info.sub || info.id || 'google-user',
        name: info.name || 'Người dùng Google',
        email: info.email || '',
        picture: info.picture || '',
      };
    } catch {
      return {
        id: 'google-user',
        name: 'Người dùng Google',
        email: '',
        picture: '',
      };
    }
  }

  private _loadConfig(): VhnGoogleConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (raw) {
        return {
          ...DEFAULT_VHN_GOOGLE_CONFIG,
          ...JSON.parse(raw),
        };
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_VHN_GOOGLE_CONFIG };
  }

  private _saveConfig(cfg: VhnGoogleConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
    } catch {
      // Ignore
    }
  }

  private _loadSession(): VhnGoogleSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SESSION);
      if (raw) {
        const parsed = JSON.parse(raw) as VhnGoogleSession;
        if (parsed.expiresAt > Date.now()) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }

  private _saveSession(s: VhnGoogleSession): void {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(s));
    } catch {
      // Ignore
    }
  }
}
