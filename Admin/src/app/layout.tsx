import type { Metadata } from "next";
import { Manrope, DM_Sans } from "next/font/google";
import "./globals.css";
import { AdminAuthProvider } from "@/context/admin-auth-context";

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
  title: "Vode Ops — Control & Ledger Portal",
  description: "Vode Operations, Maker-Checker Review, Reconciliation, and Ledger Portal",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${dmSans.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-[#FAF9F5] text-[#0D0D0C] font-body selection:bg-[#0D0D0C] selection:text-[#FAF9F5]">
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </body>
    </html>
  );
}
