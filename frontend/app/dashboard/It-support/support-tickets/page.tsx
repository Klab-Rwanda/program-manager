"use client";

import { useEffect, useState } from "react";
import TicketStatsCard from "@/components/tickets/ticketStats";
import FilterBar from "@/components/tickets/filtersBar";
import TicketTabs from "@/components/tickets/ticketTabs";
import TicketCard from "@/components/tickets/ticketCards";
import ViewTicketModal from "@/components/tickets/viewTicketModal";
import { Ticket } from "@/types/index";

export default function SubmitTicketPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("open");

  // For modal inputs
  const [newComment, setNewComment] = useState("");
  const [resolutionText, setResolutionText] = useState("");

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/tickets");
        const data = await res.json();
        const cleanedTickets = (data.tickets || []).map((t: Ticket) => ({
  ...t,
  title: t.title || "",
  description: t.description || "",
  priority: t.priority || "unknown",
  category: t.category || "unknown",
  status: t.status || "unknown",
}));

      setTickets(cleanedTickets);
         console.log("Fetched tickets:", data.tickets);
        
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, []);

  const filtered = tickets.filter((ticket) => {
    const matchSearch =
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchCategory = categoryFilter === "all" || ticket.category === categoryFilter;

    return matchSearch && matchStatus && matchPriority && matchCategory;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket._id}/comment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` || "",
        },
        body: JSON.stringify({ message: newComment.trim() }),
      });

      if (!res.ok) throw new Error("Failed to add comment");

      const updatedTicket = await res.json();

      setSelectedTicket(updatedTicket);
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
      );
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleResolveTicket = async () => {
    if (!resolutionText.trim() || !selectedTicket) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket._id}/resolve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` || "",
        },
        body: JSON.stringify({ resolution: resolutionText.trim() }),
      });

      if (!res.ok) throw new Error("Failed to resolve ticket");

      const updated = await res.json();

      setSelectedTicket(updated);
      setTickets((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
      setResolutionText("");
    } catch (error) {
      console.error("Resolve error:", error);
    }
  };

  if (loading) return <p>Loading tickets...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Submit Ticket</h1>

      <TicketStatsCard stats={stats} />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={statusFilter}
        onStatusChange={setStatusFilter}
        filterPriority={priorityFilter}
        onPriorityChange={setPriorityFilter}
        filterCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

      <TicketTabs activeTab={activeTab} setActiveTab={setActiveTab} ticketStats={stats}>
        {filtered
          .filter((t) => activeTab === "all" || t.status === activeTab)
          .map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket} onView={() => setSelectedTicket(ticket)} />
          ))}
      </TicketTabs>

      {selectedTicket && (
        <ViewTicketModal
          open={!!selectedTicket}
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          newComment={newComment}
          onCommentChange={setNewComment}
          onCommentSubmit={handleAddComment}
          resolutionText={resolutionText}
          onResolutionChange={setResolutionText}
          onResolve={handleResolveTicket}
        />
      )}
    </div>
  );

}
