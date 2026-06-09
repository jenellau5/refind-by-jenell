import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingGrid from "@/components/ListingGrid";
import { Baby } from "lucide-react";

export default function KidsReFinds() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-md bg-secondary/10 flex items-center justify-center text-secondary">
            <Baby className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Erode', serif" }}>
            Kids' ReFinds
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Kids grow fast — find great pieces without paying full price. Sizes from newborn to teen.
        </p>
        <ListingGrid
          category="kids"
          status="available"
          emptyMessage="No kids' items right now — check back soon."
        />
      </main>
      <Footer />
    </div>
  );
}
