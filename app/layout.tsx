import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "栞 Shiori — Pemesanan Buku",
  description: "Sistem pemesanan buku pelajaran LKS & PG — CV Putra Nugraha",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}{/* impeccable-live-start */}
<script src="http://localhost:8400/live.js?token=57f3b4ab-e81a-4898-92bc-d1fb61a48ae2"></script>
{/* impeccable-live-end */}
</body>
    </html>
  );
}
