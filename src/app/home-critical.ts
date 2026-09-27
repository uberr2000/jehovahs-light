/**
 * Home layout + chrome type that must apply even if the hashed Tailwind
 * chunk is stale / missing arbitrary utilities. Inlined into the HTML
 * document (not only `/_next/static/chunks/*.css`).
 *
 * Type is 3× the current develop computed sizes (16px root), as px so a
 * tiny rem root cannot keep the pre-#19 2rem / 32px title. Compact
 * layout is viewport-sized so the WebGL canvas cannot collapse to the
 * 300×150 default.
 *
 * Mobile (390×844): brand ≤48 (single line), tagline 36, CTA 54,
 * count 96, label 36, hint 36.
 * Desktop (lg / 1440×900): brand 54, tagline 42, CTA 54, count 144,
 * label 42, hint 48.
 */
export const HOME_CRITICAL_CSS = `
html { font-size: 16px; }
html, body { height: 100%; }
.home-shell {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
}
.home-header {
  position: absolute !important;
  left: 0 !important;
  right: 0 !important;
  top: 0 !important;
  z-index: 20;
  max-height: 8.5rem;
  overflow: hidden;
}
.home-header-titles {
  min-width: 0;
  flex: 1 1 auto;
}
.home-stage {
  position: absolute !important;
  inset: 0 !important;
}
.home-globe {
  position: absolute !important;
  inset: 0 !important;
  width: 100%;
  height: 100%;
}
.home-globe-canvas,
.home-globe-canvas > div,
.home-globe-canvas canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
.home-bottom {
  position: absolute !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 10;
  max-height: 55%;
  overflow: hidden;
}
.home-brand {
  display: block;
  font-size: 48px !important;
  line-height: 1.25 !important;
  white-space: nowrap !important;
  max-width: 100%;
  overflow: hidden;
}
.home-tagline {
  font-size: 36px !important;
  line-height: 1.3 !important;
}
.home-cta {
  font-size: 54px !important;
  line-height: 1.15 !important;
  min-height: 4.75rem !important;
  overflow: visible !important;
  white-space: normal;
}
.home-count { font-size: 96px !important; line-height: 1 !important; }
.home-count-label { font-size: 36px !important; line-height: 1.1 !important; }
.home-hint {
  font-size: 36px !important;
  line-height: 1.15 !important;
  max-height: 4.6rem;
  overflow: hidden;
}
.home-hint-desktop { font-size: 36px !important; }
.home-share, .home-share button {
  font-size: 14px !important;
  line-height: 1.2 !important;
}
.home-share [role="status"],
.home-share textarea,
.home-share p {
  font-size: 11px !important;
  line-height: 1.2 !important;
}
@media (min-width: 1024px) {
  .home-shell { display: flex !important; flex-direction: column !important; }
  .home-header {
    position: static !important;
    flex-shrink: 0 !important;
    max-height: 7.5rem;
    padding-top: 0.75rem !important;
    padding-bottom: 0.75rem !important;
  }
  .home-stage {
    position: relative !important;
    inset: auto !important;
    display: flex !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
  }
  .home-globe {
    position: relative !important;
    inset: auto !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
  }
  .home-bottom {
    position: static !important;
    left: auto !important;
    right: auto !important;
    bottom: auto !important;
    width: 26rem !important;
    max-height: 100%;
    flex-shrink: 0 !important;
    overflow-y: auto !important;
  }
  .home-brand { font-size: 54px !important; }
  .home-tagline { font-size: 42px !important; }
  .home-cta { font-size: 54px !important; min-height: 4.75rem !important; }
  .home-count { font-size: 144px !important; }
  .home-count-label { font-size: 42px !important; }
  .home-hint,
  .home-hint-desktop { font-size: 48px !important; }
}
`;
