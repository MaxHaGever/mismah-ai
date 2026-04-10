import mongoose from "mongoose";

const reportLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["leak-detection", "invoice-demand", "price-quote", "service-visit"],
      required: true,
    },
    prompt: { type: String, required: true },
    images: [{ url: String, description: String }],
    pdfUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export const ReportLog = mongoose.model("ReportLog", reportLogSchema);
