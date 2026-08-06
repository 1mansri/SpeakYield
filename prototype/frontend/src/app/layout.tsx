import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Devanagari, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Speak Yield",
  description: "Speak to sell your produce or buy farm inputs — in Hindi or Bengali.",
};

// Tints the phone's status bar to the brand and lets the layout run under the notch, so
// the app sits in the device rather than inside a browser page. No maximumScale — a
// farmer who needs to pinch-zoom a rate must be able to.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2f6b3c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${notoSansDevanagari.variable} ${notoSansBengali.variable} h-full antialiased`}
    >
      {/* h-full, not min-h-full: the app shell scrolls its own content region, so the
          document itself must never scroll — otherwise the pinned tab bar scrolls away
          with the page. */}
      <body className="h-full overflow-hidden flex flex-col bg-background text-text-primary font-sans">
        {children}
      </body>
    </html>
  );
}
