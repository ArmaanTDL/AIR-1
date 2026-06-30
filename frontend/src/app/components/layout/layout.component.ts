import { Component, OnInit, OnDestroy, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService, ToastMessage } from '../../services/toast.service';
import { AlertService } from '../../services/alert.service';
import { TransitionService } from '../../services/transition.service';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  username: string | null = 'admin';
  alertCount = 0;
  toasts: ToastMessage[] = [];
  private sub: Subscription = new Subscription();

  navItems = [
    { to: '/console', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
    { to: '/console/products', label: 'Products', icon: 'Package', end: false },
    { to: '/console/warehouses', label: 'Warehouses', icon: 'Factory', end: false },
    { to: '/console/inventory', label: 'Inventory', icon: 'ClipboardList', badge: true, end: false },
    { to: '/console/orders', label: 'Orders', icon: 'ShoppingCart', end: false },
    { to: '/console/suppliers', label: 'Suppliers', icon: 'Handshake', end: false },
    { to: '/console/alerts', label: 'Alerts', icon: 'Siren', badge: true, end: false },
    { to: '/console/transactions', label: 'Transaction Log', icon: 'Repeat', end: false }
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastService: ToastService,
    private alertService: AlertService,
    private transition: TransitionService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.username = this.auth.username;
    
    // Subscribe to toasts
    this.sub.add(
      this.toastService.toasts$.subscribe(t => {
        this.toasts = t;
      })
    );

    // Poll active alerts count every 10 seconds
    this.sub.add(
      interval(10000).pipe(
        startWith(0),
        switchMap(() => this.alertService.getAlerts())
      ).subscribe({
        next: (alerts) => {
          this.alertCount = alerts.filter(a => a.status === 'UNRESOLVED').length;
        },
        error: () => {
          // Silent fail on background fetch
        }
      })
    );
  }

  // ─────────────────────────────────────────────────────────────
  //  CINEMATIC ENTRANCE TRANSITION
  //  Runs after the view initializes if we arrived from the
  //  landing page exit transition.
  // ─────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    if (!this.transition.isTransitioning) { return; }

    this.ngZone.runOutsideAngular(() => {
      const gsap = (window as any).gsap;
      if (!gsap) {
        this.transition.endTransition();
        return;
      }

      const overlay = document.getElementById('page-transition-overlay');
      const sidebar = document.querySelector('aside');
      const mainShell = document.querySelector('main.flex-1');
      const topHeader = mainShell?.querySelector('header');

      // ── Set initial states for entrance elements ──
      if (sidebar) {
        gsap.set(sidebar, {
          x: '-100%',
          opacity: 0,
          willChange: 'transform, opacity',
        });
      }
      if (mainShell) {
        gsap.set(mainShell, {
          opacity: 0,
          y: 50,
          willChange: 'transform, opacity',
        });
      }

      // ── Build the synchronized ENTRANCE timeline ──
      const entranceTl = gsap.timeline({
        defaults: { ease: 'power4.out' },
        onComplete: () => {
          // Clean up will-change after animation completes
          if (sidebar) gsap.set(sidebar, { willChange: 'auto' });
          if (mainShell) gsap.set(mainShell, { willChange: 'auto' });
          this.transition.endTransition();
        }
      });

      // 1. OVERLAY FADE-OUT — reveal the dashboard underneath
      if (overlay) {
        entranceTl.to(overlay, {
          opacity: 0,
          duration: 0.45,
          ease: 'power2.out',
        }, 0);
      }

      // 2. SIDEBAR SWEEP — slide in from left with high-end deceleration
      if (sidebar) {
        entranceTl.to(sidebar, {
          x: '0%',
          opacity: 1,
          duration: 0.75,
          ease: 'power4.out',
        }, 0.1);
      }

      // 3. MAIN SHELL RISE — fade and slide up into resting position
      if (mainShell) {
        entranceTl.to(mainShell, {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power4.out',
        }, 0.2);
      }

      // 4. TOP HEADER BAR — gentle slide-down into place
      if (topHeader) {
        gsap.set(topHeader, { y: -20, opacity: 0 });
        entranceTl.to(topHeader, {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power3.out',
        }, 0.35);
      }

      // 5. CASCADING NAV ITEMS — stagger the sidebar nav links
      const navLinks = document.querySelectorAll('aside nav a');
      if (navLinks.length > 0) {
        gsap.set(navLinks, { x: -20, opacity: 0 });
        entranceTl.to(navLinks, {
          x: 0,
          opacity: 1,
          duration: 0.4,
          ease: 'power3.out',
          stagger: 0.06,
        }, 0.4);
      }

      // 6. CASCADING DASHBOARD CONTENT — stagger the child elements
      const contentCards = document.querySelectorAll('main.flex-1 .flex-1 > *');
      if (contentCards.length > 0) {
        gsap.set(contentCards, { y: 30, opacity: 0 });
        entranceTl.to(contentCards, {
          y: 0,
          opacity: 1,
          duration: 0.45,
          ease: 'power3.out',
          stagger: 0.08,
        }, 0.5);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  getInitial(): string {
    return (this.username || 'A').charAt(0).toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  removeToast(id: number): void {
    this.toastService.remove(id);
  }

  isActive(route: string, end: boolean = false): boolean {
    return this.router.isActive(route, {
      paths: end ? 'exact' : 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored'
    });
  }
}
