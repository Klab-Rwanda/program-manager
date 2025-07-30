"use client";
import { useEffect, useState } from "react";
import { FaBoxTissue } from "react-icons/fa";

type Ticket = {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
};

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return console.error("No token found.");

    try {
      const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

const res = await fetch(`${BASE_URL}/tickets`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

      const data = await res.json();
      if (res.ok) {
        const sorted = data.data.sort(
          (a: Ticket, b: Ticket) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTickets(sorted);
      } else {
        console.error(data.message || "Failed to fetch tickets");
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");
    const token = localStorage.getItem("accessToken");
    if (!token) return alert("You must be logged in");

    try {
      const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

     const res = await fetch(`${BASE_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setFormData({ title: "", description: "", category: "", priority: "" });
        setSuccessMessage(" Ticket submitted successfully!");
        fetchTickets();
      } else {
        alert(data.message || "Ticket submission failed");
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">📝 Submit a Ticket</h2>

      <form onSubmit={handleSubmit} className="space-y-4 border p-6 rounded-lg shadow bg-white">
        <input
          type="text"
          placeholder="Title"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
        <select
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
        >
          <option value="">Select Category</option>
          <option value="Hardware">Hardware</option>
          <option value="Software">Software</option>
          <option value="Network">Network</option>
        </select>
        <select
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          required
        >
          <option value="">Select Priority</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
        >
          {submitting ? "Submitting..." : "Submit Ticket"}
        </button>

        {successMessage && <p className="text-green-600 mt-2">{successMessage}</p>}
      </form>

      <h2 className="text-2xl font-bold mt-12 mb-4 text-gray-800"><FaBoxTissue /> My Submitted Tickets</h2>

      {loading ? (
        <p className="text-gray-600">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="text-gray-500 italic">No tickets submitted yet.</p>
      ) : (
        <ul className="space-y-4">
          {tickets.map((ticket) => (
            <li
              key={ticket._id}
              className="p-5 border rounded-lg shadow-sm bg-gray-50 hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
              <p className="text-sm text-gray-700 mt-1">{ticket.description}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                <span><strong>Category:</strong> {ticket.category}</span>
                <span><strong>Priority:</strong> {ticket.priority}</span>
                <span><strong>Status:</strong> {ticket.status}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Submitted: {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
