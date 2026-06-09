import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import TreasureForm from "@/components/TreasureForm";
import type { Listing } from "@shared/schema";
import logoImg from "@assets/refind-logo.jpg";
import { Sparkles, Shirt, Baby, DollarSign, Star, Recycle, Search, Leaf } from "lucide-react";

const categories = [
  { href: "/refinds", label: "ReFinds", desc: "Women's thrifted & closet cleanouts", icon: Shirt, color: "bg-primary/10 text-primary" },
  { href: "/kids", label: "Kids' ReFinds", desc: "Kids' clothing, sizes newborn–teen", icon: Baby, color: "bg-secondary/10 text-secondary" },
  { href: "/under10", label: "Under $10", desc: "Budget treasures under $10", icon: DollarSign, color: "bg-emerald-100 text-emerald-800" },
  { href: "/styled", label: "Styled by Jenell", desc: "Full outfits curated by Jenell", icon: Sparkles, color: "bg-accent/20 text-accent-foreground" },
];

const whySecondhand = [
  { icon: DollarSign, title: "Save Real Money", desc: "On average, save 50–80% compared to retail. Great style doesn't have to cost full price." },
  { icon: Leaf, title: "Reduce Waste", desc: "Every secondhand purchase keeps clothing out of landfills. Fashion can be circular." },
  { icon: Search, title: "Find Unique Pieces", desc: "One-of-a-kind finds you won't see on anyone else. The thrill of the treasure hunt." },
  { icon: Recycle, title: "Build on a Budget", desc: "Create a wardrobe you love without breaking the bank. Affordable style is real style." },
];

export default function Home() {
  const { data: newThisWeek } = useQuery<Listing[]>({
    queryKey: ["/api/listings?status=available&category=reFinds"],
  });

  const { data: jenellsPicks } = useQuery<Listing[]>({
    queryKey: ["/api/listings?status=available"],
  });

  // Filter picks client-side
  const picks = (jenellsPicks ?? []).filter((l) => {
    try {
      return JSON.parse(l.badges).includes("jenellsPick");
    } catch { return false; }
  }).slice(0, 4);

  const newest = (newThisWeek ?? []).slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 text-center md:text-left">
            <Badge className="mb-4 bg-primary/10 text-primary border-0 font-medium tracking-wide">
              St. George, Utah · Shipping Available
            </Badge>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-5 leading-tight"
              style={{ fontFamily: "'Erode', serif" }}
            >
              Secondhand<br />
              <span className="text-primary">treasures</span> worth<br />
              finding again.
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">
              Thrifted finds, closet cleanouts, kids' clothing, and styled outfits — curated so you don't have to dig.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Button asChild size="lg" data-testid="hero-cta">
                <Link href="/refinds">Shop the Closet</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#treasure-hunt" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("treasure-hunt")?.scrollIntoView({ behavior: "smooth" });
                }}>
                  Request an Item
                </a>
              </Button>
            </div>
          </div>
          <div className="shrink-0">
            <div className="w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full overflow-hidden shadow-xl border-4 border-primary/20">
              <img src={logoImg} alt="ReFind by Jenell" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── New This Week ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Erode', serif" }}>
            New This Week
          </h2>
          <Link href="/refinds" className="text-sm text-primary font-medium hover:underline">
            See all
          </Link>
        </div>
        {newest.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {newest.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="py-12 text-center border border-dashed border-border rounded-md text-muted-foreground w-full">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="font-medium">New finds dropping soon</p>
            <p className="text-sm">Check back — Jenell thrifts regularly.</p>
          </div>
        )}
      </section>

      {/* ── Browse Categories ─────────────────────────────────────────────── */}
      <section className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Erode', serif" }}>
            Browse Categories
          </h2>
          <p className="text-muted-foreground mb-8">Find exactly what you're looking for.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(({ href, label, desc, icon: Icon, color }) => (
              <Link key={href} href={href} data-testid={`cat-card-${label.replace(/\s+/g, "-").toLowerCase()}`}>
                <div className="group rounded-md border border-border bg-background p-5 hover-elevate cursor-pointer h-full flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Jenell's Picks ────────────────────────────────────────────────── */}
      {picks.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Erode', serif" }}>
                Jenell's Picks
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Pieces she personally loves</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {picks.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* ── Why Secondhand ───────────────────────────────────────────────── */}
      <section className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Erode', serif" }}>
            Why Secondhand?
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl">
            Jenell started ReFind because finding cool stuff is way more fun than paying full price for it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whySecondhand.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Treasure Hunt Request Form ────────────────────────────────────── */}
      <section id="treasure-hunt" className="max-w-6xl mx-auto px-4 py-14">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <Badge className="mb-3 bg-secondary/10 text-secondary border-0">Treasure Hunt Requests</Badge>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Erode', serif" }}>
              Can't find what you're looking for?
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Tell Jenell what size, brand, or item you want — she'll keep an eye out while thrifting.
            </p>
          </div>
          <TreasureForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
