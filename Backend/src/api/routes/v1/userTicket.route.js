import express from "express";
import {
  createTicket,
   getTickets,
  updateTicket,
  addComment
} from "../../controllers/userTickets.controller.js";


import { verifyJWT } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Create a new ticket (Any authenticated user)
router.post("/",createTicket);

// Get all tickets: IT gets all, users get their own
router.get("/",  getTickets);

// Update ticket: (e.g. IT assigns/resolves ticket)
router.put("/:ticketId", updateTicket);

// Add comment to a ticket
router.post("/:ticketId/comment", addComment);

export default router;
