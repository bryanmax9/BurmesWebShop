import { useEffect } from "react";

/**
 * useSEO hook to manage document title and meta tags dynamically.
 * Useful for SEO and social media previews.
 */
export default function useSEO({ title, description, ogImage, ogType = "website" }) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      // 1. Set Document Title
      const fullTitle = title ? `${title} | Burmes & Co.` : "Burmes & Co. | Joyería Fina y Relojes en Perú";
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
      updateTag('meta[name="description"]', "content", description || "Burmes & Co.: Joyería líder en Perú. Anillos de compromiso, joyas de oro 18k y relojes de lujo. Diseños exclusivos y artesanía de clase mundial.");
      updateTag('meta[name="keywords"]', "content", "joyería, anillos de compromiso, relojes de lujo, perú, joyas personalizadas, diamantes, oro");
      updateTag('meta[name="robots"]', "content", "index, follow");

      // 4. Update Canonical Link
      const canonicalUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "https://burmes.com.pe/";
      updateTag('link[rel="canonical"]', "href", canonicalUrl, true);

      // 5. Update Apple Touch Icon
      updateTag('link[rel="apple-touch-icon"]', "href", "/favicon.jpg", true);

      // 6. Update Open Graph Meta Tags (for Facebook, WhatsApp, etc.)
      updateTag('meta[property="og:title"]', "content", fullTitle);
      updateTag('meta[property="og:description"]', "content", description || "Joyas exclusivas, anillos de compromiso y relojes de alta gama en Perú.");
      updateTag('meta[property="og:type"]', "content", ogType);
      updateTag('meta[property="og:url"]', "content", canonicalUrl);
      updateTag('meta[property="og:site_name"]', "content", "Burmes & Co.");
      if (ogImage) {
        updateTag('meta[property="og:image"]', "content", ogImage);
      }

      // 7. Update Twitter Meta Tags
      updateTag('meta[name="twitter:card"]', "content", "summary_large_image");
      updateTag('meta[name="twitter:title"]', "content", fullTitle);
      updateTag('meta[name="twitter:description"]', "content", description || "Elegancia y tradición en joyería fina y relojes de lujo peruana.");
      if (ogImage) {
        updateTag('meta[name="twitter:image"]', "content", ogImage);
      }
      updateTag('meta[name="twitter:site"]', "content", "@BurmesCo"); // Placeholder or actual handle if desired
    }
  }, [title, description, ogImage, ogType]);
}
