import { useEffect } from 'react';

const SELECTOR = '.reveal, .reveal-stagger, .hero-enter';
const THRESHOLD_ENTER = 0.08;
const BOTTOM_MARGIN   = '-5%';

function prefersReduced(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function getHeaderH(): number {
  const h = document.querySelector('header')?.offsetHeight ?? 72;
  return h + 12;
}

function makeVisible(el: HTMLElement) {
  el.classList.add('is-visible');
  el.classList.remove('is-exiting');
}

let enterObs: IntersectionObserver | null = null;
let exitObs: IntersectionObserver | null = null;
let resizeObs: ResizeObserver | null = null;
let motionMQ: MediaQueryList | null = null;

function teardown() {
  enterObs?.disconnect();
  exitObs?.disconnect();
  resizeObs?.disconnect();
  enterObs = null;
  exitObs = null;
  resizeObs = null;
}

function setup() {
  teardown();

  if (prefersReduced()) {
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach(makeVisible);
    return;
  }

  const elements = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
  if (elements.length === 0) return;

  const headerH = getHeaderH();

  enterObs = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          makeVisible(entry.target as HTMLElement);
        }
      }
    },
    {
      threshold: THRESHOLD_ENTER,
      rootMargin: `-${headerH}px 0px ${BOTTOM_MARGIN} 0px`,
    }
  );

  exitObs = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (
          !entry.isIntersecting &&
          entry.boundingClientRect.bottom < headerH
        ) {
          const el = entry.target as HTMLElement;
          if (el.classList.contains('is-visible')) {
            el.classList.add('is-exiting');
            el.classList.remove('is-visible');
          }
        }
      }
    },
    {
      threshold: 0,
      rootMargin: '0px 0px 0px 0px',
    }
  );

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();

    if (rect.bottom < headerH) {
      makeVisible(el);
    } else if (rect.top < window.innerHeight * 0.9) {
      requestAnimationFrame(() => makeVisible(el));
    } else {
      enterObs!.observe(el);
      exitObs!.observe(el);
    }
  });

  resizeObs = new ResizeObserver(() => {
    const pending = document.querySelectorAll<HTMLElement>(
      `${SELECTOR}:not(.is-visible):not(.is-exiting)`
    );
    pending.forEach((el) => {
      if (!enterObs) return;
      enterObs.unobserve(el);
      exitObs?.unobserve(el);
      enterObs.observe(el);
      exitObs?.observe(el);
    });
  });
  resizeObs.observe(document.documentElement);
}

export function useScrollReveal() {
  useEffect(() => {
    setup();

    motionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMQChange = () => setup();
    motionMQ.addEventListener('change', onMQChange);

    return () => {
      teardown();
      motionMQ?.removeEventListener('change', onMQChange);
    };
  }, []);
}

export function triggerRevealScan() {
  requestAnimationFrame(() => {
    setTimeout(setup, 60);
  });
}
