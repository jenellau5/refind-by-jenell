import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingGrid from "@/components/ListingGrid";
import { DollarSign } from "lucide-react";

export default function Under10() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700">
            <DollarSign className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Erode', serif" }}>
            Under $10 Finds
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Budget-friendly treasures all under $10. Great style, tiny price tag.
        </p>
        <ListingGrid
          category="under10"
          status="available"
          emptyMessage="No under-$10 items right now — more coming soon."
        />
      </main>
      <Footer />
    </div>
  );
}
