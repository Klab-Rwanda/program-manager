import {
  addTicket,
  getAllTickets,
  getTicketById,
  updateTicketById,
  deleteTicketById,
} from '../models/ticket.model.js';



// Create ticket
export const submitTicket = async (req, res) => {
  try {
    const { subject, category, priority, program, description } = req.body;

    if (!subject || !category || !priority || !description) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const newTicket = {
      subject,
      category,
      priority,
      program,
      description,
      file: req.file ? req.file.filename : null,
      submittedAt: new Date(),
    };

    const saved = await addTicket(newTicket);
    res.status(201).json({ message: 'Ticket submitted successfully', ticket: saved });
  } catch (error) {
    console.error('Error submitting ticket:', error);
    res.status(500).json({ message: 'Failed to submit ticket', error: error.message });
  }
};

// Get all tickets
export const fetchAllTickets = async (req, res) => {
  try {
    const tickets = await getAllTickets();
    res.status(200).json({ tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Failed to fetch tickets', error: error.message });
  }
};

// Get ticket by ID
export const fetchTicketById = async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json({ ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Failed to fetch ticket', error: error.message });
  }
};

// Update ticket by ID
export const updateTicket = async (req, res) => {
  try {
    const updates = req.body;
    const updatedTicket = await updateTicketById(req.params.id, updates);
    if (!updatedTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json({ message: 'Ticket updated successfully', ticket: updatedTicket });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Failed to update ticket', error: error.message });
  }
};

// Delete ticket by ID
export const deleteTicket = async (req, res) => {
  try {
    const deleted = await deleteTicketById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ message: 'Failed to delete ticket', error: error.message });
  }
};

export const addCommentToTicket = async (req, res) => {
  const { id } = req.params;
  const { message, author } = req.body;

  if (!message || !author) {
    return res.status(400).json({ error: "Message and author are required." });
  }

  const ticket = await ticket.findById(id); // ✅ This will now work
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  ticket.comments.push({
    message,
    author,
    timestamp: new Date(),
  });

  await ticket.save();
  res.status(200).json({ message: "Comment added", ticket });
};




// controllers/ticketController.ts

export const resolveTicket = async (req, res) => {
  const ticketId = req.params.id;
  const { resolution } = req.body;
  const userRole = req.user?.role;

  if (userRole !== "itSupport") {
    return res.status(403).json({ message: "Only technicians can resolve tickets" });
  }

  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = "resolved";
    ticket.resolution = resolution;
    ticket.resolvedBy = req.user.id;
    ticket.resolvedAt = new Date();

    await ticket.save();
    return res.status(200).json(ticket);
  } catch (err) {
    return res.status(500).json({ message: "Failed to resolve ticket" });
  }
};
