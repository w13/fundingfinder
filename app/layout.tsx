import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grant Sentinel",
  description: "AI-native grant aggregator for private-sector opportunities."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <header
            style={{
              background: "#0f172a",
              color: "#ffffff",
              padding: "20px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: "20px" }}>Grant Sentinel</h1>
              <p style={{ margin: 0, fontSize: "12px", color: "#cbd5f5" }}>
                Private-sector grant intelligence for AI and digital health.
              </p>
            </div>
            <nav style={{ display: "flex", gap: "16px", fontSize: "14px" }}>
              <Link href="/">Dashboard</Link>
              <Link href="https://www.grants.gov">Grants.gov</Link>
            </nav>
          </header>
          <main style={{ flex: 1, padding: "32px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
            {children}
          </main>
          <footer style={{ padding: "20px 32px", background: "#e2e8f0", color: "#475569", fontSize: "12px" }}>
            <div>
              This product uses the Grants.gov API but is not endorsed or certified by the U.S. Department of Health and
              Human Services.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
