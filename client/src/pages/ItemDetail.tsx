import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Listing } from "@shared/schema";
import { ChevronLeft, ChevronRight, MessageCircle, Instagram, Tag, Ruler, Star } from "lucide-react";

const BADGE_LABELS: Record<string, { label: string; className: string }> = {
  newThisWeek: { label: "New This Week", className: "bg-primary/10 text-primary border-0" },
  jenellsPick: { label: "Jenell's Pick", className: "bg-secondary/10 text-secondary border-0" },
  vintage: { label: "Vintage", className: "bg-accent/20 text-accent-foreground border-0" },
  under10: { label: "Under $10", className: "bg-emerald-100 text-emerald-800 border-0" },
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "__PORT_5000__";

function imgUrl(src: string) {
  return src.startsWith("/uploads") ? `${API_BASE}${src}` : src;
}

export default function ItemDetail() {
  const [, params] = useRoute("/item/:id");
  const id = params?.id ?? "";
  const [photoIdx, setPhotoIdx] = useState(0);

  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: [`/api/listings/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="max-w-5xl mx-auto w-full px-4 py-10">
          <div className="grid md:grid-cols-2 gap-10">
            <Skeleton className="aspect-[3/4] w-full rounded-md" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="max-w-5xl mx-auto w-full px-4 py-16 text-center">
          <p className="text-muted-foreground text-lg">Item not found.</p>
          <Button asChild className="mt-4"><Link href="/refinds">Browse ReFinds</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const photos: string[] = (() => { try { return JSON.parse(listing.photos); } catch { return []; } })();
  const badges: string[] = (() => { try { return JSON.parse(listing.badges); } catch { return []; } })();
  const isSold = listing.status === "sold";
  const itemNumber = listing.itemNumber;

  const igMessage = encodeURIComponent(`Hi Jenell! I'm interested in ${itemNumber} — ${listing.title}. Is it still available?`);
  const igLink = `https://ig.me/m/refindbyjenell?text=${igMessage}`;
  const offerMessage = encodeURIComponent(`Hi Jenell! I'd like to make an offer on ${itemNumber} — ${listing.title}.`);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto w-full px-4 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/refinds" className="hover:text-foreground">ReFinds</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{listing.title}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* ── Photos ── */}
          <div className="space-y-3">
            <div className="aspect-[3/4] rounded-md overflow-hidden bg-muted relative">
              {photos.length > 0 ? (
                <img
                  src={imgUrl(photos[photoIdx])}
                  alt={`${listing.title} photo ${photoIdx + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No photo
                </div>
              )}

              {isSold && (
                <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                  <span className="bg-background text-foreground font-bold px-4 py-2 rounded-md tracking-widest uppercase text-sm">
                    Sold
                  </span>
                </div>
              )}

              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
                    disabled={photoIdx === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur rounded-md p-1 disabled:opacity-30"
                    aria-label="Previous photo"
                    data-testid="photo-prev"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPhotoIdx((i) => Math.min(photos.length - 1, i + 1))}
                    disabled={photoIdx === photos.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur rounded-md p-1 disabled:opacity-30"
                    aria-label="Next photo"
                    data-testid="photo-next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                      i === photoIdx ? "border-primary" : "border-transparent"
                    }`}
                    aria-label={`View photo ${i + 1}`}
                    data-testid={`photo-thumb-${i}`}
                  >
                    <img src={imgUrl(p)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div className="space-y-5">
            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => {
                  const info = BADGE_LABELS[b];
                  return info ? (
                    <Badge key={b} className={info.className}>{info.label}</Badge>
                  ) : null;
                })}
              </div>
            )}

            {/* Item number + title */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-1">{itemNumber}</p>
              <h1 className="text-2xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Erode', serif" }}>
                {listing.title}
              </h1>
            </div>

            {/* Price */}
            <p className="text-3xl font-bold text-primary">${listing.price.toFixed(2)}</p>

            {/* Details row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="w-4 h-4 shrink-0" />
                <span><span className="font-medium text-foreground">Brand:</span> {listing.brand}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Ruler className="w-4 h-4 shrink-0" />
                <span><span className="font-medium text-foreground">Size:</span> {listing.size}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="w-4 h-4 shrink-0" />
                <span><span className="font-medium text-foreground">Condition:</span> {listing.condition}</span>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold text-foreground mb-2">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* CTA block */}
            {!isSold ? (
              <div className="border border-border rounded-md p-4 space-y-3 bg-card">
                <p className="text-sm font-semibold text-foreground">
                  To purchase, DM me the item number: <span className="text-primary font-bold">{itemNumber}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Shipping available. Shipping cost is calculated separately after purchase.
                </p>
                <Button asChild className="w-full" size="lg" data-testid="cta-dm">
                  <a href={igLink} target="_blank" rel="noopener noreferrer">
                    <Instagram className="w-4 h-4 mr-2" />
                    DM on Instagram — {itemNumber}
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full" data-testid="cta-offer">
                  <a href={`https://ig.me/m/refindbyjenell?text=${offerMessage}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Make an Offer
                  </a>
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Want to make an offer? DM, email, or text the item number and your offer.
                </p>
              </div>
            ) : (
              <div className="border border-border rounded-md p-4 bg-muted text-center">
                <p className="font-semibold text-foreground">This item has sold.</p>
                <p className="text-sm text-muted-foreground mt-1">Browse available ReFinds for similar pieces.</p>
                <Button asChild className="mt-3" variant="outline">
                  <Link href="/refinds">Browse ReFinds</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
