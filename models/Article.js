const mongoose = require("mongoose");

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    author: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    date: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
    url: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

articleSchema.pre("validate", async function (next) {
  try {
    if (!this.isNew && !this.isModified("title") && this.slug) return next();

    const base = slugify(this.title);
    if (!base) return next();

    const Article = this.constructor;

    let candidate = base;
    let i = 1;
    while (await Article.exists({ slug: candidate, _id: { $ne: this._id } })) {
      candidate = `${base}-${i}`;
      i += 1;
    }

    this.slug = candidate;
    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.model("Article", articleSchema);
