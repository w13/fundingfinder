import type { Metadata } from "next";
import "./globals.css";
import Navigation from "../components/Navigation";

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
              <Navigation />
            </div>
          </header>
          <main style={{ flex: 1, padding: "32px 0" }}>
            <div className="container">{children}</div>
          </main>
          <footer className="footer">
            <div className="container">
              Grant Sentinel aggregates data from multiple public funding sources. This product is not endorsed or certified by any government agency or funding organization.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
