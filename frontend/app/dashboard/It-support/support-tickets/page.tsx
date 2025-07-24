"use client";


import React, { useEffect, useState } from "react";
import { Ticket } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function ITSupportDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
 
useEffect(() => {
  const fetchTickets = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/tickets", {
         credentials: "include",
        headers: {
           
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept": "application/json"
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to fetch tickets");
      }

      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      console.error("Error fetching tickets:", err.message);
    }
  };

  fetchTickets();
}, []);


  const handleAddComment = async () => {
    if (!selectedTicket) return;

    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/tickets/${selectedTicket._id}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: comment }),
        }
      );

      if (res.ok) {
        const updated = await res.json();
        const updatedTickets = tickets.map((ticket) =>
          ticket._id === updated.data._id ? updated.data : ticket
        );
        setTickets(updatedTickets);
        setSelectedTicket(updated.data);
        setComment("");
      } else {
        console.error("Failed to add comment");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket) return;

    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/tickets/${selectedTicket._id}/resolve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const updated = await res.json();
        const updatedTickets = tickets.map((ticket) =>
          ticket._id === updated.data._id ? updated.data : ticket
        );
        setTickets(updatedTickets);
        setSelectedTicket(updated.data);
      } else {
        console.error("Failed to resolve ticket");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Support Tickets</h1>

      {loading ? (
        <p>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p>No tickets available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket._id} className="p-4">
              <h2 className="text-lg font-semibold">{ticket.title}</h2>
              <p className="text-sm text-gray-500">{ticket.category}</p>
              <p className="text-sm mt-2 line-clamp-2">{ticket.description}</p>
              <div className="mt-4 flex justify-end">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <h2 className="text-xl font-semibold mb-2">
                      {selectedTicket?.title}
                    </h2>
                    <p className="mb-2">{selectedTicket?.description}</p>
                    <div className="mb-4">
                      <h3 className="font-semibold mb-1">Comments:</h3>
                      {selectedTicket?.comments?.length ? (
                        <ul className="space-y-1 max-h-[150px] overflow-auto text-sm">
                          {selectedTicket.comments.map((c) => (
                            <li key={c._id}>🗨️ {c.message}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm italic">No comments</p>
                      )}
                    </div>
                    <textarea
                      className="w-full border rounded p-2 text-sm mb-2"
                      placeholder="Write a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button onClick={handleAddComment} disabled={!comment}>
                        Add Comment
                      </Button>
                      <Button onClick={handleResolve} variant="secondary">
                        Mark as Resolved
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
