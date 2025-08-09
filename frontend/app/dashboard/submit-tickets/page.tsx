"use client";
import { useEffect, useState } from "react";
import { FaBoxTissue, FaEdit, FaTrash } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "react-toastify";



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
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("All");


  // For editing:
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

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
  setLoading(true);

  const token = localStorage.getItem("accessToken");
  if (!token) {
    console.error("No token found.");
    return;
  }

  // Detect API base URL based on current hostname
  let BASE_URL = "http://localhost:8000/api/v1"; // Default for local dev

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname.includes("andasy")) {
      BASE_URL = "https://backendklab.andasy.dev/api/v1";
    } else if (hostname.includes("vercel")) {
      BASE_URL = "https://program-manager-klab.onrender.com/api/v1";
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/tickets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to fetch tickets");
    }

    const data = await res.json();
    setTickets(data.tickets || []); // Replace with your actual key
  } catch (err) {
    console.error("Error fetching tickets:", err);
  } finally {
    setLoading(false);
  }
};

  // Open modal for creating new ticket
  const openCreateModal = () => {
    setEditingTicket(null);
    setFormData({ title: "", description: "", category: "", priority: "" });
    setOpen(true);
  };

  // Open modal for editing existing ticket
  const openEditModal = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
    });
    setOpen(true);
  };

  // Submit handler for both create & edit
 // Submit handler for both create & edit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  setSuccessMessage("");

  const token = localStorage.getItem("accessToken");
  if (!token) return alert("You must be logged in");

  try {
    // Detect API base URL based on current hostname
    let BASE_URL = "http://localhost:8000/api/v1"; // Default for local dev

    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      if (hostname.includes("andasy")) {
        BASE_URL = "https://backendklab.andasy.dev/api/v1";
      } else if (hostname.includes("vercel")) {
        BASE_URL = "https://program-manager-klab.onrender.com/api/v1";
      }
    }

    const url = editingTicket
      ? `${BASE_URL}/tickets/${editingTicket._id}`
      : `${BASE_URL}/tickets`;

    const method = editingTicket ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
      setFormData({ title: "", description: "", category: "", priority: "" });
      toast.success(editingTicket ? "Ticket updated successfully!" : "Ticket submitted successfully!");

      closeModal();
      fetchTickets();
      resetForm();
    } else {
      toast.error(data?.message || "Something went wrong.");
    }
  } catch (err: any) {
    console.error("Submission error:", err);
    toast.error(err?.message || "Something went wrong.");
  } finally {
    setSubmitting(false);
  }
};


  // Delete ticket
  // Delete ticket
const handleDelete = async (id: string) => {
  if (!confirm("Are you sure you want to delete this ticket?")) return;

  const token = localStorage.getItem("accessToken");
  if (!token) return alert("You must be logged in");

  try {
    // Detect API base URL based on current hostname
    let BASE_URL = "http://localhost:8000/api/v1"; // Default for local dev

    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      if (hostname.includes("andasy")) {
        BASE_URL = "https://backendklab.andasy.dev/api/v1";
      } else if (hostname.includes("vercel")) {
        BASE_URL = "https://program-manager-klab.onrender.com/api/v1";
      }
    }

    const res = await fetch(`${BASE_URL}/tickets/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      toast.success("Ticket deleted successfully!");
      fetchTickets();
    } else {
      const data = await res.json();
      toast.error(data.message || "Failed to delete ticket");
    }
  } catch (err) {
    console.error(err);
    toast.error("Error deleting ticket");
  }
};

  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus === "All") return true;
    if (filterStatus === "Unresolved") return ticket.status === "Open";
    if (filterStatus === "Under Review") return ticket.status === "In Progress";
    return ticket.status === filterStatus;
  });

  function handleEdit(ticket: Ticket): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="">
      <div className="flex justify-between  mb-4">
        <h2 className="text-2xl font-bold text-gray-800">My Support Tickets</h2>

       
        <Button className="bg-blue-900 text-white" onClick={openCreateModal}>
          Submit New Ticket
        </Button>
      </div>

     <div className="flex gap-2 bg-slate-100 p-2 rounded-md mt-3">
        {["All", "Resolved", "Unresolved", "Under Review"].map((status) => (
        <Button
         key={status}
         variant={filterStatus === status ? "default" : "outline"}
         onClick={() => setFilterStatus(status)}
                                                 >
        {status}
    </Button>
  ))}
</div>


     
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingTicket ? "Edit Ticket" : "Submit a New Ticket"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
            <Textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hardware">Hardware</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Network">Network</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? editingTicket
                    ? "Updating..."
                    : "Submitting..."
                  : editingTicket
                  ? "Update Ticket"
                  : "Submit Ticket"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setEditingTicket(null);
                }}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {successMessage && (
        <p className="text-green-600 mb-4">{successMessage}</p>
      )}

      {loading ? (
        <p className="text-gray-600">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="text-gray-500 italic">No tickets submitted yet.</p>
      ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
          {filteredTickets.map((ticket) => (
            <li key={ticket._id} className="border rounded-xl p-4 ">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">{ticket.title}</h2>
                <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(ticket)}
                  title="Edit Ticket"
                  className="flex items-center gap-1 bg-blue-100 text-blue-900 hover:bg-blue-200 px-3 py-1 rounded-lg shadow-sm border border-blue-300 transition-all duration-200"
                      >
                  <FaEdit className="text-sm" />
                  <span className="text-sm font-medium">Edit</span>
                  </button>


                  <button
                    onClick={() => handleDelete(ticket._id)}
                    title="Delete Ticket"
                   className="flex items-center gap-1 bg-gray-200 text-gray-600 hover:bg-gray-400 px-3 py-1 rounded-lg shadow-sm border border-gray-300 transition-all duration-200"
                  >
                    <FaTrash />
                    <span className="text-sm font-medium">delete</span>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
              <div className="flex justify-between text-sm">
                <span className="bg-slate-100 px-2 py-1 rounded">{ticket.category}</span>
                <span className="bg-slate-100 px-2 py-1 rounded">{ticket.priority}</span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <span>Status: {ticket.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      
    </div>
  );
function closeModal() {
  setOpen(false);
  setEditingTicket(null);
}

function resetForm() {
  setFormData({
    title: "",
    description: "",
    category: "",
    priority: "",
  });

}
}
