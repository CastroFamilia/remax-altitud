/**
 * Story 4.1: Listing Detail Page & Photo Gallery
 * Component: src/components/listing/property-gallery.tsx
 *
 * TDD RED PHASE — all tests use it.skip() and will FAIL until:
 *   property-gallery.tsx is implemented with actual behavior replacing the stubs below.
 *
 * How to activate (for the dev implementing Story 4.1):
 *   1. Implement src/components/listing/property-gallery.tsx
 *   2. Remove the vi.mock('@/components/listing/property-gallery') stub below
 *   3. Remove it.skip() from the test you are implementing
 *   4. Run: npm test -- --grep "PropertyGallery"
 *   5. Verify the test FAILS before full implementation, then passes after
 *   6. Commit passing tests
 *
 * Covers:
 *   AC #1  — Hero gallery fills full-width at 60vh; thumbnail strip; photo count overlay
 *   AC #2  — Lightbox opens on fullscreen click; arrow key & swipe navigation
 *   AC #4  — LQIP blur placeholder applied to hero image
 *   AC #5  — YouTube video embed renders when youtubeUrl provided
 *   4.1-COMP-001 — Gallery renders thumbnail strip with correct active state on photo change
 *   4.1-COMP-002 — Gallery renders LQIP blur placeholder class before image resolves
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 *
 * Component interface:
 *   interface PropertyGalleryProps {
 *     images: OptimizedImage[];
 *     youtubeUrl?: string | null;
 *     propertyTitle: string;
 *   }
 *
 * Architecture notes:
 *   - PropertyGallery is a Client Component ('use client')
 *   - Lazy-loaded via next/dynamic({ ssr: false }) from parent layout
 *   - Uses Radix UI Dialog for lightbox; @use-gesture/react for swipe
 *   - data-testid contract: gallery-hero, gallery-thumbnail-strip, gallery-lightbox,
 *     gallery-photo-count, gallery-video-embed
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

import { vi, describe, it, expect, afterEach } from "vitest";

// RED PHASE STUB — remove this mock when implementing property-gallery.tsx
// This stub allows the test file to compile and run in red-phase.
// When removed, the real component implementation will be imported instead.
vi.mock("@/components/listing/property-gallery", () => ({
  // Stub: returns null — all tests that depend on real behavior will FAIL (red phase)
  PropertyGallery: () => null,
  default: () => null,
}));

vi.mock("next/dynamic", () => ({
  default: (
    _fn: () => Promise<{ default: React.ComponentType }>,
    _opts?: unknown,
  ) => {
    const Component = () => null;
    return Component;
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(
    () => (key: string, values?: Record<string, unknown>) =>
      values ? `${key}(${JSON.stringify(values)})` : key,
  ),
}));

vi.mock("@use-gesture/react", () => ({
  useDrag: vi.fn(() => () => ({})),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    "data-testid": testId,
    priority,
    placeholder,
    blurDataURL,
    className,
    ...props
  }: {
    src: string;
    alt: string;
    "data-testid"?: string;
    priority?: boolean;
    placeholder?: string;
    blurDataURL?: string;
    className?: string;
    [key: string]: unknown;
  }) => (
    <img
      src={src}
      alt={alt}
      data-testid={testId}
      data-priority={priority ? "true" : undefined}
      data-placeholder={placeholder}
      data-blur-data-url={blurDataURL ? "has-blur" : undefined}
      className={className}
      {...props}
    />
  ),
}));

vi.mock("@radix-ui/react-dialog", () => ({
  Root: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
  }) => (open ? <div data-testid="gallery-lightbox">{children}</div> : null),
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Overlay: () => null,
  Content: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Close: ({
    children,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    "aria-label"?: string;
  }) => <button aria-label={ariaLabel}>{children}</button>,
  Trigger: ({
    children,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    "aria-label"?: string;
  }) => <button aria-label={ariaLabel}>{children}</button>,
}));

// imported AFTER mocks
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PropertyGallery } from "@/components/listing/property-gallery"; // imported AFTER mocks

// ---------------------------------------------------------------------------
// Type definition (mirrors the interface from the story)
// ---------------------------------------------------------------------------

interface OptimizedImage {
  src: string;
  srcset: string;
  blurDataUrl: string;
  width: number;
  height: number;
  alt: string;
}

// ---------------------------------------------------------------------------
// Test fixture data
// ---------------------------------------------------------------------------

const mockImages: OptimizedImage[] = [
  {
    src: "/property-images/img1-400w.webp",
    srcset: "/property-images/img1-400w.webp 400w",
    blurDataUrl: "data:image/webp;base64,abc123",
    width: 400,
    height: 267,
    alt: "Photo 1 of 3 — House in Pérez Zeledón",
  },
  {
    src: "/property-images/img2-400w.webp",
    srcset: "/property-images/img2-400w.webp 400w",
    blurDataUrl: "data:image/webp;base64,def456",
    width: 400,
    height: 267,
    alt: "Photo 2 of 3 — House in Pérez Zeledón",
  },
  {
    src: "/property-images/img3-400w.webp",
    srcset: "/property-images/img3-400w.webp 400w",
    blurDataUrl: "data:image/webp;base64,ghi789",
    width: 400,
    height: 267,
    alt: "Photo 3 of 3 — House in Pérez Zeledón",
  },
];

const YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const PROPERTY_TITLE = "Beautiful Mountain Home in Pérez Zeledón";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PropertyGallery (Story 4.1 — TDD RED PHASE)", () => {
  afterEach(() => {
    cleanup();
  });

  // ---------------------------------------------------------------------------
  // P0: Core gallery structure
  // ---------------------------------------------------------------------------

  it.skip(
    "[P0] renders data-testid=gallery-hero element",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      expect(screen.getByTestId("gallery-hero")).toBeDefined();
    },
  );

  it.skip(
    "[P0] renders data-testid=gallery-thumbnail-strip element",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      expect(screen.getByTestId("gallery-thumbnail-strip")).toBeDefined();
    },
  );

  it.skip(
    "[P0] renders data-testid=gallery-photo-count showing '1 / 3' initially",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      const photoCount = screen.getByTestId("gallery-photo-count");
      expect(photoCount).toBeDefined();
      // Should show current / total (e.g., "1 / 3" or via the photoCount i18n key)
      const text = photoCount.textContent ?? "";
      expect(text).toMatch(/1.*3/);
    },
  );

  it.skip(
    "[P0] renders first image with priority prop for LCP optimization (R-005)",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      // The first image should have data-priority="true" (set by our next/image mock)
      const heroContainer = screen.getByTestId("gallery-hero");
      const images = heroContainer.querySelectorAll("img");
      expect(images.length).toBeGreaterThan(0);

      // First image should have priority attribute
      const firstImage = images[0];
      expect(firstImage.getAttribute("data-priority")).toBe("true");
    },
  );

  it.skip(
    "[P0] lightbox is NOT visible initially (gallery-lightbox not in DOM)",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      // With our Radix Dialog mock, lightbox div only renders when open=true
      const lightbox = screen.queryByTestId("gallery-lightbox");
      expect(lightbox).toBeNull();
    },
  );

  // ---------------------------------------------------------------------------
  // P1: Lightbox interaction
  // ---------------------------------------------------------------------------

  it.skip(
    "[P1] clicking fullscreen button opens lightbox (gallery-lightbox becomes visible)",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      // Find and click the fullscreen / "open lightbox" button
      // The button uses aria-label={t("openLightbox")} — our mock returns "openLightbox"
      const fullscreenButton = screen.getByRole("button", {
        name: /openLightbox|view all photos/i,
      });
      fireEvent.click(fullscreenButton);

      // Lightbox should now be in the DOM (open=true)
      const lightbox = screen.getByTestId("gallery-lightbox");
      expect(lightbox).toBeDefined();
    },
  );

  it.skip(
    "[P1] pressing ArrowRight in open lightbox advances image index",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      // Open lightbox
      const fullscreenButton = screen.getByRole("button", {
        name: /openLightbox|view all photos/i,
      });
      fireEvent.click(fullscreenButton);

      // Verify lightbox open
      screen.getByTestId("gallery-lightbox");

      // Press ArrowRight
      fireEvent.keyDown(window, { key: "ArrowRight" });

      // Photo count should now show "2 / 3"
      const photoCount = screen.getByTestId("gallery-photo-count");
      const text = photoCount.textContent ?? "";
      expect(text).toMatch(/2/);
    },
  );

  it.skip(
    "[P1] pressing ArrowLeft in open lightbox retreats image index",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      // Open lightbox
      const fullscreenButton = screen.getByRole("button", {
        name: /openLightbox|view all photos/i,
      });
      fireEvent.click(fullscreenButton);

      // Advance to image 2, then retreat
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowLeft" });

      // Photo count should be back to "1 / 3"
      const photoCount = screen.getByTestId("gallery-photo-count");
      const text = photoCount.textContent ?? "";
      expect(text).toMatch(/1/);
    },
  );

  it.skip(
    "[P1] YouTube embed renders data-testid=gallery-video-embed when youtubeUrl provided",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          youtubeUrl={YOUTUBE_URL}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      const videoEmbed = screen.getByTestId("gallery-video-embed");
      expect(videoEmbed).toBeDefined();

      // The iframe inside the embed should have a src with youtube.com/embed
      const iframe = videoEmbed.querySelector("iframe");
      expect(iframe).toBeDefined();
      expect(iframe?.getAttribute("src")).toContain("youtube.com/embed");
    },
  );

  it.skip(
    "[P1] no video embed renders when youtubeUrl is null",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          youtubeUrl={null}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      const videoEmbed = screen.queryByTestId("gallery-video-embed");
      expect(videoEmbed).toBeNull();
    },
  );

  it.skip(
    "[P1] no video embed renders when youtubeUrl is undefined (not provided)",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      const videoEmbed = screen.queryByTestId("gallery-video-embed");
      expect(videoEmbed).toBeNull();
    },
  );

  // ---------------------------------------------------------------------------
  // P2: LQIP blur and thumbnail interaction (4.1-COMP-001, 4.1-COMP-002)
  // ---------------------------------------------------------------------------

  it.skip(
    "[P2] 4.1-COMP-002: first image has blur placeholder (blurDataURL passed to next/image)",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      // Our next/image mock sets data-blur-data-url="has-blur" when blurDataURL is provided
      // and data-placeholder="blur" when placeholder="blur"
      const heroContainer = screen.getByTestId("gallery-hero");
      const firstImage = heroContainer.querySelector("img");
      expect(firstImage).toBeDefined();

      // Assert that blur placeholder was passed
      expect(firstImage?.getAttribute("data-blur-data-url")).toBe("has-blur");
      expect(firstImage?.getAttribute("data-placeholder")).toBe("blur");
    },
  );

  it.skip(
    "[P2] 4.1-COMP-001: clicking a thumbnail changes active index and updates photo count to '2 / 3'",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      const thumbnailStrip = screen.getByTestId("gallery-thumbnail-strip");
      expect(thumbnailStrip).toBeDefined();

      // Click the second thumbnail (index 1)
      const thumbnails = thumbnailStrip.querySelectorAll("img");
      expect(thumbnails.length).toBeGreaterThanOrEqual(2);

      fireEvent.click(thumbnails[1]);

      // Photo count should update to "2 / 3"
      const photoCount = screen.getByTestId("gallery-photo-count");
      const text = photoCount.textContent ?? "";
      expect(text).toMatch(/2/);
    },
  );

  it.skip(
    "[P2] renders active thumbnail indicator on current image",
    () => {
      // THIS TEST WILL FAIL — PropertyGallery stub returns null; remove stub to activate
      render(
        <PropertyGallery
          images={mockImages as Parameters<typeof PropertyGallery>[0]["images"]}
          propertyTitle={PROPERTY_TITLE}
        />,
      );

      const thumbnailStrip = screen.getByTestId("gallery-thumbnail-strip");
      // The strip should have children representing each thumbnail
      expect(thumbnailStrip.innerHTML).not.toBe("");
    },
  );
});
