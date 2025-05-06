const express = require("express");
const router = express.Router();
const controller = require("../controllers/dnsController");

router.post("/", (req, res) => controller.addRecord(req, res));
router.get("/:hostname", (req, res) => controller.resolveHostname(req, res));
router.get("/:hostname/records", (req, res) =>
  controller.listRecords(req, res)
);
router.delete("/:hostname", (req, res) => controller.deleteRecord(req, res));

module.exports = router;
