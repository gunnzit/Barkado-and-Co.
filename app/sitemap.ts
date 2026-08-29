import { MetadataRoute } from "next";

const BASE_URL = "https://barkadoandco.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/accessories",
    "/training",
    "/grooming",
    "/walk-booking",
    "/provider",
    "/legal/terms",
    "/legal/privacy",
    "/legal/refund",
    "/legal/shipping",
    "/legal/contact",
  ];

  return staticPages.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}