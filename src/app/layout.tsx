import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Hanken_Grotesk, Noto_Sans_Oriya } from "next/font/google";
import "./globals.css";
import Chrome from "@/components/Chrome";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
});

const oriya = Noto_Sans_Oriya({
  subsets: ["oriya"],
  weight: ["400", "600", "700"],
  variable: "--font-oriya",
});

export const metadata: Metadata = {
  title: "AgriSetu — Odisha's Farm-to-Fair-Price Bridge",
  description:
    "Live mandi prices, net-return selling advice, harvest rescue (AgriDecay 2.0), storage & transport pooling and FarmProof credit identity — built for Odisha's small & marginal farmers.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable} ${oriya.variable}`}>
      <body
        className="antialiased"
        style={{
          fontFamily: "var(--font-body)",
          ["--font-display" as string]: "var(--font-fraunces)",
          ["--font-body" as string]: "var(--font-hanken)",
        }}
      >
        <style>{`.odia{font-family:var(--font-oriya),"Kalinga",sans-serif}`}</style>
        <Chrome>{children}</Chrome>
      </body>
    </html>
  );
}
