'use client';

import { useEffect, useState } from 'react';
import { Ticket } from '@/lib/services/ticket.service';

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  // Helper to get base URL based on environment
  const determineBaseUrl = (): string => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes("andasy")) return "https://klabbackend.andasy.dev/api/v1";
      if (hostname.includes("vercel") || hostname.includes("onrender")) return "https://program-manager-klab.onrender.com/api/v1";
    }
    return "http://localhost:8000/api/v1";
  };

  // Fetch tickets from API
  const fetchTickets = async () => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("No token found.");
      setLoading(false);
      return;
    }

    const BASE_URL = determineBaseUrl();

    try {
      const res = await fetch(`${BASE_URL}/it-support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch tickets");
      }

      const result = await res.json();
      setTickets(result.data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTickets();
  }, []);

  // Add comment to ticket
  const handleAddComment = async (ticketId: string) => {
    if (!comment.trim()) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return console.error("No token found.");

    const BASE_URL = determineBaseUrl();

    try {
      const res = await fetch(`${BASE_URL}/it-support/tickets/${ticketId}/comment`, {
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
        await fetchTickets();
      } else {
        console.error("Failed to add comment");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // Mark ticket as resolved
  const handleResolveTicket = async (ticketId: string) => {
    if (!resolution.trim()) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return console.error("No token found.");

    const BASE_URL = determineBaseUrl();

    try {
      const res = await fetch(`${BASE_URL}/it-support/tickets/${ticketId}/resolve`, {
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
        await fetchTickets();
      } else {
        console.error("Failed to resolve ticket");
      }
    } catch (err) {
      console.error("Error resolving ticket:", err);
    }
  };

  if (loading) return <p>Loading...</p>;

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <p className="text-xl font-semibold">🎉 No tickets to resolve</p>
        <p>You're all caught up!</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Support Tickets</h1>
      <p className="text-lg text-gray-400 mb-10">Resolve the tickets that users have submitted</p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {tickets.map((ticket: Ticket) => (
          <li key={ticket._id} className="border rounded p-4">
            <p><strong>Title:</strong> {ticket.title}</p>
            <p><strong>Status:</strong> {ticket.status}</p>
            <p><strong>Created by:</strong> {ticket.createdBy?.name || 'N/A'}</p>
            <p><strong>Priority:</strong> {ticket.priority}</p>
            <p><strong>Date:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>

            <div className="mt-2">
              <button
                onClick={() => {
                  setSelectedTicketId(ticket._id);
                  setResolvingTicketId(null); // Close resolve if open
                }}
                className="mr-2 bg-blue-900 text-white px-2 py-1 rounded"
              >
                Add Comment
              </button>
              <button
                onClick={() => {
                  setResolvingTicketId(ticket._id);
                  setSelectedTicketId(null); // Close comment if open
                }}
                className="bg-green-500 text-white px-2 py-1 rounded"
              >
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
                <button
                  onClick={() => handleAddComment(ticket._id)}
                  className="mt-1 bg-blue-600 text-white px-2 py-1 rounded"
                >
                  Submit Comment
                </button>
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="ml-2 text-red-600"
                >
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
                <button
                  onClick={() => handleResolveTicket(ticket._id)}
                  className="mt-1 bg-green-600 text-white px-2 py-1 rounded"
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => setResolvingTicketId(null)}
                  className="ml-2 text-red-600"
                >
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
