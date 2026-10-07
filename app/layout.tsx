import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "栞 Shiori — Pemesanan Buku",
  description: "Sistem pemesanan buku pelajaran LKS & PG — CV Putra Nugraha",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&family=Shippori+Mincho+B1:wght@400;500;600;700;800&family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
