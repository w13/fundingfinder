import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Navigation from "../components/Navigation";
import Breadcrumbs from "../components/Breadcrumbs";
import { ErrorBoundary } from "../components/ErrorBoundary";
import ErrorDisplay from "../components/ErrorDisplay";

export const metadata: Metadata = {
  title: "Grant Sentinel",
  description: "Grant aggregator for private-sector opportunities."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <header className="header">
              <div className="container header__content">
                <Link href="/" className="header__brand" style={{ textDecoration: "none", color: "inherit" }}>
                  <h1>Grant Sentinel</h1>
                </Link>
                <Navigation />
              </div>
            </header>
            <div className="breadcrumbs-container">
              <div className="container">
                <Breadcrumbs />
              </div>
            </div>
            <main style={{ flex: 1, padding: "32px 0" }}>
              <div className="container">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </div>
            </main>
            <footer className="footer">
              <div className="container">
                Grant Sentinel aggregates data from multiple public funding sources. This product is not endorsed or certified by any government agency or funding organization.
              </div>
            </footer>
            <ErrorDisplay maxErrors={5} autoHide={true} autoHideDelay={5000} />
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
