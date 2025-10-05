import express from "express";
import {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  exportExcel,
  exportPDF
} from "../controllers/entriesController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate); // protect all entry routes

router.post("/", createEntry);
router.get("/", getEntries);
router.get("/:id", getEntry);
router.put("/:id", updateEntry);
router.delete("/:id", deleteEntry);

router.get("/export/xlsx", exportExcel);
router.get("/export/pdf", exportPDF);

export default router;
