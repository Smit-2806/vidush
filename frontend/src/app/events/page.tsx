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
      <div className="mx-auto w-full max-w-[1440px] space-y-7">
        <header className="flex flex-col justify-between gap-5 border-b border-[#d9e2e3] pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#54766f]">Community <span className="px-1.5 text-[#a1b2b0]">/</span> Calendar</p>
            <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[#142f38] sm:text-4xl">University events</h1>
            <p className="mt-2 text-sm text-[#63777d]">Find gatherings, workshops, and community events.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-md bg-[#173c42] px-4 text-sm font-semibold text-white transition hover:bg-[#21525a] md:self-auto"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Host an Event
            </button>
          )}
        </header>

        <section aria-label="Event filters" className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d9e2e3] pb-4">
          <div className="flex gap-5" role="group" aria-label="Filter events">
            {(["live", "completed", "all"] as const).map((filter) => <button key={filter} type="button" onClick={() => setEventFilter(filter)} aria-pressed={eventFilter === filter} className={`border-b-2 pb-2 text-sm font-semibold capitalize transition ${eventFilter === filter ? "border-[#24635d] text-[#205b55]" : "border-transparent text-[#788a8e] hover:text-[#24444b]"}`}>{filter === "live" ? `Live & upcoming (${liveEvents.length})` : filter === "completed" ? `Completed (${completedEvents.length})` : "All events"}</button>)}
          </div>
          <span className="text-xs text-[#849398]">{visibleEvents.length} events</span>
        </section>

        {visibleEvents.length ? (
          <div className="divide-y divide-[#dfe7e7] border-b border-[#d9e2e3]">
            {visibleEvents.map((event) => (
              <article key={event.id} className="grid gap-4 py-5 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
                <div className="flex h-[68px] w-[68px] flex-col items-center justify-center rounded-md bg-[#e4efeb] text-[#255852]">
                  <span className="text-[10px] font-bold uppercase tracking-wide">{event.month}</span>
                  <span className="mt-0.5 text-2xl font-semibold leading-none">{event.day}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold text-[#17343b]">{event.title}</h2><span className={`text-[10px] font-bold uppercase tracking-wider ${isEventCompleted(event) ? "text-[#879599]" : "text-[#287359]"}`}>{isEventCompleted(event) ? "Completed" : "Upcoming"}</span></div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#718287]"><span className="material-symbols-outlined text-[15px]">{event.isVirtual ? "videocam" : "location_on"}</span>{event.location}</p>
                  {event.description && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#63777d]">{event.description}</p>}
                </div>
                <button type="button" onClick={() => { void navigator.clipboard?.writeText(`${event.title} - ${event.month} ${event.day} at ${event.location}`); }} aria-label={`Copy details for ${event.title}`} title="Copy event details" className="flex h-10 w-10 items-center justify-center rounded-md text-[#517078] transition hover:bg-[#e4efeb] hover:text-[#205b55]">
                  <span className="material-symbols-outlined text-[19px]">content_copy</span>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="border-y border-dashed border-[#cbd8d9] py-16 text-center"><span className="material-symbols-outlined text-3xl text-[#829398]">event_busy</span><p className="mt-2 text-sm font-semibold text-[#29474e]">{isLoading ? "Loading events…" : "No events in this view"}</p><p className="mt-1 text-xs text-[#819095]">Try another filter or check back later.</p></div>
        )}

        {/* Create Event Modal - Admin Only */}
        {isModalOpen && isAdmin && (
          <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-xl border border-surface-container max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
                <h2 className="font-headline-md text-on-surface font-bold">Host a New Event</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container cursor-pointer text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
                <div>
                  <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Alumni Meetup 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                    Location / Venue *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Auditorium Hall or Virtual / Zoom"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                    Event Description
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="What will attendees learn or do?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full resize-y px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isVirtual"
                    checked={isVirtual}
                    onChange={(e) => setIsVirtual(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="isVirtual" className="font-body-sm text-on-surface text-xs font-semibold cursor-pointer">
                    This is an online / virtual event
                  </label>
                </div>

                <div>
                  <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                    Banner Image URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-3 justify-end mt-2 pt-2 border-t border-surface-container">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg font-label-md text-on-surface hover:bg-surface-container cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary/90 font-bold cursor-pointer text-xs disabled:opacity-50"
                  >
                    {isSaving ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
