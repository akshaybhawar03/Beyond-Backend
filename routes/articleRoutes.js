const express = require("express");
const router = express.Router();

const articleController = require("../controllers/articleController");

router.post("/", articleController.createArticle);
router.get("/", articleController.getAllArticles);
router.get("/slug/:slug", articleController.getArticleBySlug);
router.get("/:id", articleController.getArticleById);

module.exports = router;
