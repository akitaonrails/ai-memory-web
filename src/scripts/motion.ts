// Scroll-driven motion, declared in markup so any page can use it:
//   data-fill            words light up as the block crosses the viewport (scrubbed)
//   data-zoom            media grows from 86% with soft corners to full size (scrubbed)
//   data-parallax="0.2"  element drifts against the scroll (scrubbed)
//   data-reveal          children (or the element) settle in once, on first view
//   data-count="7209"    number counts up once, on first view
//   data-draw            SVG paths inside draw themselves (scrubbed)
// Everything is skipped under prefers-reduced-motion; content is fully visible without JS.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { compact } from '@/data/format';

gsap.registerPlugin(ScrollTrigger);
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  document.querySelectorAll<HTMLElement>('[data-fill]').forEach((el) => {
    const words = el.textContent!.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words.map((w) => `<span aria-hidden="true" style="opacity:.16">${w}</span>`).join(' ');
    gsap.to(el.children, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: 0.4 },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-zoom]').forEach((el) => {
    gsap.fromTo(el, { scale: 0.86, borderRadius: '2.5rem', opacity: 0.6 }, {
      scale: 1, borderRadius: '1.25rem', opacity: 1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 35%', scrub: 0.5 },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax) || 0.15;
    gsap.fromTo(el, { yPercent: amount * 100 }, {
      yPercent: -amount * 100, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const targets = el.dataset.reveal === 'children' ? el.children : el;
    gsap.from(targets, {
      y: 28, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  document.querySelectorAll<SVGElement>('[data-draw]').forEach((svg) => {
    svg.querySelectorAll<SVGGeometryElement>('path,line,polyline').forEach((p) => {
      const len = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: svg, start: 'top 80%', end: 'bottom 55%', scrub: 0.6 },
      });
    });
  });

  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const fmt = (n: number) => (el.dataset.countFormat === 'compact' ? compact(Math.round(n)) : Math.round(n).toLocaleString('en-US'));
    const state = { n: 0 };
    gsap.to(state, {
      n: end, duration: 1.6, ease: 'power2.out', onUpdate: () => (el.textContent = fmt(state.n)),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
});

// Images decoding late change layout; keep trigger positions honest.
addEventListener('load', () => ScrollTrigger.refresh());
export { gsap, ScrollTrigger, mm };
