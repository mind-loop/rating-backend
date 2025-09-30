const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit')

const { emailHTMLsent, emailTXTsent, getEmails, createEmail, activeEmail, changeActiveEmail, getEmail, deleteEmail, updateEmail } = require("../controller/email");
const sendLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: "Too many requests from this IP, please try again after an hour",
});
const updateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: "Too many requests from this IP, please try again after an hour",
});
router.route("/html").post(emailHTMLsent);
router.route("/txt").post(emailTXTsent)
router.route("/account").get(getEmails).post(createEmail);
router.route("/active").get(activeEmail);
router.route("/active/:id").post(changeActiveEmail);
router.route("/:id")
  .get(getEmail)
  .delete(deleteEmail)
  .put(updateEmail);

module.exports = router;
