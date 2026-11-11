// lib/safeHtml.js
//
// Product descriptions/details are HTML written in the admin panel. Always
// clean it before rendering with dangerouslySetInnerHTML: a script or
// onerror="..." in that HTML would run for every visitor and could steal the
// login token. Formatting tags, tables, links and images are kept.

import DOMPurify from "dompurify";

// Links opened from product text never get access to this page.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("href")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export const safeHtml = (html) => ({
  __html: DOMPurify.sanitize(String(html || ""), {
    USE_PROFILES: { html: true },
    // <style> could restyle the whole page; forms could fake a login box.
    FORBID_TAGS: ["style", "form", "input", "button", "iframe", "object", "embed"],
  }),
});
