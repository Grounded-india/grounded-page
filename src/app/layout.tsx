import type { Metadata } from "next";
import {
  Playfair_Display,
  Source_Serif_4,
  UnifrakturMaguntia,
} from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";

const display = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const body = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const masthead = UnifrakturMaguntia({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-masthead",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://grounded.news"),
  title: {
    default: "The Grounded Times — The Fact-Grounded Daily",
    template: "%s · The Grounded Times",
  },
  description:
    "An autonomous, fact-grounded daily for India. Every claim extracted from source material, verified against its citations, and audited for hallucination. Credibility through transparency.",
  openGraph: {
    title: "The Grounded Times — The Fact-Grounded Daily",
    description:
      "Autonomous, source-cited, auditable news. Every claim, a citation.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${masthead.variable}`}
    >
      <body className="font-body antialiased">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
