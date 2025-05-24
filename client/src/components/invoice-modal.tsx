import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Plus, Trash2 } from "lucide-react";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be positive"),
});

const invoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  clientAddress: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceModal({ isOpen, onClose }: InvoiceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientAddress: "",
      items: [{ description: "", quantity: 1, rate: 0 }],
      notes: "",
      dueDate: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      const gstAmount = subtotal * 0.18; // 18% GST
      const totalAmount = subtotal + gstAmount;

      const invoiceData = {
        invoiceNumber: `INV-${Date.now()}`,
        clientName: data.clientName,
        clientEmail: data.clientEmail || null,
        clientAddress: data.clientAddress || null,
        items: JSON.stringify(data.items),
        subtotal: subtotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        status: "draft",
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        notes: data.notes || null,
      };

      const response = await apiRequest("POST", "/api/invoices", invoiceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Invoice created successfully!",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  const watchedItems = form.watch("items");
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const gstAmount = subtotal * 0.18;
  const total = subtotal + gstAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Create New Invoice
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Client Information</h3>
            
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                {...form.register("clientName")}
                placeholder="Enter client name"
              />
              {form.formState.errors.clientName && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.clientName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  {...form.register("clientEmail")}
                  placeholder="client@example.com"
                />
                {form.formState.errors.clientEmail && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.clientEmail.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...form.register("dueDate")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clientAddress">Address</Label>
              <Textarea
                id="clientAddress"
                {...form.register("clientAddress")}
                placeholder="Enter client address"
                rows={2}
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Invoice Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: 1, rate: 0 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Item {index + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div>
                  <Label htmlFor={`items.${index}.description`}>Description</Label>
                  <Input
                    {...form.register(`items.${index}.description`)}
                    placeholder="Item description"
                  />
                  {form.formState.errors.items?.[index]?.description && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.items[index]?.description?.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`items.${index}.quantity`}>Quantity</Label>
                    <Input
                      type="number"
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                      placeholder="1"
                    />
                    {form.formState.errors.items?.[index]?.quantity && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor={`items.${index}.rate`}>Rate</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register(`items.${index}.rate`, { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                    {form.formState.errors.items?.[index]?.rate && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.items[index]?.rate?.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Amount</Label>
                    <Input
                      value={(watchedItems[index]?.quantity * watchedItems[index]?.rate || 0).toFixed(2)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            ))}

            {form.formState.errors.items && (
              <p className="text-sm text-red-500">
                {form.formState.errors.items.message}
              </p>
            )}
          </div>

          {/* Invoice Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST (18%):</span>
              <span>${gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
