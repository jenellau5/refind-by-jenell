import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingGrid from "@/components/ListingGrid";
import { Shirt } from "lucide-react";

export default function ReFinds() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <Shirt className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Erode', serif" }}>
            ReFinds
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Women's thrifted finds, personal closet cleanouts, and curated secondhand pieces.
        </p>
        <ListingGrid
          category="reFinds"
          status="available"
          emptyMessage="No ReFinds available right now."
        />
      </main>
      <Footer />
    </div>
  );
}
