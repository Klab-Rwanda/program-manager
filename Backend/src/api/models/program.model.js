import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // --- THE FIX IS HERE ---
    // Changed 'programManager' to 'programManagers' (plural) and made it an array.
    programManagers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // --- END OF FIX ---

    facilitators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    trainees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["Draft", "PendingApproval", "Active", "Completed", "Rejected"],
      default: "Draft",
    },
    rejectionReason: { type: String },
    departments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// This middleware is fine
programSchema.pre(/^find/, function (next) {
  if (this.op === "findOne" || this.op === "find") {
    this.where({ isActive: { $ne: false } });
  }
  next();
});

export const Program = mongoose.model("Program", programSchema);