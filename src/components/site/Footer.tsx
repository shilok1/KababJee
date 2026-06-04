import { Flame, MapPin, Phone, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <span className="font-bold">Kabab Jee</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Authentic Pakistani BBQ, karahi and biryani — slow-cooked, char-grilled, and served with heart.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Visit Us</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> KababJee, Hyderabad</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +92 300 1234567</li>
            <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 12:00 PM – 1:00 AM</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="/menu" className="hover:text-primary">Menu</a></li>
            <li><a href="/reservations" className="hover:text-primary">Reservations</a></li>
            <li><a href="/account" className="hover:text-primary">My Orders</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Kabab Jee. All rights reserved.
      </div>
    </footer>
  );
}