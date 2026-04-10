import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid ISO date');

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  total: z.number(),
});

// Invoice Demand schema
export const invoiceDemandSchema = z.object({
  docType: z.literal('invoiceDemand'),
  data: z.object({
    invoiceNumber: z.string(),
    issueDate: isoDate,
    dueDate: isoDate,
    clientName: z.string(),
    items: z.array(lineItemSchema),
    total: z.number(),
    vat: z.number(),
    paymentDetails: z.object({
      bankName: z.string(),
      accountOwner: z.string(),
      branchNumber: z.string(),
      accountNumber: z.string(),
    }),
  }),
}).strict();

export const pdfSchema = invoiceDemandSchema;
