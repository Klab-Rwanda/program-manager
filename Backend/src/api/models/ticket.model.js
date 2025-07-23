import Ticket from './ticketModel.js';

export const addTicket = async (ticketData) => {
  const ticket = new Ticket(ticketData);
  return await ticket.save();
};

export const getAllTickets = async () => {
  return await Ticket.find();
};

export const getTicketById = async (id) => {
  return await Ticket.findById(id);
};

export const updateTicketById = async (id, updates) => {
  return await Ticket.findByIdAndUpdate(id, updates, { new: true });
};

export const deleteTicketById = async (id) => {
  const result = await Ticket.findByIdAndDelete(id);
  return result != null;
};
