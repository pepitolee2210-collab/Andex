import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import { cookies } from "next/headers";
import { COOKIES } from "@/lib/config";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// §2.2 — Inter (body) + Montserrat (headings). Variable fonts autoalojadas
// por next/font: cero requests externos, clave para el presupuesto de la landing.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ANDEX — Tu progreso cruza fronteras",
    template: "%s · ANDEX",
  },
  description:
    "Trámites, empleo, finanzas y comunidad en un solo lugar. El ecosistema para inmigrantes hispanos en Estados Unidos. Piloto en Utah.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Color de la topbar del navegador según el tema
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5EF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1929" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get(COOKIES.lang)?.value === "en" ? "en" : "es";
  const themeCookie = cookieStore.get(COOKIES.theme)?.value;
  const theme =
    themeCookie === "dark" || themeCookie === "light" ? themeCookie : undefined;

  return (
    <html
      lang={lang}
      data-theme={theme}
      className={`${inter.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
