const mongoose = require("mongoose");
const Article = require("../models/Article");

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clampPositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

exports.createArticle = async (req, res) => {
  try {
    const { title, author, date, content, url } = req.body;

    if (!title || !url) {
      return res.status(400).json({ message: "title and url are required" });
    }

    const existing = await Article.findOne({ url });
    if (existing) {
      return res.status(200).json({ duplicate: true, article: existing });
    }

    const article = await Article.create({
      title,
      author: author || "Unknown",
      date: date || "",
      content: content || "",
      url,
    });

    return res.status(201).json({ duplicate: false, article });
  } catch (err) {
    if (err && err.code === 11000) {
      const existing = await Article.findOne({ url: req.body?.url });
      return res.status(200).json({ duplicate: true, article: existing });
    }

    return res.status(500).json({ message: "Failed to save article", error: err.message });
  }
};

exports.getAllArticles = async (req, res) => {
  try {
    const page = clampPositiveInt(req.query.page, 1);
    const limit = clampPositiveInt(req.query.limit, 10);
    const searchRaw = (req.query.search || "").toString().trim();

    const filter = {};
    if (searchRaw) {
      const safe = escapeRegex(searchRaw);
      const re = new RegExp(safe, "i");
      filter.$or = [{ title: re }, { content: re }];
    }

    const totalItems = await Article.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;

    const articles = await Article.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title slug author date content url");

    const results = articles.map((a) => {
      const content = a.content || "";
      const excerpt = content.length > 200 ? `${content.slice(0, 200)}...` : content;

      return {
        _id: a._id,
        title: a.title,
        slug: a.slug,
        author: a.author,
        date: a.date,
        excerpt,
        url: a.url,
      };
    });

    return res.status(200).json({
      page: currentPage,
      totalPages,
      totalItems,
      results,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch articles", error: err.message });
  }
};

exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid article id" });
    }

    const article = await Article.findById(id).select("title slug author date content url");

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    return res.status(200).json({
      _id: article._id,
      title: article.title,
      slug: article.slug,
      author: article.author,
      date: article.date,
      content: article.content,
      url: article.url,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch article", error: err.message });
  }
};

exports.getArticleBySlug = async (req, res) => {
  try {
    const raw = (req.params.slug || "").toString();
    const slug = raw.trim().toLowerCase();

    if (!slug) {
      return res.status(400).json({ message: "Invalid slug" });
    }

    const article = await Article.findOne({ slug }).select("title slug author date content url");

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    return res.status(200).json({
      _id: article._id,
      title: article.title,
      slug: article.slug,
      author: article.author,
      date: article.date,
      content: article.content,
      url: article.url,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch article", error: err.message });
  }
};
