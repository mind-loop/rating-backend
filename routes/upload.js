const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/protect");
const { uploadImage } = require("../controller/upload");

router.route("/").post(protect, uploadImage)
router.route("/:id").post(protect, uploadImage)
module.exports = router;
