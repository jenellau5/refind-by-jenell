import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Listing, TreasureRequest } from "@shared/schema";
import {
  Plus, Search, CheckSquare, Pencil, Trash2, GripVertical, X, Package, Inbox, LogOut, ChevronDown,
} from "lucide-react";
import logoImg from "@assets/refind-logo.jpg";

const ADMIN_PASS = "refind2024";

// ── Auth gate ────────────────────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-md p-8 space-y-5">
        <div className="flex justify-center">
          <img src={logoImg} alt="ReFind by Jenell" className="h-16 w-16 rounded-full" />
        </div>
        <h1 className="text-xl font-bold text-center text-foreground" style={{ fontFamily: "'Erode', serif" }}>
          Admin Access
        </h1>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (pw === ADMIN_PASS) onAuth();
                else setErr(true);
              }
            }}
            data-testid="admin-password"
          />
          {err && <p className="text-destructive text-xs">Incorrect password.</p>}
        </div>
        <Button
          className="w-full"
          onClick={() => { if (pw === ADMIN_PASS) onAuth(); else setErr(true); }}
          data-testid="admin-login"
        >
          Enter
        </Button>
      </div>
    </div>
  );
}

// ── Photo item (sortable) ─────────────────────────────────────────────────────
function SortablePhoto({ id, src, onRemove }: { id: string; src: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "__PORT_5000__";
  const imgSrc = src.startsWith("/uploads") ? `${API_BASE}${src}` : src;

  return (
    <div ref={setNodeRef} style={style} className="relative group w-20 h-20 rounded-md overflow-hidden border border-border bg-muted">
      <img src={imgSrc} alt="" className="w-full h-full object-cover" />
      <button
        {...listeners} {...attributes}
        className="absolute top-0.5 left-0.5 bg-background/80 rounded p-0.5 opacity-0 group-hover:opacity-100 cursor-grab"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3 h-3" />
      </button>
      <button
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 bg-background/80 rounded p-0.5 opacity-0 group-hover:opacity-100"
        aria-label="Remove photo"
        data-testid={`remove-photo-${id}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Listing form (used for both Add and Edit) ─────────────────────────────────
const listingFormSchema = z.object({
  title: z.string().min(1, "Required"),
  brand: z.string().min(1, "Required"),
  size: z.string().min(1, "Required"),
  price: z.string().min(1, "Required"),
  category: z.string().min(1, "Required"),
  condition: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  status: z.string().default("available"),
  isJenellsPick: z.boolean().default(false),
  newThisWeek: z.boolean().default(false),
  vintage: z.boolean().default(false),
});

type ListingFormData = z.infer<typeof listingFormSchema>;

function ListingForm({
  defaultValues,
  editId,
  onDone,
}: {
  defaultValues?: Partial<ListingFormData> & { existingPhotos?: string[] };
  editId?: number;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(defaultValues?.existingPhotos ?? []);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      title: "", brand: "", size: "", price: "", category: "reFinds",
      condition: "Good", description: "", status: "available",
      isJenellsPick: false, newThisWeek: false, vintage: false,
      ...defaultValues,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ListingFormData) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append("existingPhotos", JSON.stringify(existingPhotos));
      photoFiles.forEach((f) => fd.append("photos", f));

      const url = editId ? `/api/listings/${editId}` : "/api/listings";
      const method = editId ? "PATCH" : "POST";
      const res = await apiRequest(method, url, fd);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: editId ? "Listing updated!" : "Listing added!" });
      onDone();
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotoFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const allPhotos = [
      ...existingPhotos.map((p, i) => ({ id: `e-${i}`, src: p, type: "existing" as const, idx: i })),
      ...photoFiles.map((f, i) => ({ id: `n-${i}`, src: URL.createObjectURL(f), type: "new" as const, idx: i })),
    ];
    const oldIdx = allPhotos.findIndex((p) => p.id === String(active.id));
    const newIdx = allPhotos.findIndex((p) => p.id === String(over.id));
    const reordered = arrayMove(allPhotos, oldIdx, newIdx);
    setExistingPhotos(reordered.filter((p) => p.type === "existing").map((p) => existingPhotos[p.idx]));
    setPhotoFiles(reordered.filter((p) => p.type === "new").map((p) => photoFiles[p.idx]));
  };

  const allPhotoItems = [
    ...existingPhotos.map((p, i) => ({ id: `e-${i}`, src: p })),
    ...photoFiles.map((f, i) => ({ id: `n-${i}`, src: URL.createObjectURL(f) })),
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {/* Photos */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Photos</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={allPhotoItems.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-wrap gap-2 mb-2">
                {allPhotoItems.map((item, i) => (
                  <SortablePhoto
                    key={item.id}
                    id={item.id}
                    src={item.src}
                    onRemove={() => {
                      if (item.id.startsWith("e-")) {
                        setExistingPhotos((prev) => prev.filter((_, j) => j !== parseInt(item.id.slice(2))));
                      } else {
                        setPhotoFiles((prev) => prev.filter((_, j) => j !== i - existingPhotos.length));
                      }
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <label className="cursor-pointer">
            <div className="inline-flex items-center gap-1.5 text-sm text-primary border border-primary/30 rounded-md px-3 py-1.5 hover:bg-primary/5 transition-colors">
              <Plus className="w-4 h-4" /> Add Photos
            </div>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="sr-only" data-testid="photo-upload" />
          </label>
        </div>

        {/* Title + Brand */}
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl><Input placeholder="Calvin Klein Maxi Dress" data-testid="listing-title" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="brand" render={({ field }) => (
            <FormItem>
              <FormLabel>Brand</FormLabel>
              <FormControl><Input placeholder="Calvin Klein" data-testid="listing-brand" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Size + Price */}
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="size" render={({ field }) => (
            <FormItem>
              <FormLabel>Size</FormLabel>
              <FormControl><Input placeholder="M, 8, XL…" data-testid="listing-size" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem>
              <FormLabel>Price ($)</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="12.00" data-testid="listing-price" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Category + Condition + Status */}
        <div className="grid grid-cols-3 gap-3">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger data-testid="listing-category"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="reFinds">ReFinds</SelectItem>
                  <SelectItem value="kids">Kids' ReFinds</SelectItem>
                  <SelectItem value="under10">Under $10</SelectItem>
                  <SelectItem value="styled">Styled by Jenell</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="condition" render={({ field }) => (
            <FormItem>
              <FormLabel>Condition</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger data-testid="listing-condition"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Like New">Like New</SelectItem>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger data-testid="listing-status"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Description */}
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe the item — condition details, measurements, style notes…" rows={3} data-testid="listing-description" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Toggles */}
        <div className="flex flex-wrap gap-6">
          {[
            { name: "isJenellsPick" as const, label: "Jenell's Pick" },
            { name: "newThisWeek" as const, label: "New This Week" },
            { name: "vintage" as const, label: "Vintage" },
          ].map(({ name, label }) => (
            <FormField key={name} control={form.control} name={name} render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} data-testid={`toggle-${name}`} />
                </FormControl>
                <FormLabel className="font-normal">{label}</FormLabel>
              </FormItem>
            )} />
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={mutation.isPending} data-testid="listing-submit">
            {mutation.isPending ? "Saving…" : editId ? "Save Changes" : "Publish Listing"}
          </Button>
          <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    </Form>
  );
}

// ── Main Admin page ───────────────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"listings" | "requests">("listings");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const { toast } = useToast();

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
    enabled: authed,
  });

  const { data: requests } = useQuery<TreasureRequest[]>({
    queryKey: ["/api/requests"],
    enabled: authed && tab === "requests",
  });

  const markSold = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/listings/${id}/sold`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "Marked as sold." });
    },
  });

  const deleteListing = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/listings/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "Listing deleted." });
    },
  });

  const updateRequestStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/requests/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/requests"] }),
  });

  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />;

  const filtered = (listings ?? []).filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      l.brand.toLowerCase().includes(q) ||
      l.itemNumber.toLowerCase().includes(q)
    );
  });

  if (view === "add" || view === "edit") {
    const ep = editListing?.photos ? (() => { try { return JSON.parse(editListing.photos); } catch { return []; } })() : [];
    const defVals = editListing ? {
      title: editListing.title,
      brand: editListing.brand,
      size: editListing.size,
      price: String(editListing.price),
      category: editListing.category,
      condition: editListing.condition,
      description: editListing.description,
      status: editListing.status,
      isJenellsPick: editListing.isJenellsPick,
      newThisWeek: false,
      vintage: false,
      existingPhotos: ep,
    } : undefined;

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <img src={logoImg} alt="" className="h-8 w-8 rounded-full" />
            <h1 className="font-bold text-lg text-foreground" style={{ fontFamily: "'Erode', serif" }}>
              {view === "add" ? "Add Listing" : "Edit Listing"}
            </h1>
          </div>
          <div className="bg-card border border-border rounded-md p-6">
            <ListingForm
              defaultValues={defVals}
              editId={editListing?.id}
              onDone={() => { setView("list"); setEditListing(null); }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="ReFind by Jenell" className="h-8 w-8 rounded-full" />
          <span className="font-bold text-foreground" style={{ fontFamily: "'Erode', serif" }}>Admin</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <button
            onClick={() => setTab("listings")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "listings" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-listings"
          >
            <Package className="w-4 h-4" /> Listings
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "requests" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-requests"
          >
            <Inbox className="w-4 h-4" /> Requests
            {(requests ?? []).filter(r => r.status === "new").length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5">
                {(requests ?? []).filter(r => r.status === "new").length}
              </span>
            )}
          </button>
          <Button size="icon" variant="ghost" onClick={() => setAuthed(false)} aria-label="Log out" data-testid="admin-logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {tab === "listings" ? (
          <>
            {/* Actions bar */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search by title, brand, or RF number…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="admin-search"
                />
              </div>
              <Button onClick={() => { setView("add"); setEditListing(null); }} data-testid="add-listing">
                <Plus className="w-4 h-4 mr-1.5" /> Add
              </Button>
            </div>

            {/* Listing rows */}
            {isLoading ? (
              <div className="text-center py-16 text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>{search ? "No matching listings." : "No listings yet — add your first one!"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((listing) => {
                  const photos: string[] = (() => { try { return JSON.parse(listing.photos); } catch { return []; } })();
                  const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "__PORT_5000__";
                  const thumb = photos[0] ? (photos[0].startsWith("/uploads") ? `${API_BASE}${photos[0]}` : photos[0]) : null;

                  return (
                    <div
                      key={listing.id}
                      className="flex items-center gap-3 bg-card border border-border rounded-md p-3"
                      data-testid={`admin-listing-${listing.id}`}
                    >
                      {/* Thumb */}
                      <div className="w-12 h-12 rounded-md bg-muted overflow-hidden shrink-0">
                        {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : null}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{listing.itemNumber}</span>
                          {listing.status === "sold" && (
                            <Badge variant="secondary" className="text-xs">Sold</Badge>
                          )}
                          {listing.isJenellsPick && (
                            <Badge className="text-xs bg-secondary/10 text-secondary border-0">Pick</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">{listing.brand} · {listing.size} · ${listing.price.toFixed(2)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {listing.status !== "sold" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => markSold.mutate(listing.id)}
                            title="Mark Sold"
                            data-testid={`sold-${listing.id}`}
                          >
                            <CheckSquare className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setEditListing(listing); setView("edit"); }}
                          title="Edit"
                          data-testid={`edit-${listing.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Delete ${listing.itemNumber}?`)) deleteListing.mutate(listing.id);
                          }}
                          title="Delete"
                          data-testid={`delete-${listing.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Requests tab */
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground">Treasure Hunt Requests</h2>
            {(requests ?? []).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No requests yet.</p>
              </div>
            ) : (
              (requests ?? []).map((req) => (
                <div key={req.id} className="bg-card border border-border rounded-md p-4 space-y-2" data-testid={`request-${req.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">{req.name}</p>
                      <p className="text-xs text-muted-foreground">{req.contact}</p>
                    </div>
                    <Badge
                      className={`text-xs shrink-0 ${
                        req.status === "new" ? "bg-primary/10 text-primary border-0" :
                        req.status === "seen" ? "bg-muted text-muted-foreground border-0" :
                        "bg-emerald-100 text-emerald-800 border-0"
                      }`}
                    >
                      {req.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-foreground">
                    <span className="font-medium">{req.itemType}</span>
                    {req.brand && <span className="text-muted-foreground"> · {req.brand}</span>}
                    <span className="text-muted-foreground"> · Size: {req.size}</span>
                  </div>
                  {req.notes && <p className="text-xs text-muted-foreground">{req.notes}</p>}
                  <div className="flex gap-2 pt-1">
                    {req.status === "new" && (
                      <Button size="sm" variant="outline" onClick={() => updateRequestStatus.mutate({ id: req.id, status: "seen" })}>
                        Mark Seen
                      </Button>
                    )}
                    {req.status !== "fulfilled" && (
                      <Button size="sm" variant="outline" onClick={() => updateRequestStatus.mutate({ id: req.id, status: "fulfilled" })}>
                        Mark Fulfilled
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
