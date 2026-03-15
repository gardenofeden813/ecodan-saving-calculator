import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Ecodan Heat Pump Savings Calculator | Mitsubishi Electric",
  description:
    "Calculate your potential savings when switching from a gas boiler to an Ecodan air-to-water heat pump. Real-time cost-benefit analysis with IRA tax credit estimates.",
};

export const viewport: Viewport = {
  themeColor: "#ED1B2F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-surface-50 antialiased">{children}</body>
    </html>
  );
}
