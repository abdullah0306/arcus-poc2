"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import * as Label from "@radix-ui/react-label";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  quoteNumber: z.string().min(1, "Quote number is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email address"),
  status: z.enum(["Pending", "Approved", "Rejected"]),
});

type FormData = z.infer<typeof formSchema>;

interface EditQuoteProps {
  takeoff: {
    id: string;
    quoteNumber: string;
    clientName: string;
    clientEmail: string;
    status: "Pending" | "Approved" | "Rejected";
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditQuote({
  takeoff,
  open,
  onOpenChange,
  onSuccess,
}: EditQuoteProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Update form values when takeoff changes
  useEffect(() => {
    if (takeoff) {
      form.reset({
        quoteNumber: takeoff.quoteNumber,
        clientName: takeoff.clientName,
        clientEmail: takeoff.clientEmail,
        status: takeoff.status,
      });
    }
  }, [takeoff, form]);

  const onSubmit = async (values: FormData) => {
    if (!takeoff?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/takeoffs/${takeoff.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update takeoff");
      }

      toast.success("Takeoff updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating takeoff:", error);
      toast.error("Failed to update takeoff");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold">
                Edit quote
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="text-sm text-gray-500">
              Make changes to your quote here. Click save when you&apos;re done.
            </Dialog.Description>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label.Root htmlFor="quoteNumber" className="text-sm font-medium">
                Quote Number*
              </Label.Root>
              <Input
                id="quoteNumber"
                {...form.register("quoteNumber")}
                disabled={isLoading}
              />
              {form.formState.errors.quoteNumber && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.quoteNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label.Root htmlFor="clientName" className="text-sm font-medium">
                Client Name*
              </Label.Root>
              <Input
                id="clientName"
                {...form.register("clientName")}
                disabled={isLoading}
              />
              {form.formState.errors.clientName && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.clientName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label.Root htmlFor="clientEmail" className="text-sm font-medium">
                Client Email*
              </Label.Root>
              <Input
                id="clientEmail"
                type="email"
                {...form.register("clientEmail")}
                disabled={isLoading}
              />
              {form.formState.errors.clientEmail && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.clientEmail.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label.Root htmlFor="status" className="text-sm font-medium">
                Status*
              </Label.Root>
              <select
                id="status"
                {...form.register("status")}
                disabled={isLoading}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              {form.formState.errors.status && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.status.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isLoading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
