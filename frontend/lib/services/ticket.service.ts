import api from '@/lib/api'; 

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
  }>;
}

export interface CreateTicketData {
  title: string;
  description: string;
  category: Ticket['category'];
  priority: Ticket['priority'];
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  category?: Ticket['category'];
  priority?: Ticket['priority'];
  status?: Ticket['status'];
  assignedTo?: string;
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
export const updateTicket = async (ticketId: string, data: UpdateTicketData): Promise<Ticket> => {
  const response = await api.patch(`/tickets/${ticketId}`, data);
  return response.data.data;
};

// Add a comment to a ticket
export const addCommentToTicket = async (ticketId: string, message: string): Promise<Ticket> => {
  const response = await api.post(`/tickets/${ticketId}/comments`, { message });
  return response.data.data;
};

// Resolve a ticket with resolution details
export const resolveTicket = async (ticketId: string, resolution: string): Promise<Ticket> => {
  // First update the status to resolved
  await updateTicket(ticketId, { status: 'Resolved' });
  
  // Then add the resolution as a comment
  const response = await addCommentToTicket(ticketId, `Ticket resolved: ${resolution}`);
  return response;
};

// Assign a ticket to a user (for IT Support)
export const assignTicket = async (ticketId: string, assignedToId: string): Promise<Ticket> => {
  const response = await api.patch(`/tickets/${ticketId}`, { assignedTo: assignedToId });
  return response.data.data;
};

// Get a single ticket by ID
export const getTicketById = async (ticketId: string): Promise<Ticket> => {
  const response = await api.get(`/tickets/${ticketId}`);
  return response.data.data;
};

// Delete a ticket (if allowed)
export const deleteTicket = async (ticketId: string): Promise<void> => {
  await api.delete(`/tickets/${ticketId}`);
};

// Get tickets with filters
export const getTicketsWithFilters = async (filters: {
  status?: Ticket['status'];
  priority?: Ticket['priority'];
  category?: Ticket['category'];
  assignedTo?: string;
}): Promise<Ticket[]> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      queryParams.append(key, value);
    }
  });
  
  const response = await api.get(`/tickets?${queryParams.toString()}`);
  return response.data.data;
};