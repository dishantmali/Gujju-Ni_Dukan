import { Link } from "react-router-dom";
import { Heart, Instagram, Facebook, Twitter } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export const Footer = () => (
  <footer className="mt-24 border-t border-border bg-gradient-warm">
    <div className="container py-12 grid gap-10 md:grid-cols-4">
      <div className="md:col-span-1">
        <img src={logo} alt="Gujju ni Dukan" className="h-16 w-auto mb-3 object-contain logo-transparent bg-background" />
        <p className="text-sm text-muted-foreground max-w-xs">
          A modern bazaar for authentic Gujarati products — from family vendors to your doorstep.
        </p>
      </div>
      <div>
        <h4 className="font-display font-semibold mb-3">Shop</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/category/snacks" className="underline-grow">Snacks</Link></li>
          <li><Link to="/category/pickles" className="underline-grow">Pickles</Link></li>
          <li><Link to="/category/sweets" className="underline-grow">Sweets</Link></li>
          <li><Link to="/category/handicrafts" className="underline-grow">Handicrafts</Link></li>
          <li><Link to="/category/clothing" className="underline-grow">Clothing</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-display font-semibold mb-3">Help</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><a href="#" className="underline-grow">Track Order</a></li>
          <li><a href="#" className="underline-grow">Returns</a></li>
          <li><a href="#" className="underline-grow">Shipping</a></li>
          <li><a href="#" className="underline-grow">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-display font-semibold mb-3">Stay in touch</h4>
        <p className="text-sm text-muted-foreground mb-3">Get recipes & festival drops in your inbox.</p>
        <form className="flex gap-2">
          <input type="email" placeholder="you@email.com" className="flex-1 h-10 px-3 rounded-full bg-card border border-border text-sm outline-none focus:border-brown-light" />
          <button type="submit" className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-brown-mid transition-colors">Subscribe</button>
        </form>
        <div className="mt-4 flex gap-3 text-brown-mid">
          <a href="#" aria-label="Instagram" className="hover:text-primary transition-colors"><Instagram size={18} /></a>
          <a href="#" aria-label="Facebook" className="hover:text-primary transition-colors"><Facebook size={18} /></a>
          <a href="#" aria-label="Twitter" className="hover:text-primary transition-colors"><Twitter size={18} /></a>
        </div>
      </div>
    </div>
    <div className="border-t border-border/60">
      <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Gujju ni Dukan. All rights reserved.</p>
        <p className="inline-flex items-center gap-1">
          Made with <Heart size={12} className="fill-destructive text-destructive" /> in Gujarat
        </p>
      </div>
    </div>
  </footer>
);
