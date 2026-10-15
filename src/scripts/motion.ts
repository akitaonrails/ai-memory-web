// Scroll-driven motion, declared in markup so any page can use it:
//   data-parallax="0.2"  element drifts against the scroll (scrubbed)
//   data-reveal          children (or the element) settle in once, on first view
//   data-count="7209"    number counts up once, on first view
//   data-draw            SVG paths inside draw themselves (scrubbed)
//   data-focus-list      each child gets data-state="ahead|active|past" as it crosses the reading line;
//                        the list gets data-focus-ready, so CSS only dims items when this script is running
// Everything is skipped under prefers-reduced-motion; content is fully visible without JS.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { compact } from '@/data/format';

gsap.registerPlugin(ScrollTrigger);
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
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
      y: 12, duration: 0.5, stagger: 0.08, ease: 'power3.out',
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

  document.querySelectorAll<HTMLElement>('[data-focus-list]').forEach((list) => {
    const items = [...list.children] as HTMLElement[];
    items.forEach((el) => (el.dataset.state = 'ahead'));
    list.setAttribute('data-focus-ready', '');
    items.forEach((el) => {
      ScrollTrigger.create({
        // One reading line at 58% of the viewport. The end reaches across the gap to the next item,
        // so exactly one item is active at a time.
        trigger: el, start: 'top 58%', end: () => `bottom+=${parseFloat(getComputedStyle(list).rowGap) || 0} 58%`,
        onEnter: () => (el.dataset.state = 'active'),
        onEnterBack: () => (el.dataset.state = 'active'),
        onLeave: () => (el.dataset.state = 'past'),
        onLeaveBack: () => (el.dataset.state = 'ahead'),
      });
    });
    return () => { list.removeAttribute('data-focus-ready'); items.forEach((el) => delete el.dataset.state); };
  });

  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const fmt = (n: number) => (el.dataset.countFormat === 'compact' ? compact(Math.round(n)) : Math.round(n).toLocaleString(el.dataset.countLocale ?? document.documentElement.lang));
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
