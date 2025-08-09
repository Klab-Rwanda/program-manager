import express from "express";
import {
  fetchAllTickets,
  updateTicket,
  resolveTicket,
  addComment,
} from "../../controllers/itTicket.controller.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { checkRole } from "../../middlewares/role.middleware.js";

const router = express.Router();

// All routes require authentication and IT Support or SuperAdmin role
router.use(verifyJWT);
router.use(checkRole(["ItSupport", "SuperAdmin"]));


// Get all tickets (IT Support sees all)
router.get("/", (req, res, next) => {
  console.log("REQ USER:", req.user); 
  return fetchAllTickets(req, res, next);
});

// Update ticket details
router.patch("/:id", updateTicket);

// Resolve a ticket (patch to mark resolved)
router.patch("/:id/resolve", resolveTicket);

// Add comment to ticket
router.post("/:id/comment", addComment);

export default router;
