"use client";

import React, { useState, useEffect } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import { EventItem } from "@/data/mockData";
import { fetchEvents, createEventViaApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function EventsPage() {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "admin";

  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Event Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState("Nov");
  const [day, setDay] = useState("15");
  const [location, setLocation] = useState("");
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
    const eventData: Omit<EventItem, "id"> = {
      title,
      month,
      day,
      location,
      isVirtual,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400",
    };

    try {
      const savedEvent = await createEventViaApi(eventData);
      setEvents([savedEvent, ...events]);
    } catch (err) {
      const fallback: EventItem = { id: `event-${Date.now()}`, ...eventData };
      setEvents([fallback, ...events]);
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
      setTitle("");
      setLocation("");
      setImageUrl("");
    }
  };

  return (
    <LayoutWrapper>
      <div className="flex flex-col w-full px-4 gap-6 mt-4 pb-16 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              University Events
            </h1>
            <p className="font-body-md text-on-surface-variant mt-1">
              Find upcoming professional and social networking events hosted by the alumni community.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="self-start md:self-auto bg-primary text-on-primary hover:bg-primary/95 px-5 py-2.5 rounded-xl font-label-md font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Host an Event
            </button>
          )}
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-2xl shadow-sm border border-dashed border-outline-variant/30 mt-4 flex flex-col items-center justify-center p-6">
            <span className="material-symbols-outlined text-[48px] text-outline opacity-40">event_busy</span>
            <p className="font-headline-md text-on-surface mt-2 font-bold">No Events Scheduled</p>
            <p className="font-body-sm text-on-surface-variant mt-1 max-w-sm">
              There are currently no upcoming events scheduled on the portal.
            </p>
            {isAdmin ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label-md font-bold hover:bg-primary/90 transition-all cursor-pointer"
              >
                Host the First Event
              </button>
            ) : (
              <p className="mt-3 font-body-sm text-outline italic">
                Check back soon for upcoming gatherings and workshops.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300 border border-surface-container"
              >
                <div className="h-44 w-full relative overflow-hidden bg-surface-container">
                  {event.imageUrl ? (
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={event.title}
                      src={event.imageUrl}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/40">
                      <span className="material-symbols-outlined text-[48px]">calendar_month</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-surface-container-lowest/95 backdrop-blur text-on-surface px-3 py-1.5 rounded-lg flex flex-col items-center justify-center min-w-[54px] shadow-md border border-surface-container-high/50">
                    <span className="font-label-sm text-label-sm uppercase text-error text-[11px] font-bold">
                      {event.month}
                    </span>
                    <span className="font-headline-md text-headline-md leading-none mt-1 text-primary">
                      {event.day}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1 gap-4">
                  <h3 className="font-headline-md text-on-surface line-clamp-1 font-bold">
                    {event.title}
                  </h3>
                  
                  <div className="flex flex-col gap-2 text-on-surface-variant font-body-sm text-body-sm mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        {event.isVirtual ? "videocam" : "location_on"}
                      </span>
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2 pt-2 border-t border-surface-container-low">
                    <button
                      onClick={() => {
                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          navigator.clipboard.writeText(`${event.title} - ${event.month} ${event.day} at ${event.location}`);
                        }
                        alert(`Event details copied to clipboard!`);
                      }}
                      className="flex-1 bg-surface-container text-primary hover:bg-surface-container-high transition-colors font-label-md py-2.5 rounded-lg flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer"
                      aria-label="Share Event"
                    >
                      <span className="material-symbols-outlined text-[18px]">share</span>
                      Share Event
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Month
                    </label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Day
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
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
