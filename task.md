# Task: Website Performance Optimization

- [x] Caching & Third-Party Scripts
  - [x] Create `src/lib/db/queries/settings.ts` with `getCachedSetting` (`unstable_cache`)
  - [x] Modify `src/app/actions/admin-settings-actions.ts` to clear cache on update
  - [x] Update `src/app/[locale]/layout.tsx` to use cached setting and `next/script`
- [x] Image & Gallery SSR Optimization
  - [x] Enable SSR in `src/components/listing/property-gallery-loader.tsx`
- [x] Hidden Content Reduction (Print View)
  - [x] Make `PropertyPrintView` a Client Component and remove image preloading
  - [x] Load `PropertyPrintView` dynamically with `ssr: false` in `listing-detail-layout.tsx`
- [x] Offscreen Assets Deferral
  - [x] Lazy load YouTube iframes in `listing-detail-layout.tsx`
  - [x] Implement native `IntersectionObserver` lazy loading for map in `map-view-loader.tsx`
- [x] Verification
  - [x] Run `npm run test` to verify unit and integration tests pass
  - [x] Run `npm run build` to verify clean build and static generation
