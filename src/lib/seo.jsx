import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Luxe Craft Atelier';
const SITE_URL = 'https://luxecraft.example';
const DEFAULT_DESCRIPTION =
  'Luxe Craft Atelier — slow-fashion heirloom crochet. Hand-finished bouquets, charms, and totes in GOTS-certified organic yarns.';

/**
 * Per-route SEO component:
 *   <Seo title="Shop · Luxe Craft Atelier" description="..." path="/shop" image={ogImage} />
 */
export function Seo({ title, description = DEFAULT_DESCRIPTION, path = '/', image }) {
  const fullTitle = title
    ? `${title} · ${SITE_NAME}`
    : `${SITE_NAME} · Slow-Fashion Crochet Atelier`;
  const canonical = `${SITE_URL}${path}`;
  const ogImage = image || '/og-default.jpg';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
