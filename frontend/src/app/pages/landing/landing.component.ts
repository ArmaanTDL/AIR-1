import { Component, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TransitionService } from '../../services/transition.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  // ── Game catalog data ──
  selectedGame: any = null;
  featuredGames = [
    { id: 1, name: 'Elden Ring', sku: 'GAME-ER01', category: 'RPG', price: '₹3,599', stock: '250 keys', publisher: 'Bandai Namco', rating: '9.8/10', description: 'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.' },
    { id: 2, name: 'Cyberpunk 2077', sku: 'GAME-CP77', category: 'Action Sci-Fi', price: '₹2,999', stock: '18 keys', publisher: 'CD Projekt Red', rating: '9.0/10', description: 'An open-world, action-adventure story set in Night City, a megalopolis obsessed with power, glamour and body modification.' },
    { id: 3, name: 'Portal 2', sku: 'GAME-P02', category: 'Puzzle', price: '₹480', stock: '1,200 keys', publisher: 'Valve Corp', rating: '9.9/10', description: 'The puzzle-platform game challenges players to solve portal-based puzzles in the mysterious Aperture Science laboratories.' }
  ];

  selectedServer = 'EU';
  servers = [
    { id: 'EU', name: 'EU West Key Vault (London)', capacity: '50,000 keys', ping: '2.5ms', syncStatus: 'Synchronized', features: ['Automated Local Partitions', 'Instant Key Validation', 'Secure Key Decryption'] },
    { id: 'NA', name: 'NA East Key Vault (Virginia)', capacity: '75,000 keys', ping: '8.1ms', syncStatus: 'Synchronized', features: ['High-Throughput Read Pipeline', 'Redundant Vault Backups', 'Active Replication Sync'] },
    { id: 'APAC', name: 'APAC South Key Vault (Singapore)', capacity: '30,000 keys', ping: '12.4ms', syncStatus: 'Synchronized', features: ['Geographic Key Redirection', 'Local Edge Caching', 'Ultra-Low Delay Distribution'] }
  ];

  private lenis: any;
  private animFrameId: number | null = null;

  constructor(
    public auth: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private transition: TransitionService
  ) {}

  selectGame(game: any): void { this.selectedGame = game; }
  selectServer(id: string): void { this.selectedServer = id; }

  // ─────────────────────────────────────────────────────────────
  //  CINEMATIC EXIT TRANSITION
  //  Called by the "Enter Console" button click in the template.
  //  Runs the GSAP exit timeline, then navigates to /console.
  // ─────────────────────────────────────────────────────────────
  enterConsole(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const gsap = (window as any).gsap;
    if (!gsap) {
      // Fallback: direct navigation if GSAP isn't loaded
      this.router.navigate([this.auth.isAuthenticated() ? '/console' : '/login']);
      return;
    }

    // If not authenticated, go to login (no fancy transition needed)
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Signal that a transition is in progress
    this.transition.beginTransition();

    // Get references
    const overlay = document.getElementById('page-transition-overlay');

    // ── Build the synchronized EXIT timeline ──
    const exitTl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        // Once exit animation finishes, navigate to the console
        this.ngZone.run(() => {
          this.router.navigate(['/console']);
        });
      }
    });

    // 1. BUTTON DISMISSAL — instantly fade out the CTA container
    exitTl.to('#hero-content .flex.gap-4', {
      opacity: 0,
      y: 20,
      duration: 0.25,
      ease: 'power2.in',
    }, 0);

    // 2. TYPOGRAPHY DISPERSAL — fade/blur/lift the center text group
    exitTl.to('#hero-content', {
      y: -40,
      opacity: 0,
      filter: 'blur(6px)',
      duration: 0.4,
      ease: 'power3.in',
    }, 0.05);

    // 3. HEADER NAV DISMISSAL — slide the top nav out
    exitTl.to('#header-nav', {
      y: -30,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
    }, 0.05);

    // 4. DOCKED LOGO DISMISSAL — fade the top-left logo
    exitTl.to('#docked-logo', {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
    }, 0.05);

    // 5. STICKY HEADER DISMISSAL
    exitTl.to('#sticky-header', {
      opacity: 0,
      y: -20,
      duration: 0.25,
      ease: 'power2.in',
    }, 0);

    // 6. BACKGROUND VIDEO BLEND — scale up subtly and blend into cream
    exitTl.to('#hero-video', {
      scale: 1.05,
      opacity: 0.3,
      duration: 0.55,
      ease: 'power2.inOut',
    }, 0);

    // 7. POST-HERO CONTENT DISMISSAL — fade the lower sections
    exitTl.to('main.relative, footer', {
      opacity: 0,
      y: 30,
      duration: 0.35,
      ease: 'power2.in',
    }, 0.1);

    // 8. TRANSITION OVERLAY — smoothly bring in the cream overlay
    if (overlay) {
      exitTl.to(overlay, {
        opacity: 1,
        duration: 0.35,
        ease: 'power2.in',
      }, 0.3);
    }
  }

  ngAfterViewInit(): void {
    // Run animation setup outside Angular zone — pure DOM/GSAP work, no change detection needed
    this.ngZone.runOutsideAngular(() => {
      const gsap = (window as any).gsap;
      const ScrollTrigger = (window as any).ScrollTrigger;
      const LenisClass = (window as any).Lenis;

      if (!gsap || !ScrollTrigger) { return; }
      gsap.registerPlugin(ScrollTrigger);

      // ── 1. Initialize Lenis smooth scrolling ──
      if (LenisClass) {
        this.lenis = new LenisClass({
          duration: 1.8,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 1.2,
        });
        // Link Lenis → ScrollTrigger
        this.lenis.on('scroll', ScrollTrigger.update);
        // Drive Lenis via rAF
        const raf = (time: number) => {
          this.lenis.raf(time);
          this.animFrameId = requestAnimationFrame(raf);
        };
        this.animFrameId = requestAnimationFrame(raf);
      }

      // ── 2. Master pinned timeline ──
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.scroll-track',
          start: 'top top',
          end: '+=350%',
          pin: '.pinned-viewport',
          scrub: 2.0,
          anticipatePin: 1,
        }
      });

      // ─── PHASE A: Letter Convergence (0% → 35%) ───
      tl.to('#letter-A', {
        x: 0,
        duration: 0.35,
        ease: 'power2.inOut',
      }, 0);
      tl.to('#letter-R', {
        x: 0,
        duration: 0.35,
        ease: 'power2.inOut',
      }, 0);
      tl.to('#letter-I', {
        opacity: 1,
        duration: 0.35,
        ease: 'power2.inOut',
      }, 0);
      // Video zooms in slightly
      tl.to('#hero-video', {
        scale: 1.0,
        duration: 0.35,
        ease: 'none',
      }, 0);

      // ─── PHASE B: Flight & Docking (35% → 60%) ───
      tl.to('#letter-container', {
        scale: 0.15,
        x: '-42vw',
        y: '-42vh',
        opacity: 0,
        duration: 0.25,
        ease: 'power3.inOut',
      }, 0.35);
      tl.to('#docked-logo', {
        opacity: 1,
        duration: 0.15,
        ease: 'power2.out',
      }, 0.52);

      // ─── PHASE C: Header Activation & Content Reveal (60% → 100%) ───
      tl.to('#header-nav', {
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: 'power3.out',
      }, 0.6);
      tl.to('#hero-content', {
        opacity: 1,
        scale: 1,
        duration: 0.25,
        ease: 'power3.out',
      }, 0.7);

      // ── 3. Sticky header activation after pin releases ──
      ScrollTrigger.create({
        trigger: '.scroll-track',
        start: 'bottom top',
        onEnter: () => {
          gsap.to('#sticky-header', { opacity: 1, duration: 0.4, ease: 'power2.out' });
        },
        onLeaveBack: () => {
          gsap.to('#sticky-header', { opacity: 0, duration: 0.3, ease: 'power2.in' });
        }
      });

      // ── 4. Parallax section slide-ups ──
      const parallaxSections = document.querySelectorAll('.parallax-section');
      parallaxSections.forEach(sec => {
        gsap.fromTo(sec,
          { y: 150, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            ease: 'power1.out',
            scrollTrigger: {
              trigger: sec,
              start: 'top 95%',
              end: 'top 35%',
              scrub: 1.8
            }
          }
        );
      });
    });
  }

  ngOnDestroy(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.lenis) {
      this.lenis.destroy();
    }
    // Clean up all ScrollTriggers
    const ScrollTrigger = (window as any).ScrollTrigger;
    if (ScrollTrigger) {
      ScrollTrigger.getAll().forEach((st: any) => st.kill());
    }
  }
}
