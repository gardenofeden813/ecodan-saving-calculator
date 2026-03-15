import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "ATW Heat Pump Simulator | Ecodan Savings Calculator",
  description: "Calculate your potential savings when switching from a gas boiler to an air-to-water heat pump. Real-time cost-benefit analysis with IRA tax credit estimates.",
};

export const viewport: Viewport = {
  themeColor: "#040c1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
