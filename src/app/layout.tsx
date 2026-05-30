import type { Metadata } from "next";
import { IBM_Plex_Sans, Manrope } from "next/font/google";
import { cookies } from "next/headers";

import "@/app/globals.css";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { appConfig } from "@/lib/config/app-config";
import { AppProviders } from "@/providers/app-providers";

const headingFont = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: `${appConfig.appName} | Gestión administrativa`,
  description: "Panel administrativo interno para FABRYOR.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasSessionCandidate = Boolean(
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  );

  return (
    <html lang="es" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>
        <AppProviders hasSessionCandidate={hasSessionCandidate}>{children}</AppProviders>
      </body>
    </html>
  );
}
