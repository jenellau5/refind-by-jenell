import { Link } from "wouter";
import logoImg from "@assets/refind-logo.jpg";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Brand */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="ReFind by Jenell" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <p className="font-bold text-foreground" style={{ fontFamily: "'Erode', serif" }}>ReFind by Jenell</p>
              <p className="text-xs text-muted-foreground">St. George, Utah</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Secondhand treasures, curated with care. Mom breaks & good finds.
          </p>
        </div>

        {/* Shop */}
        <div>
          <p className="font-semibold text-sm text-foreground mb-3 uppercase tracking-wider">Shop</p>
          <ul className="space-y-2">
            {[
              { href: "/refinds", label: "ReFinds" },
              { href: "/kids", label: "Kids' ReFinds" },
              { href: "/under10", label: "Under $10 Finds" },
              { href: "/styled", label: "Styled by Jenell" },
              { href: "/sold", label: "Sold Items" },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact / Info */}
        <div>
          <p className="font-semibold text-sm text-foreground mb-3 uppercase tracking-wider">Info</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Local pickup available</li>
            <li>Shipping available</li>
            <li>Shipping calculated after purchase</li>
            <li className="pt-1 flex items-center gap-3">
              <a
                href="https://instagram.com/refindbyjenell"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors font-medium"
                data-testid="footer-instagram"
              >
                Instagram
              </a>
              <span className="text-border">|</span>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors font-medium"
                data-testid="footer-facebook"
              >
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border text-center py-4 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} ReFind by Jenell. All rights reserved.
      </div>
    </footer>
  );
}
