import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WrapWise: Find the fairest wrapper",
  description: "WrapWise compares tokenized wrappers of the same real-world asset and shows the cheapest, fairest one in dollars.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
