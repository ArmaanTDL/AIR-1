import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * TransitionService
 * ─────────────────
 * Orchestrates the cinematic GSAP page transition between
 * the Landing page and the Dashboard console shell.
 *
 * The service maintains a boolean flag that tells the
 * LayoutComponent to run its entrance animation on mount.
 */
@Injectable({ providedIn: 'root' })
export class TransitionService {
  /** True while a page-to-page transition is actively running */
  private _transitioning = new BehaviorSubject<boolean>(false);
  transitioning$ = this._transitioning.asObservable();

  /** Set to true when the landing exit timeline starts */
  beginTransition(): void {
    this._transitioning.next(true);
  }

  /** Set to false after the dashboard entrance timeline completes */
  endTransition(): void {
    this._transitioning.next(false);
  }

  /** Snapshot check (non-reactive) */
  get isTransitioning(): boolean {
    return this._transitioning.getValue();
  }
}
