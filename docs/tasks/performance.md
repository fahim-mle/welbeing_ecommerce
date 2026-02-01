# Performance Tracking

## Baseline (2026-02-02)

### Frontend
- Build output:
  - JS: ~349.76 kB (gzip ~98.41 kB)
  - CSS: ~44.91 kB (gzip ~7.72 kB)

### Backend
- Jest integration tests show mostly low-latency responses in test environment.

## Known risks / to investigate

### Frontend
- React `useEffect` missing dependency warnings (can lead to stale closures or repeated calls depending on implementation).
- Identify heavy routes and add code splitting if needed.
- Watch for unnecessary re-renders in admin screens.

### Backend
- Watch for N+1 queries as dataset grows.
- Ensure logs are structured but not excessively noisy in hot paths.
- Consider caching strategy for public catalog endpoints.

## Next steps
- Add a simple Lighthouse run (later) for key pages.
- Add a basic load test script for critical endpoints (later).
