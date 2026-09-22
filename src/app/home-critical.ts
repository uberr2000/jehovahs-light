/**
 * Home layout + chrome type that must apply even if the hashed Tailwind
 * chunk is stale / missing arbitrary utilities. Inlined into the HTML
 * document (not only `/_next/static/chunks/*.css`).
 *
 * Type is px (not rem) so a tiny root font-size cannot keep the title at
 * the pre-#19 2rem / 32px computed size. Compact layout is viewport-sized
 * so the WebGL canvas cannot collapse to the 300×150 default.
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
}
.home-brand { font-size: 96px !important; line-height: 1 !important; }
.home-tagline { font-size: 72px !important; line-height: 1 !important; }
.home-cta { font-size: 84px !important; line-height: 1 !important; }
.home-count { font-size: 132px !important; line-height: 1 !important; }
.home-count-label { font-size: 42px !important; line-height: 1 !important; }
.home-hint { font-size: 48px !important; line-height: 1 !important; }
.home-hint-desktop { font-size: 84px !important; }
.home-lit-title { font-size: 60px !important; line-height: 1 !important; }
.home-lit-message { font-size: 42px !important; line-height: 1 !important; }
.home-brand, .home-tagline, .home-cta, .home-count, .home-count-label, .home-hint, .home-lit-title, .home-lit-message {
  overflow-wrap: anywhere;
  word-break: break-word;
  max-width: 100%;
}
@media (min-width: 640px) {
  .home-brand { font-size: 108px !important; }
  .home-tagline { font-size: 84px !important; }
  .home-hint-desktop { font-size: 96px !important; }
}
@media (min-width: 1024px) {
  .home-shell { display: flex !important; flex-direction: column !important; }
  .home-header {
    position: static !important;
    flex-shrink: 0 !important;
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
    flex-shrink: 0 !important;
  }
  .home-cta { font-size: 108px !important; }
  .home-count { font-size: 288px !important; }
  .home-count-label { font-size: 84px !important; }
  .home-lit-title { font-size: 90px !important; }
  .home-lit-message { font-size: 54px !important; }
}
`;
