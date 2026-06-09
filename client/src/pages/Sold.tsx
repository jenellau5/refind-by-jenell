import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingGrid from "@/components/ListingGrid";
import { CheckCircle } from "lucide-react";

export default function Sold() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Erode', serif" }}>
            Sold Items
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">
          These found their new home. Browse what's gone to get a feel for what Jenell curates — new finds drop regularly.
        </p>
        <ListingGrid
          status="sold"
          emptyMessage="No sold items yet."
          showSoldBadge
        />
      </main>
      <Footer />
    </div>
  );
}
