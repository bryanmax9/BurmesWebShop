import { useEffect } from "react";

/**
 * useSEO hook to manage document title and meta tags dynamically.
 * Useful for SEO and social media previews.
 */
export default function useSEO({ title, description, ogImage, ogType = "website" }) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      // 1. Set Document Title
      const fullTitle = title ? `${title} | Burmes & Co.` : "Burmes & Co. | Fine Jewellery & Watches";
      document.title = fullTitle;

      // 2. Helper to find/create/update meta tags
      const updateMeta = (name, content, attr = "name") => {
        if (content === undefined || content === null) return;
        
        let element = document.querySelector(`meta[${attr}="${name}"]`);
        if (!element) {
          element = document.createElement("meta");
          element.setAttribute(attr, name);
          document.head.appendChild(element);
        }
        element.setAttribute("content", content);
      };

      // 3. Update Standard Meta Tags
      updateMeta("description", description || "Burmes & Co. offers premium jewellery, engagement rings, and luxury watches. Explore our collections of pendants, chains, rings, and more.");
      updateMeta("robots", "index, follow");

      // 4. Update Open Graph Meta Tags (for Facebook, WhatsApp, etc.)
      updateMeta("og:title", fullTitle, "property");
      updateMeta("og:description", description || "Burmes & Co. | Fine Jewellery & Watches", "property");
      updateMeta("og:type", ogType, "property");
      if (ogImage) {
        updateMeta("og:image", ogImage, "property");
      }

      // 5. Update Twitter Meta Tags
      updateMeta("twitter:card", "summary_large_image");
      updateMeta("twitter:title", fullTitle);
      updateMeta("twitter:description", description || "Burmes & Co. | Fine Jewellery & Watches");
      if (ogImage) {
        updateMeta("twitter:image", ogImage);
      }
    }
  }, [title, description, ogImage, ogType]);
}
