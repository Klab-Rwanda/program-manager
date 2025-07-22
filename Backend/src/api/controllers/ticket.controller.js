import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Ticket } from '../models/ticket.model.js';

// Any user can create a ticket
export const createTicket = asyncHandler(async (req, res) => {
    const { title, description, category, priority } = req.body;
    if (!title || !description || !category) {
        throw new ApiError(400, "Title, description, and category are required.");
    }
    const ticket = await Ticket.create({
        title,
        description,
        category,
        priority,
        createdBy: req.user._id
    });
    return res.status(201).json(new ApiResponse(201, ticket, "Ticket created successfully."));
});

// IT Support gets all tickets, others get their own
export const getTickets = asyncHandler(async (req, res) => {
    let query = {};
    if (req.user.role !== 'it_support' && req.user.role !== 'SuperAdmin') {
        query.createdBy = req.user._id;
    }
    const tickets = await Ticket.find(query)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, tickets, "Tickets fetched successfully."));
});

// IT Support can update a ticket (assign, change status, etc.)
export const updateTicket = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { status, assignedTo, priority, resolution } = req.body;
    
    const ticket = await Ticket.findByIdAndUpdate(
        ticketId,
        { $set: { status, assignedTo, priority, resolution } },
        { new: true }
    );

    if (!ticket) throw new ApiError(404, "Ticket not found.");
    return res.status(200).json(new ApiResponse(200, ticket, "Ticket updated successfully."));
});

// Any user involved in a ticket can add a comment
export const addComment = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { message } = req.body;
    if (!message) throw new ApiError(400, "Comment message cannot be empty.");

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new ApiError(404, "Ticket not found.");

    // Simple permission check: must be creator or assignee to comment
    const canComment = ticket.createdBy.toString() === req.user._id.toString() ||
                     ticket.assignedTo?.toString() === req.user._id.toString();

    if (!canComment && req.user.role !== 'it_support') {
         throw new ApiError(403, "You do not have permission to comment on this ticket.");
    }

    ticket.comments.push({ author: req.user._id, message });
    await ticket.save();

    return res.status(200).json(new ApiResponse(200, ticket, "Comment added successfully."));
});