"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function NavigationContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const isActive = (href: string) => {
    if (href.includes("?")) {
      const [path, query] = href.split("?");
      // For query params, both path and query must match
      if (pathname !== path) return false;
      const params = new URLSearchParams(query);
      for (const [key, value] of params.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
      return true;
    }
    // For paths without query, check exact match
    if (pathname !== href) return false;
    return true;
  };

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/sources", label: "Sources" },
    { href: "/shortlist", label: "AI Analysis" }
  ];

  return (
    <nav className="header__nav">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "header__nav-link header__nav-link--active" : "header__nav-link"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Navigation() {
  return (
    <Suspense fallback={
      <nav className="header__nav">
        <div className="header__nav-link">Dashboard</div>
        <div className="header__nav-link">Sources</div>
        <div className="header__nav-link">AI Analysis</div>
      </nav>
    }>
      <NavigationContent />
    </Suspense>
  );
}
