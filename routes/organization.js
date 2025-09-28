const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/protect");

const {
  getOrganizations,
  signUp,
  signIn,
  organizationInfo,
  removeOrganization,
  forgotPassword,
  updateOrganizationInfo,
  changePassword,
  getOrganization,
} = require("../controller/organization");

router.route("/").get(getOrganizations);
router.route("/signup").post(protect, signUp);
router.route("/signin").post(signIn);
router.route("/update").put(protect, updateOrganizationInfo);
router.route("/update/:id").put(protect, updateOrganizationInfo);
router.route("/info")
  .get(protect, organizationInfo);
router.route("/:id").get(getOrganization);

router
  .route("/forgot-password")
  .put(forgotPassword);
router
  .route("/change-password")
  .put(protect, changePassword);
router
  .route("/:id")
  .delete(protect, removeOrganization);
module.exports = router;
