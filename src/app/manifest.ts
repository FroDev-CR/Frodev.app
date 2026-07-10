import type { MetadataRoute } from "next";

// PWA: permite instalar la app en el teléfono como acceso directo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Frodev.app",
    short_name: "Frodev",
    description: "Gestor personal — finanzas y gym",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "portrait",
    lang: "es",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
