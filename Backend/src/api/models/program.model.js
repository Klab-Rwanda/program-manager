import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    programManager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    facilitators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    trainees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["Draft", "PendingApproval", "Active", "Completed", "Rejected"],
      default: "Draft",
    },
    rejectionReason: { type: String },
    departments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
    isActive: { type: Boolean, default: true }, // For active/inactive programs
    isDeleted: { type: Boolean, default: false }, // For permanent deletion
    isArchived: { type: Boolean, default: false }, // For archiving
  },
  { timestamps: true }
);

// This middleware automatically filters out deleted and archived programs
// for all `find` and `findOne` queries, except when explicitly querying for them.
programSchema.pre(/^find/, function (next) {
  if (this.op === "findOne" || this.op === "find") {
    const query = this.getQuery();
    
    // If explicitly querying for archived programs, don't filter
    if (query.isArchived === true) {
      return next();
    }
    
    // If explicitly querying for deleted programs, don't filter
    if (query.isDeleted === true) {
      return next();
    }
    
    // For all other queries, filter out deleted and archived programs
    this.where({ 
      isDeleted: { $ne: true },
      isArchived: { $ne: true }
    });
  }
  next();
});

export const Program = mongoose.model("Program", programSchema);

