"use client";

import React, { useState, useEffect } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import { EventItem } from "@/data/mockData";
import { fetchEvents, createEventViaApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type EventFilter = "live" | "completed" | "all";

function isEventCompleted(event: EventItem): boolean {
  if (event.date) {
    const date = new Date(`${event.date}T00:00:00`);
    return !Number.isNaN(date.getTime()) && date < new Date(new Date().setHours(0, 0, 0, 0));
  }
  if (event.status) return event.status === "completed";
  const month = new Date(`${event.month} 1, 2000`).getMonth();
  const day = Number(event.day);
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  const now = new Date();
  return new Date(now.getFullYear(), month, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function EventsPage() {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "admin";

  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventFilter, setEventFilter] = useState<EventFilter>("live");
  const [isLoading, setIsLoading] = useState(true);

  // New Event Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 10);
  });
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await fetchEvents();
        setEvents(data);
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Permission restricted: Only administrators can host events.");
      return;
    }
    if (!title || !location) return;

    setIsSaving(true);
    const selectedDate = new Date(`${date}T00:00:00`);
    const eventData: Omit<EventItem, "id"> = {
      title,
      month: selectedDate.toLocaleString("en-US", { month: "short" }),
      day: String(selectedDate.getDate()),
      date,
      status: "live",
      location,
      description: description.trim(),
      isVirtual,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400",
    };

    try {
      const savedEvent = await createEventViaApi(eventData);
      setEvents((previous) => [savedEvent, ...previous]);
      setIsModalOpen(false);
      setTitle("");
      setLocation("");
      setDescription("");
      setImageUrl("");
    } catch (err) {
      console.error("Failed to create event:", err);
      alert(err instanceof Error ? err.message : "Unable to create this event. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const liveEvents = events.filter((event) => !isEventCompleted(event));
  const completedEvents = events.filter(isEventCompleted);
  const visibleEvents = eventFilter === "live" ? liveEvents : eventFilter === "completed" ? completedEvents : events;

  return (
    <LayoutWrapper>
      <div className="mx-auto w-full max-w-[1440px] space-y-6">
        {/* Hero header */}
        <header className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
                style={{ background: "linear-gradient(135deg, #0d2233 0%, #1a4a5e 100%)" }}>
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 pointer-events-none"
               style={{ background: "radial-gradient(circle, #60c4e8 0%, transparent 70%)" }} />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.20em] text-white/45 mb-2">
                Community <span className="text-white/25 mx-1">/</span> Calendar
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1"
                  style={{ fontFamily: "Poppins, system-ui, sans-serif", letterSpacing: "-0.025em" }}>
                University Events
              </h1>
              <p className="text-sm text-white/55">Discover gatherings, workshops, and alumni community events.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-5 text-sm font-semibold cursor-pointer"
                style={{ background: "#60c4e8", color: "#0d2233" }}
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Host an Event
              </button>
            )}
          </div>
        </header>

        {/* Filter tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#e8edf2" }} role="group">
            {(["live", "completed", "all"] as const).map((filter) => (
              <button key={filter} type="button" onClick={() => setEventFilter(filter)} aria-pressed={eventFilter === filter}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  eventFilter === filter ? "bg-white text-[#1a4a5e] shadow-sm" : "text-[#4a6072] hover:text-[#1a4a5e]"
                }`}>
                {filter === "live" ? `Upcoming (${liveEvents.length})` : filter === "completed" ? `Completed (${completedEvents.length})` : "All"}
              </button>
            ))}
          </div>
          <span className="text-xs font-medium text-[#8199a9]">{visibleEvents.length} event{visibleEvents.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Events list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-[#4a6072]">
            <div className="spinner" /><span className="text-sm">Loading events…</span>
          </div>
        ) : visibleEvents.length ? (
          <div className="space-y-3">
            {visibleEvents.map((event) => {
              const completed = isEventCompleted(event);
              return (
                <article key={event.id} className="card p-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl text-center"
                       style={{ background: completed ? "#e8edf2" : "#cce5f0" }}>
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: completed ? "#8199a9" : "#1a4a5e" }}>{event.month}</span>
                    <span className="mt-0.5 text-2xl font-bold leading-none" style={{ color: completed ? "#4a6072" : "#0d2233", fontFamily: "Poppins, system-ui, sans-serif" }}>{event.day}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-base font-bold text-[#0f1f2e]" style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>{event.title}</h2>
                      <span className={`badge ${completed ? "badge-neutral" : "badge-primary"}`}>{completed ? "Completed" : "Upcoming"}</span>
                      {event.isVirtual && <span className="badge" style={{ background: "#e0e7ff", color: "#4338ca", border: "1px solid #c7d2fe" }}>Virtual</span>}
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-[#8199a9] mb-1">
                      <span className="material-symbols-outlined text-[14px]">{event.isVirtual ? "videocam" : "location_on"}</span>{event.location}
                    </p>
                    {event.description && <p className="text-sm leading-relaxed text-[#4a6072] max-w-2xl">{event.description}</p>}
                  </div>
                  <button type="button" onClick={() => void navigator.clipboard?.writeText(`${event.title} - ${event.month} ${event.day} at ${event.location}`)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#8199a9] hover:bg-[#cce5f0] hover:text-[#1a4a5e] cursor-pointer transition-colors">
                    <span className="material-symbols-outlined text-[19px]">content_copy</span>
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#c2cfd8] mb-3">event_busy</span>
            <p className="text-base font-bold text-[#0f1f2e] mb-1" style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>No events here</p>
            <p className="text-sm text-[#8199a9]">Try another filter or check back soon.</p>
          </div>
        )}

        {/* Create Event Modal */}
        {isModalOpen && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
               style={{ background: "rgba(13,34,51,0.65)", backdropFilter: "blur(8px)" }}>
            <div className="w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
                 style={{ background: "#ffffff", boxShadow: "0 24px 64px rgba(0,0,0,0.30)" }}>
              <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: "1px solid #e1e8ee" }}>
                <h2 className="text-lg font-bold text-[#0f1f2e]" style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>Host a New Event</h2>
                <button onClick={() => setIsModalOpen(false)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8199a9] hover:bg-[#f1f5f9] cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <form onSubmit={handleCreateEvent} className="flex flex-col gap-4 p-6">
                {[
                  { label: "Event Title *", type: "text", value: title, fn: setTitle, ph: "e.g. Annual Alumni Meetup 2026", req: true },
                  { label: "Location / Venue *", type: "text", value: location, fn: setLocation, ph: "e.g. Auditorium Hall or Zoom", req: true },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold text-[#1e3a4a] mb-1.5">{f.label}</label>
                    <input type={f.type} required={f.req} placeholder={f.ph} value={f.value}
                      onChange={(e) => f.fn(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[#dde5eb] bg-[#f8fafc] text-sm text-[#0f1f2e] focus:border-[#1a4a5e] focus:ring-2 focus:ring-[#1a4a5e]/10 focus:outline-none transition-all" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#1e3a4a] mb-1.5">Event Date *</label>
                  <input type="date" required min={new Date().toISOString().slice(0,10)} value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-[#dde5eb] bg-[#f8fafc] text-sm text-[#0f1f2e] focus:border-[#1a4a5e] focus:ring-2 focus:ring-[#1a4a5e]/10 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1e3a4a] mb-1.5">Description</label>
                  <textarea rows={3} maxLength={500} placeholder="What will attendees experience?" value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full resize-y px-4 py-3 rounded-xl border border-[#dde5eb] bg-[#f8fafc] text-sm text-[#0f1f2e] focus:border-[#1a4a5e] focus:ring-2 focus:ring-[#1a4a5e]/10 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1e3a4a] mb-1.5">Banner Image URL (optional)</label>
                  <input type="url" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-[#dde5eb] bg-[#f8fafc] text-sm text-[#0f1f2e] focus:border-[#1a4a5e] focus:outline-none transition-all" />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#1e3a4a]">
                  <input type="checkbox" checked={isVirtual} onChange={(e) => setIsVirtual(e.target.checked)} className="h-4 w-4 rounded accent-[#1a4a5e]" />
                  This is a virtual / online event
                </label>
                <div className="flex gap-2.5 pt-3" style={{ borderTop: "1px solid #e1e8ee" }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1 text-xs">Cancel</button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary flex-1 text-xs disabled:opacity-50">{isSaving ? "Creating…" : "Create Event"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
