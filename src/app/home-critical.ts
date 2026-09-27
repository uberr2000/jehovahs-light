/**
 * Home layout + chrome type that must apply even if the hashed Tailwind
 * chunk is stale / missing arbitrary utilities. Inlined into the HTML
 * document (not only `/_next/static/chunks/*.css`).
 *
 * Type is 3× the current develop computed sizes (16px root), as px.
 * No overflow:hidden clip caps — tagline and hint stay at 3×, may wrap,
 * and must stay fully visible (never clip, never shrink). See
 * docs/home-framing.md.
 */
import {
  HOME_BRAND_PX,
  HOME_COUNT_DESKTOP_PX,
  HOME_COUNT_MOBILE_PX,
  HOME_CTA_PX,
  HOME_HINT_DESKTOP_PX,
  HOME_HINT_MOBILE_PX,
  HOME_LABEL_DESKTOP_PX,
  HOME_LABEL_MOBILE_PX,
  HOME_TAGLINE_DESKTOP_PX,
  HOME_TAGLINE_MOBILE_PX,
} from '@/lib/home-chrome';

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
  overflow: visible;
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
  overflow: visible;
}
.home-brand {
  display: block;
  font-size: ${HOME_BRAND_PX}px !important;
  line-height: 1.3 !important;
  white-space: nowrap !important;
  max-width: 100%;
  overflow: visible;
}
.home-tagline {
  display: block;
  font-size: ${HOME_TAGLINE_MOBILE_PX}px !important;
  line-height: 1.3 !important;
  overflow: visible;
  overflow-wrap: anywhere;
}
.home-cta {
  font-size: ${HOME_CTA_PX}px !important;
  line-height: 1.15 !important;
  min-height: 4.75rem !important;
  overflow: visible !important;
  white-space: normal;
}
.home-count { font-size: ${HOME_COUNT_MOBILE_PX}px !important; line-height: 1.3 !important; overflow: visible; }
.home-count-label { font-size: ${HOME_LABEL_MOBILE_PX}px !important; line-height: 1.3 !important; overflow: visible; }
.home-hint {
  font-size: ${HOME_HINT_MOBILE_PX}px !important;
  line-height: 1.3 !important;
  overflow: visible;
  overflow-wrap: anywhere;
}
.home-hint-desktop { font-size: ${HOME_HINT_MOBILE_PX}px !important; }
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
    overflow: visible;
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
    width: 28rem !important;
    max-height: 100%;
    flex-shrink: 0 !important;
    overflow: visible !important;
  }
  .home-brand { font-size: ${HOME_BRAND_PX}px !important; }
  .home-tagline { font-size: ${HOME_TAGLINE_DESKTOP_PX}px !important; }
  .home-cta { font-size: ${HOME_CTA_PX}px !important; min-height: 4.75rem !important; }
  .home-count { font-size: ${HOME_COUNT_DESKTOP_PX}px !important; }
  .home-count-label { font-size: ${HOME_LABEL_DESKTOP_PX}px !important; }
  .home-hint,
  .home-hint-desktop { font-size: ${HOME_HINT_DESKTOP_PX}px !important; }
}
`;
