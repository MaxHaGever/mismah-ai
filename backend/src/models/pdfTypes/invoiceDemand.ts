interface InvoiceDemand {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  total: number;
  vat: number;
  paymentDetails: {
    bankName: string;
    accountOwner: string;
    branchNumber: string;
    accountNumber: string;
  };
}