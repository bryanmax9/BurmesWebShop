import { useEffect } from "react";

/**
 * useSEO hook to manage document title and meta tags dynamically.
 * Useful for SEO and social media previews.
 */
export default function useSEO({ title, description, ogImage, ogType = "website" }) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      // 1. Set Document Title
      const fullTitle = title ? `${title} | Burmes & Co. | Fine Jewellery & Watches` : "Burmes & Co. | Fine Jewellery, Engagement Rings & Luxury Watches";
      document.title = fullTitle;

      // 2. Helper to find/create/update meta tags
      const updateTag = (selector, attr, value, isLink = false) => {
        if (value === undefined || value === null) return;
        
        let element = document.querySelector(selector);
        if (!element) {
          element = document.createElement(isLink ? "link" : "meta");
          if (isLink) {
            if (selector.includes("rel=\"canonical\"")) element.setAttribute("rel", "canonical");
            if (selector.includes("rel=\"apple-touch-icon\"")) element.setAttribute("rel", "apple-touch-icon");
          } else {
            const match = selector.match(/\[(name|property)="([^"]+)"\]/);
            if (match) element.setAttribute(match[1], match[2]);
          }
          document.head.appendChild(element);
        }
        element.setAttribute(attr, value);
      };

      // 3. Update Standard Meta Tags
      updateTag('meta[name="description"]', "content", description || "Burmes & Co. offers premium jewellery, engagement rings, and luxury watches. Explore our collections of pendants, chains, rings, and more.");
      updateTag('meta[name="robots"]', "content", "index, follow");

      // 4. Update Canonical Link
      const canonicalUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
      updateTag('link[rel="canonical"]', "href", canonicalUrl, true);

      // 5. Update Apple Touch Icon
      updateTag('link[rel="apple-touch-icon"]', "href", "/favicon.jpg", true);

      // 6. Update Open Graph Meta Tags (for Facebook, WhatsApp, etc.)
      updateTag('meta[property="og:title"]', "content", fullTitle);
      updateTag('meta[property="og:description"]', "content", description || "Burmes & Co. | Fine Jewellery & Watches");
      updateTag('meta[property="og:type"]', "content", ogType);
      if (ogImage) {
        updateTag('meta[property="og:image"]', "content", ogImage);
      }

      // 7. Update Twitter Meta Tags
      updateTag('meta[name="twitter:card"]', "content", "summary_large_image");
      updateTag('meta[name="twitter:title"]', "content", fullTitle);
      updateTag('meta[name="twitter:description"]', "content", description || "Burmes & Co. | Fine Jewellery & Watches");
      if (ogImage) {
        updateTag('meta[name="twitter:image"]', "content", ogImage);
      }
    }
  }, [title, description, ogImage, ogType]);
}
