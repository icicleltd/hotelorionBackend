const express = require("express");
const { createContacts, getContacts } = require("../controllers/contactsControllers");
const router = express.Router();

router.post("/add-contacts", createContacts);
router.get("/allcontacts", getContacts);

module.exports = router;
