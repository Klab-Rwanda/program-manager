"use client";

import { useState } from "react";
import { Paperclip, Send, Loader2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SubmitTicket() {
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    description: "",
    priority: "Medium",
    program: "",
    file: null as File | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, file: e.target.files?.[0] || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formPayload = new FormData();

      formPayload.append("subject", formData.subject);
      formPayload.append("category", formData.category);
      formPayload.append("priority", formData.priority);
      formPayload.append("description", formData.description);
      if (formData.program) {
        formPayload.append("program", formData.program);
      }
      if (formData.file) {
        formPayload.append("file", formData.file);
      }

      const response = await fetch("http://localhost:8000/api/v1/tickets", {
        method: "POST",
        body: formPayload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit ticket");
      }

      await response.json();

      toast.success("Ticket submitted successfully!");

      setFormData({
        subject: "",
        category: "",
        description: "",
        priority: "Medium",
        program: "",
        file: null,
      });
    } catch (error: any) {
      toast.error(`Error submitting ticket: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 rounded-2xl shadow-lg bg-white dark:bg-gray-900">
      <h2 className="text-2xl font-semibold mb-4">Submit a Support Ticket</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject */}
        <div>
          <label className="block font-medium mb-1">Subject</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              <option value="bug">Bug Report</option>
              <option value="question">Question</option>
              <option value="feature">Feature Request</option>
              <option value="technical">Technical Issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Related Program */}
        <div>
          <label className="block font-medium mb-1">Related Program (optional)</label>
          <input
            type="text"
            name="program"
            value={formData.program}
            onChange={handleChange}
            placeholder="e.g. UI/UX Design Bootcamp"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={5}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Please describe your issue or request in detail..."
          />
        </div>

        {/* File Upload */}
        <div className="flex items-center gap-3">
          <label className="block font-medium">Attach File:</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {formData.file && <span className="text-sm">{formData.file.name}</span>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all text-white 
            ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#1f497d] hover:bg-blue-700"}`}
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          Submit Ticket
        </button>
      </form>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
