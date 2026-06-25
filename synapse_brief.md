# Project: AI Knowledge Graph

## Vision

People have hundreds or thousands of conversations with AI assistants such as ChatGPT, Claude, Gemini, etc.

Today those conversations are stored as isolated chats.

Over time users repeatedly ask the same questions because previous knowledge becomes difficult to discover.

The goal of this application is to transform conversations into a living knowledge graph.

Instead of browsing chat history, users explore their own thinking.

---

# Core Idea

The graph should **not** represent conversations.

The graph should **not** represent words.

The graph represents **knowledge**.

Each conversation contributes to an evolving graph of concepts, projects, decisions and artifacts.

Conversations become evidence attached to the graph rather than the primary object.

---

# User Experience

Instead of seeing

Chat 1

Chat 2

Chat 3

the user sees

Programming

Career

Finance

Travel

Gardening

Projects

Each topic expands into smaller connected concepts.

Example

Programming

→ React

→ Angular

→ TypeScript

→ Signals

→ Performance

Clicking any node expands its neighborhood while preserving context.

Navigation should feel closer to Google Maps than to folders.

---

# Graph Nodes

The graph consists of several node types.

## Concept

Examples

* React
* Authentication
* Docker
* Investing

---

## Project

Examples

* Memory App
* AI Knowledge Graph
* Personal Website

---

## Decision

Examples

* Use React instead of Angular
* Store data in PostgreSQL
* Use Zustand

---

## Artifact

Examples

* README
* Architecture document
* Prompt
* Code snippet

---

## Question

Open questions that have not yet been resolved.

---

# Conversation Processing

Each conversation is analyzed after completion.

The application asks an LLM to return structured JSON.

Example

```json
{
  "summary": "...",

  "topics": [
    "React",
    "Knowledge Graph"
  ],

  "projects": [
    "AI Knowledge Graph"
  ],

  "decisions": [
    "Represent concepts instead of chats"
  ],

  "questions": [
    "How should concepts be merged?"
  ],

  "artifacts": [
    "Architecture document"
  ]
}
```

The LLM performs extraction only.

The application owns the graph.

---

# Graph Builder

The application merges extracted information into an existing graph.

If a node already exists

increase its weight

update metadata

strengthen relationships

instead of creating duplicates.

Relationships become stronger the more often concepts appear together.

Example

React

────────

TypeScript

Weight: 42

---

# Visualization

The visualization is one of the defining features.

Requirements

* Force-directed graph
* Zoom and pan
* Smooth animations
* Progressive expansion
* Click to expand neighboring nodes
* Collapse nodes
* Highlight connected paths
* Search and focus on a node
* Display relationship strength

The graph should never display thousands of nodes at once.

Users explore the graph gradually.

---

# Navigation

Zoomed out

Programming

Career

Finance

Projects

Zoom in

Programming

↓

React

↓

State Management

↓

Zustand

↓

Conversation references

The graph should progressively reveal detail.

---

# Node Details

Clicking a node opens a side panel.

Example

React

Summary

Number of conversations

Related concepts

Projects

Architecture decisions

Questions

Code snippets

Related documents

Conversation references

Timeline

---

# Search

Searching should not simply filter chats.

Searching should navigate the graph.

Searching "Authentication"

should move the camera to the Authentication node and highlight all related concepts.

---

# Timeline

Each node stores

* first appearance
* last appearance
* discussion frequency

Users can scrub through time and watch the graph evolve.

This allows users to see how their interests changed over months or years.

---

# Architecture

The system should be divided into independent modules.

Conversation Import

↓

Knowledge Extraction

↓

Knowledge Merge

↓

Graph Storage

↓

Visualization

↓

Search

↓

Navigation

Each module should be replaceable.

The graph engine should work independently of any specific LLM.

Claude, ChatGPT or Gemini should simply provide structured extraction.

---

# Technology

Frontend

* React 19
* TypeScript
* Vite
* React Flow or Cytoscape.js (evaluate both)
* Zustand
* Tailwind CSS
* shadcn/ui

Storage

Initially local

Later PostgreSQL or graph database

---

# Phase 1

Do NOT implement everything.

Start by designing

* domain model
* graph data model
* node types
* relationship model
* merge algorithm
* folder structure
* persistence layer
* visualization architecture

Explain all architectural decisions before writing implementation code.

The long-term goal is to create a visual operating system for AI conversations rather than another chat history viewer.
