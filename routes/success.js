const express = require("express");
const router = express.Router();
router.route("/").get((req, res) => {
  res.status(200).json({
    message: {
      update_counter:"331",
      message:"Fix Done + Runner1"
    },
    success: true,
  });
});
module.exports = router;
