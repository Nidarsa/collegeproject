import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Image } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an image (JPEG, PNG, GIF) or PDF file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      // Mock upload - in a real app, you'd use FormData and send to your upload endpoint
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload delay
      
      toast({
        title: "Success",
        description: "Receipt uploaded successfully! AI processing will extract expense details.",
      });
      
      onClose();
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-red-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Upload Receipt
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Upload a receipt image or PDF and our AI will automatically extract expense details.
          </div>

          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your receipt here
              </p>
              <p className="text-sm text-gray-600 mb-4">
                or click to browse files
              </p>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileInputChange}
                className="hidden"
                id="receipt-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("receipt-upload")?.click()}
              >
                Choose File
              </Button>
              <p className="text-xs text-gray-500 mt-3">
                Supports: JPEG, PNG, GIF, PDF (max 10MB)
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                {getFileIcon(selectedFile)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {selectedFile.type.startsWith("image/") && (
                <div className="mt-3">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Receipt preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium">AI Processing</p>
                <p>Once uploaded, our AI will extract details like amount, date, merchant, and category to auto-fill your expense form.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Processing..." : "Upload & Process"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
