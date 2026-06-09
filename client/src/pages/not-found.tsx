import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <p className="text-6xl font-bold text-primary/20 mb-4" style={{ fontFamily: "'Erode', serif" }}>404</p>
          <h1 className="text-xl font-bold text-foreground mb-2">Page not found</h1>
          <p className="text-muted-foreground mb-6">This page doesn't exist — but the good finds do.</p>
          <Button asChild><Link href="/">Back to Home</Link></Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
