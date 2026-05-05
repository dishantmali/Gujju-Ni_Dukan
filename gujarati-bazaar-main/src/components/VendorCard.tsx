import { Link } from "react-router-dom";
import { Vendor } from "@/data/types";
import { StarRating } from "./StarRating";

export const VendorCard = ({ vendor }: { vendor: Vendor }) => (
  <Link
    to={`/vendor/${vendor.id}`}
    className="group flex flex-col items-center text-center p-4 rounded-2xl hover:bg-card hover:shadow-card transition-all"
  >
    <div className="h-16 w-16 rounded-full bg-gradient-vendor grid place-items-center text-primary-foreground font-display font-bold text-lg shadow-card group-hover:scale-105 transition-transform">
      {vendor.initials}
    </div>
    <h4 className="mt-3 font-semibold text-sm text-foreground line-clamp-1">{vendor.name}</h4>
    <p className="text-xs text-muted-foreground line-clamp-1">{vendor.tagline}</p>
    <div className="mt-1.5"><StarRating value={vendor.rating} size={11} /></div>
  </Link>
);
