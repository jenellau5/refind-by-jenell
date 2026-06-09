import { useQuery } from "@tanstack/react-query";
import ListingCard from "./ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Listing } from "@shared/schema";

interface Props {
  category?: string;
  status?: string;
  search?: string;
  emptyMessage?: string;
  showSoldBadge?: boolean;
}

export default function ListingGrid({ category, status, search, emptyMessage, showSoldBadge }: Props) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const url = `/api/listings?${params.toString()}`;

  const { data: listings, isLoading } = useQuery<Listing[]>({ queryKey: [url] });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-md overflow-hidden">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p className="text-lg font-medium">{emptyMessage ?? "No items found."}</p>
        <p className="text-sm mt-1">Check back soon — new finds drop regularly.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} showSoldBadge={showSoldBadge} />
      ))}
    </div>
  );
}
