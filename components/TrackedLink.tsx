"use client";

import Link, { type LinkProps } from "next/link";
import { useCallback, type ReactNode, type CSSProperties } from "react";
import { logSearchClick } from "../lib/api/search";
import { useErrorLogger } from "../lib/errors/useErrorLogger";

type TrackedLinkProps = LinkProps & {
  className?: string;
  style?: CSSProperties;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
  event: {
    query?: string | null;
    sourceFilter?: string | null;
    minScore?: number | null;
    mode?: "smart" | "exact" | "any" | null;
    opportunityId: string;
    source: string;
    resultId?: string | null;
    position?: number | null;
    correlationId?: string | null;
  };
};

export default function TrackedLink({ event, onClick, ...props }: TrackedLinkProps) {
  const { logWarning } = useErrorLogger("TrackedLink");

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      try {
        logSearchClick(event);
      } catch (error) {
        logWarning(`Search click tracking failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [event, logWarning, onClick]
  );

  return (
    <Link {...props} onClick={handleClick}>
      {props.children}
    </Link>
  );
}
