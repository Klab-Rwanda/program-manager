import api from '../api';

// Define the Ticket type on the frontend
export interface Ticket {
  _id: string;
  title: string;
  description: string;
  category: 'Hardware' | 'Software' | 'Network' | 'Account' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdBy: { _id: string; name: string; };
  assignedTo?: { _id: string; name: string; };
  createdAt: string;
  updatedAt: string;
  comments: Array<{
      author: { _id: string; name: string; };
      message: string;
      createdAt: string;
  }>
}

export interface CreateTicketData {
    title: string;
    description: string;
    category: Ticket['category'];
    priority: Ticket['priority'];
}

// Fetch all relevant tickets for the logged-in user
export const getTickets = async (): Promise<Ticket[]> => {
    const response = await api.get('/tickets');
    return response.data.data;
};

// Create a new ticket
export const createTicket = async (data: CreateTicketData): Promise<Ticket> => {
    const response = await api.post('/tickets', data);
    return response.data.data;
};

// Update a ticket (for IT Support)
export const updateTicket = async (ticketId: string, data: Partial<Ticket>): Promise<Ticket> => {
    const response = await api.patch(`/tickets/${ticketId}`, data);
    return response.data.data;
};

// Add a comment to a ticket
export const addCommentToTicket = async (ticketId: string, message: string): Promise<Ticket> => {
    const response = await api.post(`/tickets/${ticketId}/comments`, { message });
    return response.data.data;
};