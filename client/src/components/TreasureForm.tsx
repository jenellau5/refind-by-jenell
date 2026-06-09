import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTreasureRequestSchema } from "@shared/schema";

const formSchema = insertTreasureRequestSchema.extend({
  name: z.string().min(1, "Name required"),
  contact: z.string().min(1, "Email or phone required"),
  size: z.string().min(1, "Size required"),
  itemType: z.string().min(1, "Item type required"),
});

type FormData = z.infer<typeof formSchema>;

export default function TreasureForm() {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", contact: "", size: "", brand: "", itemType: "", notes: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/requests", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request sent!", description: "Jenell will keep an eye out for your item." });
      form.reset();
    },
    onError: () => {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>
              <FormControl>
                <Input placeholder="Olivia" data-testid="request-name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="contact" render={({ field }) => (
            <FormItem>
              <FormLabel>Email or Phone</FormLabel>
              <FormControl>
                <Input placeholder="you@email.com or 435-555-0000" data-testid="request-contact" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="size" render={({ field }) => (
            <FormItem>
              <FormLabel>Size</FormLabel>
              <FormControl>
                <Input placeholder="Women's Medium, Boys 8, etc." data-testid="request-size" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="brand" render={({ field }) => (
            <FormItem>
              <FormLabel>Brand (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Levi's, Pendleton, Nike…" data-testid="request-brand" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="itemType" render={({ field }) => (
          <FormItem>
            <FormLabel>Item Type</FormLabel>
            <FormControl>
              <Input placeholder="Vintage denim jacket, floral dress, kids' tops…" data-testid="request-itemtype" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes (optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any extra details — color, style, condition preference…"
                rows={3}
                data-testid="request-notes"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="request-submit">
          {mutation.isPending ? "Sending…" : "Send My Request"}
        </Button>
      </form>
    </Form>
  );
}
