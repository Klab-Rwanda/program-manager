"use client"
import { useState } from "react"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Github,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BookOpen,
  Send,
  UserPlus,
  Award,
  TrendingUp,
  Calendar,
  FileText,
} from "lucide-react"
import "../../../styles/facilitator.css"

export default function FacilitatorsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [activeTab, setActiveTab] = useState("facilitators")
  const [showHireModal, setShowHireModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showContentPreview, setShowContentPreview] = useState(false)
  const [selectedFacilitator, setSelectedFacilitator] = useState(null)
  const [selectedContent, setSelectedContent] = useState(null)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [contentDuration, setContentDuration] = useState("weekly")

  const [facilitators, setFacilitators] = useState([
    {
      id: 1,
      name: "Alice Uwimana",
      email: "alice.uwimana@klab.rw",
      phone: "+250 788 123 456",
      specialization: "Full Stack Development",
      experience: "5 years",
      status: "active",
      programs: ["Tekeher Experts", "Web Development Basics"],
      rating: 4.8,
      github: "alice-uwimana",
      joinDate: "2023-01-15",
      studentsCount: 45,
      contentSubmissions: 12,
      approvedContent: 10,
      type: "hired",
    },
    {
      id: 2,
      name: "Bob Nkurunziza",
      email: "bob.nkurunziza@klab.rw",
      phone: "+250 788 234 567",
      specialization: "Data Science",
      experience: "7 years",
      status: "active",
      programs: ["Data Analytics Bootcamp"],
      rating: 4.9,
      github: "bob-data",
      joinDate: "2022-08-20",
      studentsCount: 32,
      contentSubmissions: 8,
      approvedContent: 8,
      type: "hired",
    },
    {
      id: 3,
      name: "Carol Mukamana",
      email: "carol.mukamana@klab.rw",
      phone: "+250 788 345 678",
      specialization: "UI/UX Design",
      experience: "4 years",
      status: "inactive",
      programs: ["UI/UX Design Mastery"],
      rating: 4.7,
      github: "carol-design",
      joinDate: "2023-03-10",
      studentsCount: 28,
      contentSubmissions: 5,
      approvedContent: 4,
      type: "hired",
    },
    {
      id: 4,
      name: "David Mugisha",
      email: "david.mugisha@student.klab.rw",
      phone: "+250 788 456 789",
      specialization: "Mobile Development",
      experience: "2 years",
      status: "active",
      programs: ["Mobile App Development"],
      rating: 4.5,
      github: "david-mobile",
      joinDate: "2024-01-10",
      studentsCount: 15,
      contentSubmissions: 3,
      approvedContent: 3,
      type: "promoted",
      previousProgram: "Tekeher Experts",
      promotionDate: "2024-01-10",
    },
  ])

  const [contentSubmissions, setContentSubmissions] = useState([
    {
      id: 1,
      facilitatorId: 1,
      facilitatorName: "Alice Uwimana",
      title: "Advanced React Hooks",
      description: "Comprehensive guide to useEffect, useContext, and custom hooks",
      program: "Tekeher Experts",
      submissionDate: "2024-01-20",
      status: "pending",
      type: "lesson",
      duration: "weekly",
      content: `
# Advanced React Hooks

## Introduction
React Hooks revolutionized how we write React components by allowing us to use state and other React features in functional components.

## useEffect Hook
The useEffect hook lets you perform side effects in functional components:

\`\`\`javascript
import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`You clicked \${count} times\`;
  });

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

## useContext Hook
The useContext hook allows you to consume context values:

\`\`\`javascript
const ThemeContext = React.createContext();

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div>Current theme: {theme}</div>;
}
\`\`\`

## Custom Hooks
Custom hooks let you extract component logic into reusable functions:

\`\`\`javascript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}
\`\`\`

## Assignment
Create a custom hook that manages form state and validation.
      `,
      fileUrl: "#",
    },
    {
      id: 2,
      facilitatorId: 2,
      facilitatorName: "Bob Nkurunziza",
      title: "Data Visualization with Python",
      description: "Creating interactive charts using matplotlib and seaborn",
      program: "Data Analytics Bootcamp",
      submissionDate: "2024-01-18",
      status: "approved",
      type: "assignment",
      duration: "program",
      content: `
# Data Visualization with Python

## Overview
Data visualization is crucial for understanding patterns and insights in data. Python offers powerful libraries for creating compelling visualizations.

## Matplotlib Basics
Matplotlib is the foundation of plotting in Python:

\`\`\`python
import matplotlib.pyplot as plt
import numpy as np

# Basic line plot
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, label='sin(x)')
plt.xlabel('X values')
plt.ylabel('Y values')
plt.title('Sine Wave')
plt.legend()
plt.grid(True)
plt.show()
\`\`\`

## Seaborn for Statistical Plots
Seaborn provides high-level statistical visualization:

\`\`\`python
import seaborn as sns
import pandas as pd

# Load sample dataset
tips = sns.load_dataset('tips')

# Create a scatter plot
plt.figure(figsize=(10, 6))
sns.scatterplot(data=tips, x='total_bill', y='tip', hue='day')
plt.title('Tips vs Total Bill by Day')
plt.show()
\`\`\`

## Interactive Visualizations
Using Plotly for interactive charts:

\`\`\`python
import plotly.express as px

# Interactive scatter plot
fig = px.scatter(tips, x='total_bill', y='tip', 
                color='day', size='size',
                title='Interactive Tips Visualization')
fig.show()
\`\`\`

## Project Assignment
Create a comprehensive dashboard analyzing a dataset of your choice using all three libraries.
      `,
      fileUrl: "#",
    },
    {
      id: 3,
      facilitatorId: 4,
      facilitatorName: "David Mugisha",
      title: "Flutter State Management",
      description: "Understanding Provider, Bloc, and Riverpod patterns",
      program: "Mobile App Development",
      submissionDate: "2024-01-22",
      status: "pending",
      type: "lesson",
      duration: "weekly",
      content: `
# Flutter State Management

## Introduction
State management is one of the most important concepts in Flutter development. It determines how data flows through your app and how the UI responds to changes.

## Provider Pattern
Provider is one of the most popular state management solutions:

\`\`\`dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class Counter extends ChangeNotifier {
  int _count = 0;
  
  int get count => _count;
  
  void increment() {
    _count++;
    notifyListeners();
  }
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => Counter(),
      child: MaterialApp(
        home: CounterScreen(),
      ),
    );
  }
}

class CounterScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Counter')),
      body: Center(
        child: Consumer<Counter>(
          builder: (context, counter, child) {
            return Text(
              'Count: \${counter.count}',
              style: Theme.of(context).textTheme.headline4,
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.read<Counter>().increment(),
        child: Icon(Icons.add),
      ),
    );
  }
}
\`\`\`

## BLoC Pattern
Business Logic Component pattern for more complex state management:

\`\`\`dart
import 'package:flutter_bloc/flutter_bloc.dart';

// Events
abstract class CounterEvent {}
class CounterIncremented extends CounterEvent {}
class CounterDecremented extends CounterEvent {}

// States
class CounterState {
  final int count;
  CounterState(this.count);
}

// BLoC
class CounterBloc extends Bloc<CounterEvent, CounterState> {
  CounterBloc() : super(CounterState(0)) {
    on<CounterIncremented>((event, emit) {
      emit(CounterState(state.count + 1));
    });
    
    on<CounterDecremented>((event, emit) {
      emit(CounterState(state.count - 1));
    });
  }
}
\`\`\`

## Riverpod
The next generation of Provider:

\`\`\`dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

final counterProvider = StateNotifierProvider<CounterNotifier, int>((ref) {
  return CounterNotifier();
});

class CounterNotifier extends StateNotifier<int> {
  CounterNotifier() : super(0);
  
  void increment() => state++;
  void decrement() => state--;
}
\`\`\`

## Assignment
Build a todo app using each of the three state management approaches and compare their pros and cons.
      `,
      fileUrl: "#",
    },
  ])

  const [pendingHires, setPendingHires] = useState([
    {
      id: 1,
      name: "Emma Thompson",
      email: "emma.thompson@email.com",
      specialization: "Cybersecurity",
      experience: "6 years",
      invitationDate: "2024-01-15",
      status: "pending",
    },
  ])

  const [eligibleStudents] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@student.klab.rw",
      program: "Tekeher Experts",
      finalScore: 95,
      attendanceRate: 98,
      specialization: "Frontend Development",
      github: "john-frontend",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@student.klab.rw",
      program: "Data Analytics Bootcamp",
      finalScore: 92,
      attendanceRate: 96,
      specialization: "Data Science",
      github: "jane-data",
    },
  ])

  const [newFacilitator, setNewFacilitator] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    experience: "",
    github: "",
  })

  const filteredFacilitators = facilitators.filter((facilitator) => {
    const matchesSearch = facilitator.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || facilitator.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const filteredContent = contentSubmissions.filter((content) => {
    const matchesSearch =
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.facilitatorName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || content.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handlePreviewContent = (content) => {
    setSelectedContent(content)
    setShowContentPreview(true)
  }

  const handleHireFacilitator = async (e) => {
    e.preventDefault()

    const pendingHire = {
      id: pendingHires.length + 1,
      ...newFacilitator,
      invitationDate: new Date().toISOString().split("T")[0],
      status: "pending",
    }

    setPendingHires([...pendingHires, pendingHire])

    console.log(` Invitation email sent to ${newFacilitator.email}`)
    console.log(` Unique access link generated for ${newFacilitator.name}`)

    setNewFacilitator({ name: "", email: "", phone: "", specialization: "", experience: "", github: "" })
    setShowHireModal(false)

    alert(
      `Invitation sent to ${pendingHire.name}! They will receive an email with unique credentials to access the platform.`,
    )
  }

  const handlePromoteStudent = (student) => {
    const newFacilitator = {
      id: facilitators.length + 1,
      name: student.name,
      email: student.email,
      phone: "+250 788 000 000",
      specialization: student.specialization,
      experience: "1 year",
      status: "active",
      programs: [],
      rating: 4.0,
      github: student.github,
      joinDate: new Date().toISOString().split("T")[0],
      studentsCount: 0,
      contentSubmissions: 0,
      approvedContent: 0,
      type: "promoted",
      previousProgram: student.program,
      promotionDate: new Date().toISOString().split("T")[0],
    }

    setFacilitators([...facilitators, newFacilitator])
    setShowPromoteModal(false)

    console.log(`🎉 ${student.name} promoted to facilitator!`)
    console.log(`📧 Promotion notification sent to ${student.email}`)

    alert(`${student.name} has been successfully promoted to facilitator!`)
  }

  const handleDeleteFacilitator = (id) => {
    if (confirm("Are you sure you want to remove this facilitator?")) {
      setFacilitators(facilitators.filter((f) => f.id !== id))
      alert("Facilitator removed successfully!")
    }
  }

  const handleApproveContent = (contentId) => {
    setContentSubmissions(
      contentSubmissions.map((content) => (content.id === contentId ? { ...content, status: "approved" } : content)),
    )

    const content = contentSubmissions.find((c) => c.id === contentId)
    setFacilitators(
      facilitators.map((f) => (f.id === content.facilitatorId ? { ...f, approvedContent: f.approvedContent + 1 } : f)),
    )

    alert("Content approved successfully!")
  }

  const handleRejectContent = (contentId) => {
    setContentSubmissions(
      contentSubmissions.map((content) => (content.id === contentId ? { ...content, status: "rejected" } : content)),
    )
    alert("Content rejected!")
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="fcard-status-icon active" size={16} />
      case "inactive":
        return <XCircle className="fcard-status-icon inactive" size={16} />
      case "pending":
        return <Clock className="fcard-status-icon pending" size={16} />
      default:
        return <Clock className="fcard-status-icon" size={16} />
    }
  }

  const facilitatorStats = {
    total: facilitators.length,
    active: facilitators.filter((f) => f.status === "active").length,
    hired: facilitators.filter((f) => f.type === "hired").length,
    promoted: facilitators.filter((f) => f.type === "promoted").length,
    pendingContent: contentSubmissions.filter((c) => c.status === "pending").length,
  }

  return (
    <div className="fcard-facilitators-page">
      <div className="fcard-page-header">
        <div className="fcard-header-content">
          <h1 className="fcard-page-title">
            <Users className="fcard-title-icon"  color="#1f497d" size={32} />
            Facilitators Management
          </h1>
          <p className="fcard-page-subtitle">Hire, manage, and monitor facilitator performance</p>
        </div>
        <div className="fcard-header-actions">
          <button className="fcard-action-btn secondary" onClick={() => setShowPromoteModal(true)}>
            <UserPlus size={18} />
            Promote Student
          </button>
          <button className="fcard-action-btn primary" onClick={() => setShowHireModal(true)}>
            <Plus size={18} />
            Hire Facilitator
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="fcard-facilitator-stats">
        <div className="fcard-stat">
          <div className="fcard-stat-icon bg-gray">
            <Users size={24} />
          </div>
          <div className="fcard-stat-content">
            <div className="fcard-stat-number">{facilitatorStats.total}</div>
            <div className="fcard-stat-label">Total Facilitators</div>
            <div className="fcard-stat-breakdown">{facilitatorStats.active} active</div>
          </div>
        </div>
        <div className="fcard-stat">
          <div className="fcard-stat-icon bg-blue">
            <Award size={24} />
          </div>
          <div className="fcard-stat-content">
            <div className="fcard-stat-number">{facilitatorStats.hired}</div>
            <div className="fcard-stat-label">Hired</div>
            <div className="fcard-stat-breakdown">External hires</div>
          </div>
        </div>
        <div className="fcard-stat">
          <div className="fcard-stat-icon bg-blue">
            <TrendingUp size={24} />
          </div>
          <div className="fcard-stat-content">
            <div className="fcard-stat-number">{facilitatorStats.promoted}</div>
            <div className="fcard-stat-label">Promoted</div>
            <div className="fcard-stat-breakdown">From students</div>
          </div>
        </div>
        <div className="fcard-stat">
          <div className="fcard-stat-icon bg-blue">
            <BookOpen size={24} />
          </div>
          <div className="fcard-stat-content">
            <div className="fcard-stat-number">{facilitatorStats.pendingContent}</div>
            <div className="fcard-stat-label">Pending Content</div>
            <div className="fcard-stat-breakdown">Awaiting approval</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="fcard-facilitators-tabs">
        <button
          className={`fcard-tab-btn ${activeTab === "facilitators" ? "active" : ""}`}
          onClick={() => setActiveTab("facilitators")}
        >
          <Users size={18} />
          Facilitators
        </button>
        <button
          className={`fcard-tab-btn ${activeTab === "content" ? "active" : ""}`}
          onClick={() => setActiveTab("content")}
        >
          <BookOpen size={18} />
          Content Submissions
        </button>
        <button
          className={`fcard-tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <Clock size={18} />
          Pending Hires
        </button>
      </div>

      {/* Controls */}
      <div className="fcard-facilitators-controls">
        <div className="fcard-search-container">
          <Search className="fcard-search-icon" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="fcard-search-input"
          />
        </div>
        <div className="fcard-filter-container">
          <Filter className="fcard-filter-icon" size={18} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="fcard-filter-select"
          >
            <option value="all">All Status</option>
            {activeTab === "facilitators" && (
              <>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </>
            )}
            {activeTab === "content" && (
              <>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "facilitators" && (
        <div className="fcard-facilitators-grid">
          {filteredFacilitators.map((facilitator) => (
            <div key={facilitator.id} className="fcard-main">
              <div className="fcard-header">
                <div className="fcard-avatar">
                  {facilitator.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="fcard-info">
                  <h3 className="fcard-name">{facilitator.name}</h3>
                  <p className="fcard-specialization">{facilitator.specialization}</p>
                  {facilitator.type === "promoted" && (
                    <span className="fcard-promotion-badge">
                      <TrendingUp size={12} />
                      Promoted from {facilitator.previousProgram}
                    </span>
                  )}
                </div>
                <div className="fcard-status">
                  {getStatusIcon(facilitator.status)}
                  <span className={`fcard-status-text ${facilitator.status}`}>{facilitator.status}</span>
                </div>
              </div>

              <div className="fcard-details">
                <div className="fcard-detail-item">
                  <Mail size={16} />
                  <span>{facilitator.email}</span>
                </div>
                <div className="fcard-detail-item">
                  <Phone size={16} />
                  <span>{facilitator.phone}</span>
                </div>
                <div className="fcard-detail-item">
                  <Github size={16} />
                  <span>@{facilitator.github}</span>
                </div>
              </div>

              <div className="fcard-stats">
                <div className="fcard-stat-item">
                  <span className="fcard-stat-label">Experience</span>
                  <span className="fcard-stat-value">{facilitator.experience}</span>
                </div>
                <div className="fcard-stat-item">
                  <span className="fcard-stat-label">Students</span>
                  <span className="fcard-stat-value">{facilitator.studentsCount}</span>
                </div>
                <div className="fcard-stat-item">
                  <span className="fcard-stat-label">Rating</span>
                  <span className="fcard-stat-value">{facilitator.rating}/5</span>
                </div>
              </div>

              <div className="fcard-programs">
                <h4>Current Programs:</h4>
                <div className="fcard-programs-list">
                  {facilitator.programs.length > 0 ? (
                    facilitator.programs.map((program, index) => (
                      <span key={index} className="fcard-program-tag">
                        {program}
                      </span>
                    ))
                  ) : (
                    <span className="fcard-no-programs">No programs assigned</span>
                  )}
                </div>
              </div>

              <div className="fcard-content-stats">
                <div className="fcard-content-stat">
                  <span>
                    Content: {facilitator.approvedContent}/{facilitator.contentSubmissions}
                  </span>
                </div>
              </div>

              <div className="fcard-actions">
                <button
                  className="fcard-btn view"
                  onClick={() => {
                    setSelectedFacilitator(facilitator)
                    setShowViewModal(true)
                  }}
                >
                  <Eye size={16} />
                  View
                </button>
                <button
                  className="fcard-btn edit"
                  onClick={() => {
                    setSelectedFacilitator(facilitator)
                    setShowEditModal(true)
                  }}
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button className="fcard-btn delete" onClick={() => handleDeleteFacilitator(facilitator.id)}>
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "content" && (
        <div className="fcard-content-submissions">
          {filteredContent.map((content) => (
            <div key={content.id} className="fcard-content">
              <div className="fcard-content-header">
                <div className="fcard-content-info">
                  <h3 className="fcard-content-title">{content.title}</h3>
                  <p className="fcard-content-description">{content.description}</p>
                  <div className="fcard-content-meta">
                    <span className="fcard-facilitator-name">By {content.facilitatorName}</span>
                    <span className="fcard-program-name">{content.program}</span>
                    <span className="fcard-submission-date">
                      {new Date(content.submissionDate).toLocaleDateString()}
                    </span>
                    <span className="fcard-content-type">{content.type}</span>
                    <span className="fcard-content-duration">{content.duration} duration</span>
                  </div>
                </div>
                <div className={`fcard-content-status ${content.status}`}>
                  {getStatusIcon(content.status)}
                  <span>{content.status}</span>
                </div>
              </div>

              <div className="fcard-content-actions">
                <button className="fcard-btn view" onClick={() => handlePreviewContent(content)}>
                  <Eye size={16} />
                  Preview
                </button>
                {content.status === "pending" && (
                  <>
                    <button className="fcard-btn approve" onClick={() => handleApproveContent(content.id)}>
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button className="fcard-btn reject" onClick={() => handleRejectContent(content.id)}>
                      <XCircle size={16} />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "pending" && (
        <div className="fcard-pending-hires">
          {pendingHires.map((hire) => (
            <div key={hire.id} className="fcard-pending-hire">
              <div className="fcard-hire-info">
                <h3>{hire.name}</h3>
                <p>
                  {hire.specialization} • {hire.experience}
                </p>
                <span className="fcard-hire-email">{hire.email}</span>
                <span className="fcard-invitation-date">
                  Invited: {new Date(hire.invitationDate).toLocaleDateString()}
                </span>
              </div>
              <div className="fcard-hire-status">
                <Clock size={16} />
                <span>Pending Response</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Preview Modal */}
      {showContentPreview && selectedContent && (
        <div className="fcard-modal-overlay">
          <div className="fcard-modal large">
            <div className="fcard-modal-header">
              <h2>Content Preview - {selectedContent.title}</h2>
              <button className="fcard-close-btn" onClick={() => setShowContentPreview(false)}>
                ×
              </button>
            </div>
            <div className="fcard-modal-content">
              <div className="fcard-content-duration">
                <button
                  className={`fcard-duration-btn ${contentDuration === "weekly" ? "active" : ""}`}
                  onClick={() => setContentDuration("weekly")}
                >
                  <Calendar size={14} />
                  Weekly Content
                </button>
                <button
                  className={`fcard-duration-btn ${contentDuration === "program" ? "active" : ""}`}
                  onClick={() => setContentDuration("program")}
                >
                  <BookOpen size={14} />
                  Full Program
                </button>
              </div>

              <div className="fcard-content-preview">
                <div className="fcard-content-body">
                  <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{selectedContent.content}</pre>
                </div>
              </div>

              <div className="fcard-content-meta">
                <div className="fcard-detail-item">
                  <FileText size={16} />
                  <span>Type: {selectedContent.type}</span>
                </div>
                <div className="fcard-detail-item">
                  <Users size={16} />
                  <span>Program: {selectedContent.program}</span>
                </div>
                <div className="fcard-detail-item">
                  <Calendar size={16} />
                  <span>Duration: {selectedContent.duration}</span>
                </div>
              </div>
            </div>
            <div className="fcard-modal-actions">
              <button className="fcard-modal-btn cancel" onClick={() => setShowContentPreview(false)}>
                Close
              </button>
              {selectedContent.status === "pending" && (
                <>
                  <button
                    className="fcard-modal-btn primary"
                    onClick={() => {
                      handleApproveContent(selectedContent.id)
                      setShowContentPreview(false)
                    }}
                  >
                    <CheckCircle size={16} />
                    Approve Content
                  </button>
                  <button
                    className="fcard-modal-btn cancel"
                    onClick={() => {
                      handleRejectContent(selectedContent.id)
                      setShowContentPreview(false)
                    }}
                  >
                    <XCircle size={16} />
                    Reject Content
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hire Modal */}
      {showHireModal && (
        <div className="fcard-modal-overlay">
          <div className="fcard-modal">
            <div className="fcard-modal-header">
              <h2>Hire New Facilitator</h2>
              <button className="fcard-close-btn" onClick={() => setShowHireModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleHireFacilitator} className="fcard-modal-form">
              <div className="fcard-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newFacilitator.name}
                  onChange={(e) => setNewFacilitator({ ...newFacilitator, name: e.target.value })}
                  required
                />
              </div>
              <div className="fcard-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newFacilitator.email}
                  onChange={(e) => setNewFacilitator({ ...newFacilitator, email: e.target.value })}
                  required
                />
              </div>
              <div className="fcard-form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newFacilitator.phone}
                  onChange={(e) => setNewFacilitator({ ...newFacilitator, phone: e.target.value })}
                  required
                />
              </div>
              <div className="fcard-form-group">
                <label>Specialization</label>
                <select
                  value={newFacilitator.specialization}
                  onChange={(e) => setNewFacilitator({ ...newFacilitator, specialization: e.target.value })}
                  required
                >
                  <option value="">Select Specialization</option>
                  <option value="Full Stack Development">Full Stack Development</option>
                  <option value="Frontend Development">Frontend Development</option>
                  <option value="Backend Development">Backend Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                </select>
              </div>
              <div className="fcard-form-group">
                <label>Experience</label>
                <input
                  type="text"
                  placeholder="e.g., 5 years"
                  value={newFacilitator.experience}
                  onChange={(e) => setNewFacilitator({ ...newFacilitator, experience: e.target.value })}
                  required
                />
              </div>
              <div className="fcard-form-group">
                <label>GitHub Username</label>
                <input
                  type="text"
                  value={newFacilitator.github}
                  onChange={(e) => setNewFacilitator({ ...newFacilitator, github: e.target.value })}
                  required
                />
              </div>
              <div className="fcard-modal-actions">
                <button type="button" className="fcard-modal-btn cancel" onClick={() => setShowHireModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="fcard-modal-btn primary">
                  <Send size={16} />
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promote Student Modal */}
      {showPromoteModal && (
        <div className="fcard-modal-overlay">
          <div className="fcard-modal">
            <div className="fcard-modal-header">
              <h2>Promote Student to Facilitator</h2>
              <button className="fcard-close-btn" onClick={() => setShowPromoteModal(false)}>
                ×
              </button>
            </div>
            <div className="fcard-modal-content">
              <div className="fcard-eligible-students">
                {eligibleStudents.map((student) => (
                  <div key={student.id} className="fcard-student-promotion">
                    <div className="fcard-student-info">
                      <div className="fcard-student-avatar">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="fcard-student-details">
                        <h4>{student.name}</h4>
                        <p>{student.specialization}</p>
                        <span className="fcard-student-program">{student.program}</span>
                      </div>
                    </div>
                    <div className="fcard-student-metrics">
                      <div className="fcard-metric">
                        <span className="fcard-metric-label">Score</span>
                        <span className="fcard-metric-value">{student.finalScore}%</span>
                      </div>
                      <div className="fcard-metric">
                        <span className="fcard-metric-label">Attendance</span>
                        <span className="fcard-metric-value">{student.attendanceRate}%</span>
                      </div>
                    </div>
                    <button className="fcard-promote-btn" onClick={() => handlePromoteStudent(student)}>
                      <UserPlus size={16} />
                      Promote
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedFacilitator && (
        <div className="fcard-modal-overlay">
          <div className="fcard-modal large">
            <div className="fcard-modal-header">
              <h2>Facilitator Details - {selectedFacilitator.name}</h2>
              <button className="fcard-close-btn" onClick={() => setShowViewModal(false)}>
                ×
              </button>
            </div>
            <div className="fcard-modal-content">
              <div className="fcard-facilitator-profile">
                <div className="fcard-profile-avatar">
                  {selectedFacilitator.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="fcard-profile-details">
                  <h3>{selectedFacilitator.name}</h3>
                  <p>{selectedFacilitator.specialization}</p>
                  <div className="fcard-profile-stats">
                    <span>Rating: {selectedFacilitator.rating}/5</span>
                    <span>Students: {selectedFacilitator.studentsCount}</span>
                    <span>Experience: {selectedFacilitator.experience}</span>
                  </div>
                </div>
              </div>

              <div className="fcard-profile-sections">
                <div className="fcard-section">
                  <h4>Contact Information</h4>
                  <p>Email: {selectedFacilitator.email}</p>
                  <p>Phone: {selectedFacilitator.phone}</p>
                  <p>GitHub: @{selectedFacilitator.github}</p>
                </div>

                <div className="fcard-section">
                  <h4>Programs</h4>
                  <div className="fcard-programs-list">
                    {selectedFacilitator.programs.map((program, index) => (
                      <span key={index} className="fcard-program-tag">
                        {program}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="fcard-section">
                  <h4>Performance</h4>
                  <p>Content Submissions: {selectedFacilitator.contentSubmissions}</p>
                  <p>Approved Content: {selectedFacilitator.approvedContent}</p>
                  <p>Join Date: {new Date(selectedFacilitator.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedFacilitator && (
        <div className="fcard-modal-overlay">
          <div className="fcard-modal">
            <div className="fcard-modal-header">
              <h2>Edit Facilitator - {selectedFacilitator.name}</h2>
              <button className="fcard-close-btn" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>
            <div className="fcard-modal-content">
              <div className="fcard-edit-form">
                <div className="fcard-form-group">
                  <label>Status</label>
                  <select
                    value={selectedFacilitator.status}
                    onChange={(e) => {
                      setFacilitators(
                        facilitators.map((f) =>
                          f.id === selectedFacilitator.id ? { ...f, status: e.target.value } : f,
                        ),
                      )
                      setSelectedFacilitator({ ...selectedFacilitator, status: e.target.value })
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="fcard-form-group">
                  <label>Programs</label>
                  <div className="fcard-programs-edit">
                    {[
                      "Tekeher Experts",
                      "Data Analytics Bootcamp",
                      "Mobile App Development",
                      "UI/UX Design Mastery",
                    ].map((program) => (
                      <label key={program} className="fcard-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedFacilitator.programs.includes(program)}
                          onChange={(e) => {
                            const updatedPrograms = e.target.checked
                              ? [...selectedFacilitator.programs, program]
                              : selectedFacilitator.programs.filter((p) => p !== program)

                            setFacilitators(
                              facilitators.map((f) =>
                                f.id === selectedFacilitator.id ? { ...f, programs: updatedPrograms } : f,
                              ),
                            )
                            setSelectedFacilitator({ ...selectedFacilitator, programs: updatedPrograms })
                          }}
                        />
                        {program}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="fcard-modal-actions">
              <button className="fcard-modal-btn cancel" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button
                className="fcard-modal-btn primary"
                onClick={() => {
                  setShowEditModal(false)
                  alert("Facilitator updated successfully!")
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
