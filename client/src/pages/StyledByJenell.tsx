import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingGrid from "@/components/ListingGrid";
import { Sparkles } from "lucide-react";

export default function StyledByJenell() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-md bg-accent/20 flex items-center justify-center text-secondary">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Erode', serif" }}>
            Styled by Jenell
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Full outfit inspiration — pieces put together by Jenell to show you what's possible on a secondhand budget.
        </p>
        <ListingGrid
          category="styled"
          status="available"
          emptyMessage="Outfit posts coming soon."
        />
      </main>
      <Footer />
    </div>
  );
}
