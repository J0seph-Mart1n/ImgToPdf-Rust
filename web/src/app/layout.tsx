import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocForge AI — Local Image to HTML & PDF Converter",
  description:
    "Convert scanned documents, receipts, and photos into semantic HTML5 and vector PDFs using 100% local vision AI powered by Rust, Dioxus, Ollama, and Chromium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
