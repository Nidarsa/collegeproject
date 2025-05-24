import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Upload } from "lucide-react";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  isGstApplicable: z.boolean().default(false),
  gstAmount: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExpenseModal({ isOpen, onClose }: ExpenseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const  categories  =[{
    name:"Grocery"
  }]

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date().toISOString().split('T')[0],
      isGstApplicable: false,
      gstAmount: "",
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const expenseData = {
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: new Date(data.date).toISOString(),
        isGstApplicable: data.isGstApplicable,
        gstAmount: data.isGstApplicable ? data.gstAmount || "0" : "0",
        receiptUrl: receiptFile ? `/uploads/${receiptFile.name}` : null,
      };

      const response = await apiRequest("POST", "/api/expenses", expenseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/charts/revenue-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/charts/expense-categories"] });
      toast({
        title: "Success",
        description: "Expense added successfully!",
      });
      onClose();
      form.reset();
      setReceiptFile(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const isGstApplicable = form.watch("isGstApplicable");
  const amount = parseFloat(form.watch("amount") || "0");
  const gstAmount = isGstApplicable ? (amount * 0.18).toFixed(2) : "0";

  if (isGstApplicable && form.getValues("gstAmount") !== gstAmount) {
    form.setValue("gstAmount", gstAmount);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Add New Expense
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...form.register("description")}
              placeholder="Enter expense description"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...form.register("amount")}
                placeholder="0.00"
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => form.setValue("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item : any) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date")}
            />
            {form.formState.errors.date && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="gst"
              checked={isGstApplicable}
              onCheckedChange={(checked) => form.setValue("isGstApplicable", checked)}
            />
            <Label htmlFor="gst">GST Applicable (18%)</Label>
          </div>

          {isGstApplicable && (
            <div>
              <Label htmlFor="gstAmount">GST Amount</Label>
              <Input
                id="gstAmount"
                type="number"
                step="0.01"
                value={gstAmount}
                readOnly
                className="bg-gray-50"
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="receipt">Receipt (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                {receiptFile ? receiptFile.name : "Drop file here or click to upload"}
              </p>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Choose File
              </Button>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={createExpenseMutation.isPending}
            >
              {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
