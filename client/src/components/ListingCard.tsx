import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "@shared/schema";

const BADGE_LABELS: Record<string, { label: string; className: string }> = {
  newThisWeek: { label: "New This Week", className: "bg-primary text-primary-foreground" },
  jenellsPick: { label: "Jenell's Pick", className: "bg-secondary text-secondary-foreground" },
  vintage: { label: "Vintage", className: "bg-accent text-accent-foreground" },
  under10: { label: "Under $10", className: "bg-emerald-700 text-white" },
};

interface Props {
  listing: Listing;
  showSoldBadge?: boolean;
}

export default function ListingCard({ listing, showSoldBadge }: Props) {
  const photos: string[] = (() => {
    try { return JSON.parse(listing.photos); } catch { return []; }
  })();
  const badges: string[] = (() => {
    try { return JSON.parse(listing.badges); } catch { return []; }
  })();

  const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "__PORT_5000__";
  const imgSrc = photos[0]
    ? photos[0].startsWith("/uploads")
      ? `${API_BASE}${photos[0]}`
      : photos[0]
    : null;

  return (
    <Link href={`/item/${listing.id}`} data-testid={`listing-card-${listing.id}`}>
      <div className="listing-card group rounded-md overflow-hidden bg-card border border-border hover-elevate cursor-pointer">
        {/* Photo */}
        <div className="aspect-[3/4] bg-muted overflow-hidden relative">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={listing.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No photo yet
            </div>
          )}

          {/* Sold overlay */}
          {(listing.status === "sold" || showSoldBadge) && (
            <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
              <span className="bg-background text-foreground font-bold text-sm px-3 py-1 rounded-md tracking-widest uppercase">
                Sold
              </span>
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && listing.status !== "sold" && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {badges.slice(0, 2).map((b) => {
                const info = BADGE_LABELS[b];
                if (!info) return null;
                return (
                  <Badge key={b} className={`text-xs ${info.className}`}>
                    {info.label}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-0.5">
            {listing.itemNumber} · {listing.brand}
          </p>
          <p className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">
            {listing.title}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary text-base">${listing.price.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">{listing.size}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
