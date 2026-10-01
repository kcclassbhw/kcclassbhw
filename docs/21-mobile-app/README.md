# 21. MOBILE APP

## 1. Mobile First Architecture
Because over 75% of tertiary students in Nepal access the internet via Android smartphones, **KC Class BHW** was engineered from the ground up as a responsive, touch-optimized web application with immediate **Progressive Web App (PWA)** capabilities.

## 2. PWA Features & Capabilities
- **Installability:** Add to Home Screen prompt allows students to launch the app in standalone fullscreen mode without browser URL bars.
- **Fast Offline Navigation:** Static assets, CSS, icons, and shell layouts are cached via Service Worker, ensuring snappy transitions even on unstable 3G/4G cellular networks in rural areas.
- **Responsive Touch Design:**
  - 44px+ minimum touch targets for all buttons and interactive tabs.
  - Swipe gestures and collapsible mobile drawers for navigation sheets and lesson playlists.
  - Auto-resizing 16:9 YouTube video player that seamlessly fills viewport widths.

## 3. Native App Roadmap (Capacitor / React Native)
- **Phase 1 (Current):** Responsive Mobile Web & PWA with full feature parity.
- **Phase 2 (Roadmap):** Wrap web app via **CapacitorJS** to generate native Android `.apk` and publish to Google Play Store.
  - Native push notifications via Firebase Cloud Messaging (FCM).
  - Secure offline caching of lesson notes and PDF slide decks.
  - In-app digital wallet integration directly invoking installed eSewa / Khalti apps.
