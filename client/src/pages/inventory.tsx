import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Filter, AlertTriangle, Package, Edit, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const inventorySchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be positive"),
  minStockLevel: z.number().min(0, "Min stock level must be positive"),
  unitPrice: z.string().min(1, "Unit price is required"),
  category: z.string().min(1, "Category is required"),
  supplier: z.string().optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

export default function Inventory() {
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
  });

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      itemName: "",
      description: "",
      quantity: 0,
      minStockLevel: 5,
      unitPrice: "",
      category: "",
      supplier: "",
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      const response = await apiRequest("POST", "/api/inventory", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Success",
        description: "Inventory item added successfully!",
      });
      setItemModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Success",
        description: "Inventory item deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredInventory = inventory?.filter((item: any) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalValue = inventory?.reduce((sum: number, item: any) => 
    sum + (item.quantity * parseFloat(item.unitPrice)), 0
  ) || 0;

  const handleSubmit = (data: InventoryFormData) => {
    createItemMutation.mutate(data);
  };

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity === 0) return { status: "Out of Stock", color: "destructive" };
    if (quantity <= minLevel) return { status: "Low Stock", color: "warning" };
    return { status: "In Stock", color: "success" };
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track your stock levels and manage inventory</p>
        </div>
        <Button onClick={() => setItemModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {inventory?.length || 0}
            </div>
            <p className="text-sm text-gray-500">Unique products</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${totalValue.toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">Current inventory value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lowStockItems?.length || 0}
            </div>
            <p className="text-sm text-gray-500">Need attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inventory?.filter((item: any) => item.quantity === 0).length || 0}
            </div>
            <p className="text-sm text-gray-500">Zero quantity</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems && lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map((item: any) => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-orange-200">
                  <p className="font-medium text-gray-900">{item.itemName}</p>
                  <p className="text-sm text-gray-600">
                    Current: {item.quantity} | Min: {item.minStockLevel}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? "No items match your search criteria." : "Start by adding your first inventory item."}
              </p>
              <Button onClick={() => setItemModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item: any) => {
                    const stockStatus = getStockStatus(item.quantity, item.minStockLevel);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{item.itemName}</p>
                            {item.description && (
                              <p className="text-sm text-gray-500">{item.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={item.quantity <= item.minStockLevel ? "text-red-600 font-semibold" : ""}>
                            {item.quantity}
                          </span>
                          <span className="text-gray-400 text-sm"> units</span>
                        </TableCell>
                        <TableCell>${parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">
                          ${(item.quantity * parseFloat(item.unitPrice)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              stockStatus.color === "destructive" ? "destructive" :
                              stockStatus.color === "warning" ? "default" : "secondary"
                            }
                            className={
                              stockStatus.color === "warning" ? "bg-yellow-100 text-yellow-800" :
                              stockStatus.color === "success" ? "bg-green-100 text-green-800" : ""
                            }
                          >
                            {stockStatus.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.supplier || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteItemMutation.mutate(item.id)}
                              disabled={deleteItemMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Modal */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Add New Inventory Item
              <Button variant="ghost" size="icon" onClick={() => setItemModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="itemName">Item Name *</Label>
              <Input
                id="itemName"
                {...form.register("itemName")}
                placeholder="Enter item name"
              />
              {form.formState.errors.itemName && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.itemName.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...form.register("description")}
                placeholder="Enter description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  {...form.register("quantity", { valueAsNumber: true })}
                  placeholder="0"
                />
                {form.formState.errors.quantity && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.quantity.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="minStockLevel">Min Stock Level *</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  {...form.register("minStockLevel", { valueAsNumber: true })}
                  placeholder="5"
                />
                {form.formState.errors.minStockLevel && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.minStockLevel.message}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unitPrice">Unit Price *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  {...form.register("unitPrice")}
                  placeholder="0.00"
                />
                {form.formState.errors.unitPrice && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.unitPrice.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  {...form.register("category")}
                  placeholder="e.g., Office Supplies"
                />
                {form.formState.errors.category && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.category.message}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                {...form.register("supplier")}
                placeholder="Enter supplier name"
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setItemModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={createItemMutation.isPending}
              >
                {createItemMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
