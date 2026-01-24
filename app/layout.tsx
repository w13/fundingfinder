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
          <header className="header">
            <div className="container header__content">
              <div className="header__brand">
                <h1>Grant Sentinel</h1>
                <p>Enterprise grant intelligence for AI and digital health.</p>
              </div>
              <nav className="header__nav">
                <Link href="/">Dashboard</Link>
                <Link href="/shortlist">Shortlist</Link>
                <Link href="/admin">Admin</Link>
                <Link href="/admin?tab=sources">Sources</Link>
                <Link href="https://ted.europa.eu/">TED</Link>
                <Link href="https://sam.gov">SAM.gov</Link>
              </nav>
            </div>
          </header>
          <main style={{ flex: 1, padding: "32px 0" }}>
            <div className="container">{children}</div>
          </main>
          <footer className="footer">
            <div className="container">
              This product uses the Grants.gov API but is not endorsed or certified by the U.S. Department of Health and
              Human Services.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
