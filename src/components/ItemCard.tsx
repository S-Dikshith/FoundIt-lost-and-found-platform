import { Link } from "@tanstack/react-router";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSignedImage } from "@/hooks/useSignedImage";

export type ItemRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "lost" | "found" | "returned";
  location: string;
  item_date: string;
  image_url: string | null;
  created_at: string;
};

const statusStyles: Record<ItemRow["status"], string> = {
  lost: "bg-lost text-lost-foreground",
  found: "bg-found text-found-foreground",
  returned: "bg-returned text-returned-foreground",
};

export function ItemCard({ item }: { item: ItemRow }) {
  const imgUrl = useSignedImage(item.image_url);
  return (
    <Link
      to="/items/$id"
      params={{ id: item.id }}
      className="paper-card group block overflow-hidden rounded-xl transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center font-display text-3xl text-muted-foreground">
            {item.title.charAt(0).toUpperCase()}
          </div>
        )}
        <Badge className={`absolute left-3 top-3 uppercase tracking-wide ${statusStyles[item.status]}`}>
          {item.status}
        </Badge>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-tight text-foreground line-clamp-1">
            {item.title}
          </h3>
          <Badge variant="outline" className="shrink-0 text-xs">{item.category}</Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(item.item_date).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}

export const CATEGORIES = [
  "Electronics", "Bags", "Wallets & Cards", "Keys", "Documents",
  "Clothing", "Jewelry", "Books", "Pets", "Other",
];
