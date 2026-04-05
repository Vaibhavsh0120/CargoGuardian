import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CargoGuardian",
    short_name: "CargoGuardian",
    description: "Dashboard-first rail cargo clearance, telemetry, and incident monitoring.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f7f2",
    theme_color: "#14532d",
    icons: [
      {
        src: "/icons/logo.png",
        sizes: "1024x1024",
        type: "image/png"
      },
      {
        src: "/icons/logo.png",
        sizes: "1024x1024",
        type: "image/png"
      }
    ]
  };
}
