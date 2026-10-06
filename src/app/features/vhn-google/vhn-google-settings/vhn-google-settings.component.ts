import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VhnGoogleAuthService } from '../vhn-google-auth.service';
import { VhnGoogleCalendarService } from '../vhn-google-calendar.service';
import { DEFAULT_GOOGLE_CLIENT_ID } from '../vhn-google.model';

@Component({
  selector: 'vhn-google-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="vhn-google-settings-container">
      <!-- 1. Trạng thái tài khoản -->
      <mat-card class="settings-card account-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="card-header-icon">account_circle</mat-icon>
          <mat-card-title>Tài Khoản Google</mat-card-title>
          <mat-card-subtitle>
            {{
              auth.isLoggedIn()
                ? 'Đang kết nối tài khoản Google'
                : 'Chưa liên kết tài khoản'
            }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="card-body">
          @if (auth.isLoggedIn()) {
            <div class="user-info-row">
              <img
                [src]="auth.currentUser()?.picture"
                alt="Avatar"
                class="user-avatar-large"
              />
              <div class="user-details">
                <div class="user-fullname">{{ auth.currentUser()?.name }}</div>
                <div class="user-email-text">{{ auth.currentUser()?.email }}</div>
                <div class="connection-badge">
                  <mat-icon class="status-icon">check_circle</mat-icon>
                  <span>Đã kết nối OAuth 2.0</span>
                </div>
              </div>
              <div class="user-actions">
                <button
                  mat-stroked-button
                  color="warn"
                  (click)="auth.logout()"
                  type="button"
                >
                  <mat-icon>logout</mat-icon>
                  Đăng xuất
                </button>
              </div>
            </div>
          } @else {
            <div class="login-prompt-row">
              <div class="prompt-text">
                Đăng nhập tài khoản Google để tự động đồng bộ các cuộc họp, lịch hẹn cá nhân
                vào Việc Hôm Nay và đẩy công việc lên Google Calendar.
              </div>
              <button
                mat-flat-button
                color="primary"
                (click)="onLogin()"
                [disabled]="auth.isLoggingIn()"
                type="button"
                class="btn-google-login"
              >
                @if (auth.isLoggingIn()) {
                  <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
                  <span>Đang kết nối Google...</span>
                } @else {
                  <mat-icon>login</mat-icon>
                  <span>Đăng nhập với Google</span>
                }
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- 2. Cấu hình Đồng bộ Google Calendar (Option A) -->
      <mat-card class="settings-card sync-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="card-header-icon">calendar_month</mat-icon>
          <mat-card-title>Đồng Bộ Google Calendar (2 Chiều)</mat-card-title>
          <mat-card-subtitle>Chế độ đồng bộ 2 chiều (Option A) tự động</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="card-body">
          <div class="sync-description-box">
            <div class="sync-mode-feature">
              <mat-icon class="feature-icon pull">arrow_downward</mat-icon>
              <div>
                <strong>Chiều kéo (Google Calendar ➔ Việc Hôm Nay):</strong>
                Tự động lấy các sự kiện, lịch họp trong 7 ngày tới đưa vào danh sách làm việc.
              </div>
            </div>
            <div class="sync-mode-feature">
              <mat-icon class="feature-icon push">arrow_upward</mat-icon>
              <div>
                <strong>Chiều đẩy (Việc Hôm Nay ➔ Google Calendar):</strong>
                Công việc có giờ hẹn cụ thể sẽ tự tạo sự kiện trên Google Calendar cá nhân để chuông điện thoại nhắc nhở.
              </div>
            </div>
          </div>

          <div class="sync-controls">
            <div class="control-row">
              <div class="control-label">
                <strong>Tự động đồng bộ ngầm</strong>
                <div class="control-hint">Tự động kiểm tra và đồng bộ định kỳ theo khoảng thời gian đã chọn</div>
              </div>
              <mat-slide-toggle
                [ngModel]="auth.config().isAutoSync"
                (ngModelChange)="onToggleAutoSync($event)"
              ></mat-slide-toggle>
            </div>

            @if (auth.config().isAutoSync) {
              <div class="control-row">
                <div class="control-label">
                  <strong>Chu kỳ đồng bộ</strong>
                </div>
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-select
                    [ngModel]="auth.config().syncIntervalMinutes"
                    (ngModelChange)="onChangeInterval($event)"
                  >
                    <mat-option [value]="5">Mỗi 5 phút</mat-option>
                    <mat-option [value]="15">Mỗi 15 phút (Khuyến nghị)</mat-option>
                    <mat-option [value]="30">Mỗi 30 phút</mat-option>
                    <mat-option [value]="60">Mỗi 60 phút</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            }

            <div class="sync-action-box">
              <button
                mat-flat-button
                color="primary"
                (click)="onSyncNow()"
                [disabled]="!auth.isLoggedIn() || cal.isSyncing()"
                class="btn-sync-now"
                type="button"
              >
                @if (cal.isSyncing()) {
                  <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
                  <span>Đang đồng bộ...</span>
                } @else {
                  <mat-icon>sync</mat-icon>
                  <span>Đồng bộ ngay với Google Calendar</span>
                }
              </button>

              <div class="sync-status-info">
                @if (auth.config().lastSyncTimestamp) {
                  <div>
                    Lần đồng bộ gần nhất:
                    <strong>{{ formatTime(auth.config().lastSyncTimestamp) }}</strong>
                  </div>
                } @else {
                  <div>Chưa từng đồng bộ</div>
                }

                @if (cal.lastSyncResult(); as res) {
                  <div class="last-result-badge">
                    Đã kéo: +{{ res.pulled }} sự kiện | Đã đẩy: ↑{{ res.pushed }} việc
                  </div>
                }
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- 3. Cấu hình Google Client ID -->
      <mat-card class="settings-card client-id-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="card-header-icon">vpn_key</mat-icon>
          <mat-card-title>Cấu Hình Google OAuth Client ID</mat-card-title>
          <mat-card-subtitle>Tùy chỉnh Client ID riêng của bạn từ Google Cloud Console</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="card-body">
          <p class="cfg-hint">
            Client ID mặc định đã được cấu hình sẵn. Nếu bạn muốn sử dụng dự án Google Cloud riêng, bạn có thể nhập Client ID tại đây:
          </p>

          <div class="client-id-form-row">
            <mat-form-field appearance="outline" class="client-id-field">
              <mat-label>Google OAuth Client ID</mat-label>
              <input
                matInput
                [(ngModel)]="customClientId"
                placeholder="xxxx-yyyy.apps.googleusercontent.com"
              />
            </mat-form-field>
            <div class="client-id-btn-group">
              <button
                mat-stroked-button
                color="primary"
                (click)="saveClientId()"
                type="button"
              >
                Lưu Client ID
              </button>
              <button
                mat-button
                (click)="resetToDefaultClientId()"
                type="button"
                matTooltip="Xóa Client ID để nhập mới"
              >
                Xóa / Đặt lại
              </button>
            </div>
          </div>

          <div class="origin-note-box">
            <mat-icon class="note-icon">info</mat-icon>
            <div class="note-content">
              <strong>Lưu ý về Authorized JavaScript Origins trên Google Cloud Console:</strong>
              <div>• Khi chạy máy chủ production: Thêm <code>https://viechomnay.systems.vn</code></div>
              <div>• Khi chạy môi trường dev cục bộ: Thêm <code>http://localhost:4200</code></div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .vhn-google-settings-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-width: 900px;
        margin: 0 auto;
        padding: 8px;
      }

      .settings-card {
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        border: 1px solid rgba(0, 0, 0, 0.08);
      }

      .card-header-icon {
        color: var(--brand, #10b981);
      }

      .card-body {
        padding: 16px 24px 24px;
      }

      .user-info-row {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }

      .user-avatar-large {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid var(--brand, #10b981);
      }

      .user-details {
        flex: 1;
      }

      .user-fullname {
        font-size: 1.2rem;
        font-weight: 600;
      }

      .user-email-text {
        font-size: 0.95rem;
        color: rgba(0, 0, 0, 0.6);
        margin: 2px 0 8px;
      }

      .connection-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: #10b981;
        font-weight: 500;
        background: rgba(16, 185, 129, 0.1);
        padding: 3px 10px;
        border-radius: 12px;
      }

      .status-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .login-prompt-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        flex-wrap: wrap;
      }

      .prompt-text {
        flex: 1;
        font-size: 0.95rem;
        line-height: 1.5;
        color: rgba(0, 0, 0, 0.7);
      }

      .btn-google-login {
        border-radius: 20px;
        padding: 0 24px;
        height: 42px;
      }

      .sync-description-box {
        background: rgba(16, 185, 129, 0.06);
        border-left: 4px solid var(--brand, #10b981);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .sync-mode-feature {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        font-size: 0.9rem;
        line-height: 1.4;
      }

      .feature-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-top: 1px;

        &.pull {
          color: #3b82f6;
        }
        &.push {
          color: #10b981;
        }
      }

      .sync-controls {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
      }

      .control-label strong {
        font-size: 1rem;
      }

      .control-hint {
        font-size: 0.85rem;
        color: rgba(0, 0, 0, 0.55);
        margin-top: 2px;
      }

      .sync-action-box {
        margin-top: 12px;
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }

      .btn-sync-now {
        border-radius: 20px;
        height: 42px;
        padding: 0 24px;
      }

      .sync-status-info {
        font-size: 0.9rem;
        color: rgba(0, 0, 0, 0.7);
      }

      .last-result-badge {
        font-size: 0.82rem;
        color: #10b981;
        font-weight: 500;
        margin-top: 2px;
      }

      .btn-spinner {
        display: inline-block;
        margin-right: 8px;
      }

      .client-id-form-row {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 12px;
      }

      .client-id-field {
        flex: 1;
        min-width: 320px;
      }

      .client-id-btn-group {
        display: flex;
        gap: 8px;
      }

      .origin-note-box {
        display: flex;
        gap: 12px;
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 8px;
        padding: 12px 16px;
        margin-top: 16px;
        font-size: 0.85rem;
        color: rgba(0, 0, 0, 0.85);

        code {
          background: rgba(0, 0, 0, 0.06);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }
      }

      .note-icon {
        color: #f59e0b;
      }

      .cfg-hint {
        font-size: 0.9rem;
        color: rgba(0, 0, 0, 0.65);
        margin: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VhnGoogleSettingsComponent {
  readonly auth = inject(VhnGoogleAuthService);
  readonly cal = inject(VhnGoogleCalendarService);

  customClientId = signal<string>(this.auth.config().clientId || DEFAULT_GOOGLE_CLIENT_ID);

  async onLogin(): Promise<void> {
    try {
      await this.auth.login();
    } catch {
      // Error handled
    }
  }

  async onSyncNow(): Promise<void> {
    try {
      await this.cal.syncBidirectional();
    } catch {
      // Error handled
    }
  }

  onToggleAutoSync(enabled: boolean): void {
    this.auth.updateConfig({ isAutoSync: enabled });
  }

  onChangeInterval(mins: number): void {
    this.auth.updateConfig({ syncIntervalMinutes: mins });
  }

  saveClientId(): void {
    const val = this.customClientId().trim();
    if (val) {
      this.auth.updateConfig({ clientId: val });
    }
  }

  resetToDefaultClientId(): void {
    this.customClientId.set('');
    this.auth.updateConfig({ clientId: '' });
  }

  formatTime(ts: number | null): string {
    if (!ts) return 'Chưa có';
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ngày ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}
