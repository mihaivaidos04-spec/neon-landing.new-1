import type { MetadataRoute } from "next";
import { getPublicSiteOrigin } from "@/src/lib/public-site-url";

const siteUrl = getPublicSiteOrigin();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/private"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
