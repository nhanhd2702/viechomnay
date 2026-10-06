import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { VhnGoogleAuthService } from '../vhn-google-auth.service';
import { VhnGoogleCalendarService } from '../vhn-google-calendar.service';

@Component({
  selector: 'vhn-google-user-badge',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    @if (auth.isLoggedIn()) {
      <button
        mat-button
        [matMenuTriggerFor]="userMenu"
        class="vhn-user-btn"
        [matTooltip]="'Tài khoản Google: ' + auth.currentUser()?.email"
        type="button"
      >
        <div class="user-badge-content">
          @if (auth.currentUser()?.picture) {
            <img
              [src]="auth.currentUser()?.picture"
              alt="Avatar"
              class="user-avatar"
            />
          } @else {
            <mat-icon class="avatar-fallback">account_circle</mat-icon>
          }
          <span class="user-name">{{ auth.currentUser()?.name }}</span>
          @if (cal.isSyncing()) {
            <mat-spinner diameter="14" class="sync-spinner"></mat-spinner>
          }
        </div>
      </button>

      <mat-menu #userMenu="matMenu" xPosition="before" class="vhn-user-menu">
        <div class="menu-header">
          <div class="user-title">{{ auth.currentUser()?.name }}</div>
          <div class="user-email">{{ auth.currentUser()?.email }}</div>
        </div>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="onSyncNow()" [disabled]="cal.isSyncing()">
          <mat-icon [class.spin]="cal.isSyncing()">sync</mat-icon>
          <span>Đồng bộ Google Calendar ngay</span>
        </button>
        <button mat-menu-item (click)="goToSettings()">
          <mat-icon>settings</mat-icon>
          <span>Cài đặt Google & Lịch</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="auth.logout()">
          <mat-icon color="warn">logout</mat-icon>
          <span>Đăng xuất Google</span>
        </button>
      </mat-menu>
    } @else {
      <button
        mat-stroked-button
        class="vhn-login-btn"
        (click)="onLogin()"
        [disabled]="auth.isLoggingIn()"
        type="button"
        matTooltip="Đăng nhập tài khoản Google để đồng bộ lịch"
      >
        @if (auth.isLoggingIn()) {
          <mat-spinner diameter="16" class="login-spinner"></mat-spinner>
          <span>Đang kết nối...</span>
        } @else {
          <svg class="google-logo" viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span class="btn-text">Đăng nhập Google</span>
        }
      </button>
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        margin: 0 4px;
      }

      .vhn-user-btn {
        height: 36px;
        line-height: 36px;
        padding: 0 8px;
        border-radius: 18px;
        background: rgba(16, 185, 129, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.25);
        transition: all 0.2s ease;

        &:hover {
          background: rgba(16, 185, 129, 0.16);
        }
      }

      .user-badge-content {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .user-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: cover;
      }

      .avatar-fallback {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: var(--brand, #10b981);
      }

      .user-name {
        font-size: 0.85rem;
        font-weight: 500;
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        @media (max-width: 600px) {
          display: none;
        }
      }

      .vhn-login-btn {
        height: 32px;
        line-height: 30px;
        padding: 0 10px;
        border-radius: 16px;
        font-size: 0.8rem;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-color: rgba(0, 0, 0, 0.15);
        background: transparent;
        transition: background 0.2s ease;

        &:hover {
          background: rgba(0, 0, 0, 0.04);
        }
      }

      .google-logo {
        vertical-align: middle;
      }

      .menu-header {
        padding: 12px 16px;
      }

      .user-title {
        font-weight: 600;
        font-size: 0.95rem;
      }

      .user-email {
        font-size: 0.8rem;
        color: rgba(0, 0, 0, 0.6);
        margin-top: 2px;
      }

      .spin {
        animation: spin 1s infinite linear;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VhnGoogleUserBadgeComponent {
  readonly auth = inject(VhnGoogleAuthService);
  readonly cal = inject(VhnGoogleCalendarService);
  private readonly _router = inject(Router);

  async onLogin(): Promise<void> {
    try {
      await this.auth.login();
    } catch {
      // Handled in auth service
    }
  }

  async onSyncNow(): Promise<void> {
    await this.cal.syncBidirectional();
  }

  goToSettings(): void {
    this._router.navigate(['/config']);
  }
}
