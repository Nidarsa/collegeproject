import jsPDF from 'jspdf';

export interface InvoiceData {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  items: string; // JSON string
  subtotal: string;
  gstAmount: string;
  totalAmount: string;
  status: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

export const generateInvoicePDF = async (invoice: InvoiceData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Colors
  const primaryColor = [37, 99, 235]; // #2563EB
  const grayColor = [107, 114, 128]; // #6B7280
  const blackColor = [0, 0, 0];
  
  // Parse items
  let parsedItems = [];
  try {
    parsedItems = JSON.parse(invoice.items);
  } catch (error) {
    console.error('Error parsing invoice items:', error);
  }

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, 20);
  
  // Company Info (right side of header)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('BizTracker Pro', pageWidth - 20, 12, { align: 'right' });
  doc.text('123 Business Street', pageWidth - 20, 17, { align: 'right' });
  doc.text('City, State 12345', pageWidth - 20, 22, { align: 'right' });

  // Invoice details
  doc.setTextColor(...blackColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details', 20, 45);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, 55);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 62);
  if (invoice.dueDate) {
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, 69);
  }
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 76);

  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Bill To:', 20, 95);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let billToY = 105;
  doc.text(invoice.clientName, 20, billToY);
  billToY += 7;
  
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, 20, billToY);
    billToY += 7;
  }
  
  if (invoice.clientAddress) {
    const addressLines = invoice.clientAddress.split('\n');
    addressLines.forEach(line => {
      doc.text(line, 20, billToY);
      billToY += 7;
    });
  }

  // Items table
  const tableStartY = Math.max(billToY + 10, 130);
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, tableStartY, pageWidth - 40, 10, 'F');
  
  doc.setTextColor(...blackColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Description', 25, tableStartY + 7);
  doc.text('Qty', pageWidth - 80, tableStartY + 7, { align: 'center' });
  doc.text('Rate', pageWidth - 55, tableStartY + 7, { align: 'center' });
  doc.text('Amount', pageWidth - 25, tableStartY + 7, { align: 'right' });

  // Table rows
  doc.setFont('helvetica', 'normal');
  let currentY = tableStartY + 15;
  
  parsedItems.forEach((item: any, index: number) => {
    const amount = item.quantity * item.rate;
    
    doc.text(item.description, 25, currentY);
    doc.text(item.quantity.toString(), pageWidth - 80, currentY, { align: 'center' });
    doc.text(`$${item.rate.toFixed(2)}`, pageWidth - 55, currentY, { align: 'center' });
    doc.text(`$${amount.toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });
    
    currentY += 10;
    
    // Add a line between items
    if (index < parsedItems.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.line(20, currentY - 5, pageWidth - 20, currentY - 5);
    }
  });

  // Totals section
  const totalsStartY = currentY + 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - 60, totalsStartY, { align: 'right' });
  doc.text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, pageWidth - 25, totalsStartY, { align: 'right' });
  
  doc.text('GST (18%):', pageWidth - 60, totalsStartY + 8, { align: 'right' });
  doc.text(`$${parseFloat(invoice.gstAmount).toFixed(2)}`, pageWidth - 25, totalsStartY + 8, { align: 'right' });
  
  // Total line
  doc.setDrawColor(...blackColor);
  doc.line(pageWidth - 80, totalsStartY + 12, pageWidth - 20, totalsStartY + 12);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', pageWidth - 60, totalsStartY + 20, { align: 'right' });
  doc.text(`$${parseFloat(invoice.totalAmount).toFixed(2)}`, pageWidth - 25, totalsStartY + 20, { align: 'right' });

  // Notes section
  if (invoice.notes) {
    const notesStartY = totalsStartY + 35;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes:', 20, notesStartY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    doc.text(noteLines, 20, notesStartY + 8);
  }

  // Footer
  const footerY = pageHeight - 30;
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Generated by BizTracker Pro', pageWidth / 2, footerY + 5, { align: 'center' });

  // Save the PDF
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
};

export const generateExpenseReport = async (expenses: any[], dateRange: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Expense Report', 20, 17);
  
  // Date range
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Period: ${dateRange}`, 20, 40);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50);

  // Summary
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const totalGst = expenses.reduce((sum, expense) => sum + parseFloat(expense.gstAmount || '0'), 0);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 20, 80);
  doc.text(`Total GST Paid: $${totalGst.toFixed(2)}`, 20, 90);
  doc.text(`Number of Transactions: ${expenses.length}`, 20, 100);

  // Table header
  const tableStartY = 120;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, tableStartY, pageWidth - 40, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Date', 25, tableStartY + 7);
  doc.text('Description', 55, tableStartY + 7);
  doc.text('Category', 120, tableStartY + 7);
  doc.text('Amount', pageWidth - 25, tableStartY + 7, { align: 'right' });

  // Table rows
  doc.setFont('helvetica', 'normal');
  let currentY = tableStartY + 15;
  
  expenses.slice(0, 30).forEach((expense) => { // Limit to first 30 items
    if (currentY > 260) { // Start new page if needed
      doc.addPage();
      currentY = 30;
    }
    
    doc.text(new Date(expense.date).toLocaleDateString(), 25, currentY);
    doc.text(expense.description.substring(0, 25), 55, currentY);
    doc.text(expense.category, 120, currentY);
    doc.text(`$${parseFloat(expense.amount).toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });
    
    currentY += 8;
  });

  // Save the PDF
  doc.save(`expense-report-${new Date().getTime()}.pdf`);
};
