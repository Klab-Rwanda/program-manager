'use client';
import { useEffect, useState } from 'react';

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  const [resolution, setResolution] = useState('');

  const fetchTickets = async () => {
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch("http://localhost:8000/api/v1/tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
         
        },
      });

      const result = await res.json();
      setTickets(result.data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleAddComment = async (ticketId: string) => {
    if (!comment.trim()) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/it-tickets/${ticketId}/comment`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: comment }),
      });
      if (res.ok) {
        setComment('');
        setSelectedTicketId(null);
        fetchTickets();
      } else {
        console.error("Failed to add comment");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    if (!resolution.trim()) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/it-tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolution }),
      });
      if (res.ok) {
        setResolution('');
        setResolvingTicketId(null);
        fetchTickets();
      } else {
        console.error("Failed to resolve ticket");
      }
    } catch (err) {
      console.error("Error resolving ticket:", err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!tickets || tickets.length === 0) return <p>No tickets found.</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Support Tickets</h1>
      <ul className="space-y-3">
        {tickets.map((ticket: any) => (
          <li key={ticket._id} className="border rounded p-4">
            <p><strong>Title:</strong> {ticket.title}</p>
            <p><strong>Status:</strong> {ticket.status}</p>
            <p><strong>Created by:</strong> {ticket.createdBy?.name}</p>
            <p><strong>Priority:</strong> {ticket.priority}</p>
            <p><strong>Date:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>

            <div className="mt-2">
              <button onClick={() => setSelectedTicketId(ticket._id)} className="mr-2 bg-blue-500 text-white px-2 py-1 rounded">
                Add Comment
              </button>
              <button onClick={() => setResolvingTicketId(ticket._id)} className="bg-green-500 text-white px-2 py-1 rounded">
                Resolve Ticket
              </button>
            </div>

            {selectedTicketId === ticket._id && (
              <div className="mt-2">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter your comment"
                  className="w-full border rounded p-2"
                />
                <button onClick={() => handleAddComment(ticket._id)} className="mt-1 bg-blue-600 text-white px-2 py-1 rounded">
                  Submit Comment
                </button>
                <button onClick={() => setSelectedTicketId(null)} className="ml-2 text-red-600">
                  Cancel
                </button>
              </div>
            )}

            {resolvingTicketId === ticket._id && (
              <div className="mt-2">
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Enter resolution details"
                  className="w-full border rounded p-2"
                />
                <button onClick={() => handleResolveTicket(ticket._id)} className="mt-1 bg-green-600 text-white px-2 py-1 rounded">
                  Mark as Resolved
                </button>
                <button onClick={() => setResolvingTicketId(null)} className="ml-2 text-red-600">
                  Cancel
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
