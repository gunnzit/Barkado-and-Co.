import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/provider", "/owner", "/cart", "/api"],
    },
    sitemap: "https://barkadoandco.com/sitemap.xml",
  };
}