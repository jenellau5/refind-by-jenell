import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/refind-logo.jpg";

const links = [
  { href: "/refinds", label: "ReFinds" },
  { href: "/kids", label: "Kids' ReFinds" },
  { href: "/under10", label: "Under $10" },
  { href: "/styled", label: "Styled by Jenell" },
  { href: "/sold", label: "Sold" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0" data-testid="nav-logo">
          <img
            src={logoImg}
            alt="ReFind by Jenell"
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="font-bold text-foreground text-lg leading-tight hidden sm:block"
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
            ReFind<br />
            <span className="text-xs font-medium text-muted-foreground tracking-wide">by Jenell</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location === href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-testid={`nav-link-${label.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu toggle */}
        <Button
          size="icon"
          variant="ghost"
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          data-testid="nav-mobile-toggle"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="md:hidden border-t border-border bg-background" aria-label="Mobile navigation">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-6 py-3 text-sm font-medium border-b border-border last:border-0 ${
                location === href ? "text-primary bg-primary/5" : "text-foreground"
              }`}
              onClick={() => setOpen(false)}
              data-testid={`mobile-nav-${label.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
