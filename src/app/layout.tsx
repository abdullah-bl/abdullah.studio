import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const geistSans = Rubik({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Abdullah Bl - Portfolio",
  description: "Abdullah Bl's portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
