import type { Metadata } from "next";
import { Manrope, DM_Sans } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vode — Everyday Money, Right Inside WhatsApp",
  description:
    "Send money, receive payments via dedicated virtual accounts, buy airtime, and settle bills directly inside WhatsApp. No app downloads. Bank-grade security.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${dmSans.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-[#FAF9F5] text-[#0D0D0C] font-body selection:bg-[#0D0D0C] selection:text-[#FAF9F5]">
        {children}
      </body>
    </html>
  );
}
