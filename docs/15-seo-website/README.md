# 15. SEO — WEBSITE

## 1. SEO Strategy
To capture high-intent academic search traffic from students searching for Tribhuvan University B.Ed study notes, the platform implements comprehensive search engine optimization using dynamic metadata tags, OpenGraph previews, and structured JSON-LD schemas.

## 2. Dynamic SEO Hook (`useSEO`)
Located in `apps/learn/src/hooks/useSEO.ts`:
- Dynamically updates `document.title` on client-side route changes.
- Injects standard meta tags: `description`, `keywords`, `robots`.
- Injects OpenGraph properties (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`).
- Injects Twitter Card properties (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).

## 3. Targeted Keyword Matrix
- **Primary Keywords:** `TU B.Ed English notes`, `Tribhuvan University B.Ed English video lessons`, `KC Class BHW`, `B.Ed 1st year linguistics TU`, `B.Ed 2nd year phonetics and phonology notes`.
- **Secondary Keywords:** `B.Ed English question bank Nepal`, `TSC English preparation notes`, `Tribhuvan University teacher education video classes`.

## 4. Structured Data (JSON-LD)
Injected in `apps/learn/index.html`:
```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "KC Class BHW",
  "url": "https://kcclassbhw.com",
  "description": "Tribhuvan University B.Ed English online learning platform with video lectures, notes, and exam prep.",
  "sameAs": [
    "https://www.youtube.com/@kcclassbhw"
  ]
}
```

## 5. Technical SEO Assets
- **`robots.txt`**: Directs search engine crawlers to public content while disallowing sensitive admin and internal routes (`/admin/*`, `/api/*`).
- **`sitemap.xml`**: Lists canonical public URLs (`/`, `/courses`, `/videos`, `/pricing`, `/about`).
- **Canonical URLs**: Canonical link tags prevent duplicate content issues across URL query variants.
