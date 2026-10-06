import { Injectable } from '@angular/core';

const LS_KEY = 'vhn_lastRitualDay';

@Injectable({
  providedIn: 'root',
})
export class VhnMorningRitualService {
  getTodayVN(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  }

  shouldShowToday(): boolean {
    const last = localStorage.getItem(LS_KEY);
    return last !== this.getTodayVN();
  }

  markShownToday(): void {
    localStorage.setItem(LS_KEY, this.getTodayVN());
  }

  resetForTesting(): void {
    localStorage.removeItem(LS_KEY);
  }
}
