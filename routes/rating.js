const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/protect");
const { createRatings, getOrganizationRate } = require("../controller/rating");

router.route("/").post(createRatings);
router.route("/organization").get(protect, getOrganizationRate);
router.route("/user/organization/:id").get(protect, getOrganizationRate);

module.exports = router;