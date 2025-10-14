import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true }, // optional URL-friendly field
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

// Pre-save hook to generate slug
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-");
  }
  next();
});

export const Category = mongoose.model("Category", categorySchema);
