import Ticket from '../models/ticket.model.js'; // updated filename and path if needed
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

// Create a new ticket (any user)
export const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title || !description || !category) {
    throw new ApiError(400, 'Title, description, and category are required.');
  }

  // Validate enums manually or rely on mongoose validation on save

  const ticket = await Ticket.create({
    title,
    description,
    category,
    priority,
    createdBy: req.user._id,
  });

  res.status(201).json(new ApiResponse(201, ticket, 'Ticket created successfully.'));
});

// Get tickets: IT support gets all, others get their own
export const getTickets = asyncHandler(async (req, res) => {
  const query = (req.user.role === 'it_support' || req.user.role === 'SuperAdmin') ? {} : { createdBy: req.user._id };

  const tickets = await Ticket.find(query)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, tickets, 'Tickets fetched successfully.'));
});

// Get single ticket by ID
export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate('comments.author', 'name email');

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found.');
  }

  res.status(200).json(new ApiResponse(200, ticket, 'Ticket fetched successfully.'));
});

// Update ticket (basic fields, except status/resolution)
export const updateTicket = asyncHandler(async (req, res) => {
  const allowedUpdates = ['title', 'description', 'category', 'priority', 'assignedTo'];
  const updates = {};

  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email');

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found.');
  }

  res.status(200).json(new ApiResponse(200, ticket, 'Ticket updated successfully.'));
});

// Delete ticket
export const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found.');
  }

  res.status(200).json(new ApiResponse(200, null, 'Ticket deleted successfully.'));
});

// Add comment to ticket
export const addComment = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message) {
    throw new ApiError(400, 'Comment message is required.');
  }

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found.');
  }

  ticket.comments.push({
    author: req.user._id,
    message,
  });

  await ticket.save();

  const updatedTicket = await Ticket.findById(req.params.id)
    .populate('comments.author', 'name email');

  res.status(200).json(new ApiResponse(200, updatedTicket, 'Comment added successfully.'));
});
