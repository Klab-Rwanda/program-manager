import Ticket from '../models/ticket.model.js';

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

/**
 * GET /api/v1/it-tickets
 * Fetch all tickets (IT Support sees all)
 */
// src/api/controllers/itTicket.controller.js


// src/api/controllers/itTicket.controller.js




export const fetchAllTickets = async (req, res) => {
  try {
    

    const tickets = await Ticket.find()
    
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    console.log("Tickets found in DB:", tickets);

    res.status(200).json({
      success: true,
      data: tickets, // ✅ fixed
      message: "Tickets fetched successfully.",
    });

  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tickets" });
  }
};




/**
 * GET /api/v1/it-tickets/:id
 * Fetch ticket details by ID
 */
export const fetchTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email')
    .populate('comments.author', 'name email');

  if (!ticket) throw new ApiError(404, 'Ticket not found.');

  res.status(200).json(new ApiResponse(200, ticket, 'Ticket fetched successfully.'));
});

/**
 * PUT /api/v1/it-tickets/:id
 * Update ticket (status, assign, priority, resolution)
 */
export const updateTicket = asyncHandler(async (req, res) => {
  const allowedUpdates = ['status', 'assignedTo', 'priority', 'resolution'];
  const updates = {};

  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email');

  if (!ticket) throw new ApiError(404, 'Ticket not found.');

  res.status(200).json(new ApiResponse(200, ticket, 'Ticket updated successfully.'));
});

/**
 * PATCH /api/v1/it-tickets/:id/resolve
 * Mark ticket as resolved
 */
export const resolveTicket = asyncHandler(async (req, res) => {
  const { resolution } = req.body;

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) throw new ApiError(404, 'Ticket not found.');

  // Normalize user role to lowercase for safe comparison
  const userRole = req.user.role.toLowerCase();

  if (userRole !== 'itsupport' && userRole !== 'superadmin') {
    throw new ApiError(403, 'Only IT Supporters can resolve tickets.');
  }

  ticket.status = 'Resolved';
  ticket.resolution = resolution || 'Issue resolved';
  ticket.resolvedAt = new Date();

  await ticket.save();

  res.status(200).json(new ApiResponse(200, ticket, 'Ticket marked as resolved.'));
});

/**
 * POST /api/v1/it-tickets/:id/comment
 * Add a comment to the ticket
 */
export const addComment = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message) throw new ApiError(400, 'Comment message is required.');

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) throw new ApiError(404, 'Ticket not found.');

  ticket.comments.push({
    author: req.user._id,
    message,
  });

  await ticket.save();

  const updatedTicket = await Ticket.findById(req.params.id)
    .populate('comments.author', 'name email');

  res.status(200).json(new ApiResponse(200, updatedTicket, 'Comment added to the ticket.'));
});
