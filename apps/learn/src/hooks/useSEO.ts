import { useEffect } from "react";

const SITE_NAME = "KC Class BHW";
const DEFAULT_DESC =
  "The complete online academy for B.Ed English students. Clear video lessons, grammar in depth, exam-focused notes — all from KC Class BHW.";
const DEFAULT_OG_IMAGE = "/opengraph.jpg";
const BASE_TITLE = "KC Class BHW — B.Ed English Academy";

function setMeta(nameOrProp: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${nameOrProp}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, nameOrProp);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href.split("?")[0]);
}

function absoluteImage(src: string): string {
  if (src.startsWith("http")) return src;
  return `${window.location.origin}${src.startsWith("/") ? "" : "/"}${src}`;
}

export interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

export function useSEO({ title, description, ogImage, ogType = "website", noIndex = false }: SEOProps = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : BASE_TITLE;
    const desc = description ?? DEFAULT_DESC;
    const image = absoluteImage(ogImage ?? DEFAULT_OG_IMAGE);
    const url = window.location.href.split("?")[0];

    document.title = fullTitle;

    setMeta("description", desc);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    setMeta("og:title", fullTitle, true);
    setMeta("og:description", desc, true);
    setMeta("og:url", url, true);
    setMeta("og:image", image, true);
    setMeta("og:image:width", "1200", true);
    setMeta("og:image:height", "630", true);
    setMeta("og:site_name", SITE_NAME, true);
    setMeta("og:type", ogType, true);

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", image);

    setCanonical(url);
  }, [title, description, ogImage, ogType, noIndex]);
}
