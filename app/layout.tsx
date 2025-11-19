import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorHandler } from "./error-handler";
import PDFjsLoader from "@/components/PDFjsLoader";
import { PDFjsProvider } from "@/contexts/PDFjsContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Minuty - Digital Document Minuting & Signing",
  description: "Professional tool for digital minuting and signing of documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <PDFjsProvider>
          <PDFjsLoader />
          <ErrorHandler />
          <ThemeProvider>{children}</ThemeProvider>
        </PDFjsProvider>
      </body>
    </html>
  );
}
