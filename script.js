// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Init Lenis
  const lenis = new Lenis({
    lerp: 0.12,
    smoothWheel: true,
    smoothTouch: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Smooth anchor scroll via Lenis
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const el = document.querySelector(targetId);
      if (!el) return;

      e.preventDefault();
      lenis.scrollTo(el, { offset: -80 });
    });
  });

  const header = document.getElementById("main-header");
  const hero = document.getElementById("hero");
  const collabSection = document.getElementById("collab-section");
  const collabContent = document.getElementById("collab-content");

  const heroHeight = hero ? hero.offsetHeight : window.innerHeight;
  const switchPoint = heroHeight - 100;

  const isMobile = window.innerWidth < 640;
  const minScaleBase = isMobile ? 0.95 : 0.9;
  const maxScaleBase = isMobile ? 1.08 : 1.25;

  let lastScroll = 0;

  lenis.on("scroll", ({ scroll }) => {
    // Hide / show navbar
    if (header) {
      if (scroll > lastScroll && scroll > 80) {
        header.classList.add("nav-hidden");
      } else {
        header.classList.remove("nav-hidden");
      }

      // Navbar theme dark/light
      if (scroll > switchPoint) {
        header.classList.add("nav-light");
        header.classList.remove("nav-dark");
      } else {
        header.classList.add("nav-dark");
        header.classList.remove("nav-light");
      }
    }

    // "How we collaborate" zoom + fade
    if (collabSection && collabContent) {
      const sectionTop = collabSection.offsetTop;
      const sectionHeight = collabSection.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Zoom only in the first ~60% of the section
      const effectStart = sectionTop - viewportHeight * 0.3;
      const effectEnd = sectionTop + sectionHeight * 0.6;

      let progress;
      if (scroll <= effectStart) {
        progress = 0;
      } else if (scroll >= effectEnd) {
        progress = 1; // stop zooming, stay at max
      } else {
        progress = (scroll - effectStart) / (effectEnd - effectStart);
      }

      progress = Math.max(0, Math.min(1, progress)); // clamp 0–1

      const minScale = minScaleBase;
      const maxScale = maxScaleBase;
      const scale = minScale + (maxScale - minScale) * progress;

      // Fade in over the first ~30% of the effect range
      const fadeProgress = Math.min(progress / 0.3, 1);
      const opacity = fadeProgress;

      collabContent.style.setProperty("--collab-scale", scale.toString());
      collabContent.style.opacity = opacity.toString();
    }

    lastScroll = scroll;
  });
});

// After lenis.on('scroll', ...) and other logic

// Reveal collaboration cards on scroll (replays every time)
const collabCards = document.querySelectorAll(".collab-card");

if (collabCards.length > 0) {
  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // entering viewport → play intro animation
          entry.target.classList.add("collab-card-visible");
        } else {
          // leaving viewport → reset, so it animates again next time
          entry.target.classList.remove("collab-card-visible");
        }
      });
    },
    {
      threshold: 0.25, // card is "visible" when about 25% is on screen
    }
  );

  collabCards.forEach((card) => {
    cardObserver.observe(card);
  });
}

// ---------- Our partners carousel (infinite, smooth) ----------
(function () {
  const track = document.getElementById("partner-track");
  if (!track) return;

  // Duplicate items once so we can loop seamlessly
  const originalChildren = Array.from(track.children);
  originalChildren.forEach((child) => {
    const clone = child.cloneNode(true);
    track.appendChild(clone);
  });

  let offset = 0;
  const speed = 0.8; // pixels per frame (~70px/s at 60fps) – adjust for faster/slower
  let isPaused = false;
  let halfWidth;

  // Measure total width of the original set
  function measureWidth() {
    const totalWidth = originalChildren.reduce(
      (sum, el) => sum + el.getBoundingClientRect().width + 40, // 40 ~ gap (gap-10 = 2.5rem)
      0
    );
    halfWidth = totalWidth;
  }

  measureWidth();
  window.addEventListener("resize", measureWidth);

  // Pause on hover
  track.addEventListener("mouseenter", () => {
    isPaused = true;
  });
  track.addEventListener("mouseleave", () => {
    isPaused = false;
  });

  function animate() {
    if (!isPaused && halfWidth) {
      offset -= speed;
      if (Math.abs(offset) >= halfWidth) {
        offset = 0;
      }
      track.style.transform = `translateX(${offset}px)`;
    }
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();

// ---------- Fetch live social stats from Netlify function ----------
let socialStatsLoaded = false;

async function loadSocialStats() {
  try {
    const res = await fetch("/.netlify/functions/social-stats");
    if (!res.ok) return;

    const data = await res.json();
    socialStatsLoaded = true;

    const map = {
      "ig-followers": data.instagramFollowers,
      "yt-subs": data.youtubeSubscribers,
      "yt-views": data.youtubeViews,
    };

    Object.entries(map).forEach(([key, value]) => {
      if (!value) return;
      const el = document.querySelector(`.stat-number[data-stat="${key}"]`);
      if (el) {
        el.dataset.target = String(value);
      }
    });
  } catch (err) {
    console.error("Failed to load social stats", err);
  }
}

// kick off the fetch early
loadSocialStats();
