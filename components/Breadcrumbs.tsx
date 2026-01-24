"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BreadcrumbsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const getBreadcrumbs = () => {
    const crumbs: Array<{ label: string; href: string }> = [
      { label: "Dashboard", href: "/" }
    ];

    if (pathname === "/") {
      return crumbs;
    }

    if (pathname === "/shortlist") {
      crumbs.push({ label: "AI Analysis", href: "/shortlist" });
      return crumbs;
    }

    if (pathname === "/sources") {
      crumbs.push({ label: "Sources", href: "/sources" });
      return crumbs;
    }


    if (pathname.startsWith("/opportunities/")) {
      crumbs.push({ label: "Opportunity", href: pathname });
      return crumbs;
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, padding: 0, listStyle: "none", flexWrap: "wrap" }}>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={crumb.href} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isLast ? (
                <span style={{ color: "var(--text)", fontWeight: 500, fontSize: "13px" }}>
                  {crumb.label}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.href}
                    style={{
                      color: "var(--muted)",
                      fontSize: "13px",
                      textDecoration: "none",
                      transition: "color 0.2s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                  >
                    {crumb.label}
                  </Link>
                  <span style={{ color: "var(--border)", fontSize: "12px" }}>/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function Breadcrumbs() {
  return (
    <Suspense fallback={null}>
      <BreadcrumbsContent />
    </Suspense>
  );
}
