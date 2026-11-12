"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  MessageSquare,
  Search,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { adminApi, ApiError, SupportTicketRecord } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketRecord | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listTickets({
        q: query || undefined,
        status: statusFilter || undefined,
      });
      setTickets(res.tickets);
      if (res.tickets.length > 0 && !selectedTicket) {
        setSelectedTicket(res.tickets[0]);
      } else if (selectedTicket) {
        const updated = res.tickets.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter, selectedTicket]);

  useEffect(() => {
    void Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    setError(null);
    setSending(true);
    try {
      await adminApi.replyTicket(selectedTicket.id, replyText.trim());
      setReplyText("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") => {
    if (!selectedTicket) return;
    await adminApi.updateTicketStatus(selectedTicket.id, { status: newStatus });
    await load();
  };

  return (
    <AdminShell
      title="Customer Support & WhatsApp Queries"
      subtitle="Live tickets automatically created from WhatsApp customer conversations"
      onRefresh={load}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-180px)] min-h-[600px]">
        {/* Ticket List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ticket #, phone, name..."
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto text-xs">
              {["", "OPEN", "IN_PROGRESS", "RESOLVED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors shrink-0 cursor-pointer ${
                    statusFilter === st
                      ? "bg-[#090D16] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st || "All"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No support tickets yet.</p>
                <p className="text-[11px] text-slate-400">
                  When users type &quot;help&quot;, &quot;issue&quot;, or &quot;talk to human&quot; on WhatsApp, tickets appear here.
                </p>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full p-4 text-left transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected ? "bg-slate-50 border-l-2 border-[#00D084]" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#090D16]">
                          {t.ticketNumber}
                        </span>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="text-xs font-semibold text-[#090D16] truncate">
                        {t.customerName || t.phoneNumber}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{t.lastMessage}</p>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatDateTime(t.updatedAt).split(",")[0]}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Ticket Chat & Actions Pane (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-[#090D16]">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className="text-xs text-slate-500">• {selectedTicket.issueCategory}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{selectedTicket.customerName}</span>
                    <span>({selectedTicket.phoneNumber})</span>
                    <a
                      href={`https://wa.me/${selectedTicket.phoneNumber.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#00B875] hover:underline font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open WhatsApp
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedTicket.status !== "RESOLVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange("RESOLVED")}
                      className="text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Mark Resolved
                    </Button>
                  )}
                  {selectedTicket.status === "RESOLVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange("IN_PROGRESS")}
                      className="text-xs"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Reopen
                    </Button>
                  )}
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((m) => {
                    const isCust = m.sender === "CUSTOMER";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isCust ? "items-start" : "items-end"}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 shadow-xs ${
                            isCust
                              ? "bg-white text-[#090D16] border border-slate-200/80 rounded-tl-xs"
                              : "bg-[#090D16] text-white rounded-tr-xs"
                          }`}
                        >
                          <div
                            className={`text-[10px] font-semibold ${
                              isCust ? "text-slate-400" : "text-emerald-400"
                            }`}
                          >
                            {isCust ? selectedTicket.customerName || "Customer" : "Vode Support"}
                          </div>
                          <p className="whitespace-pre-wrap">{m.message}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {formatDateTime(m.createdAt)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No message history recorded.
                  </div>
                )}
              </div>

              {/* Error feedback */}
              {error && (
                <div className="px-5 py-2 bg-red-50 text-red-700 text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="p-3.5 border-t border-slate-100 flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official WhatsApp reply to customer..."
                  className="flex-1 text-xs"
                />
                <Button type="submit" disabled={sending || !replyText.trim()} size="sm">
                  <Send className="w-3.5 h-3.5" />
                  {sending ? "Sending..." : "Reply via WhatsApp"}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-medium text-[#090D16]">Select a Ticket to Review</p>
              <p className="text-xs max-w-sm">
                Customer questions, complaints, or fraud reports sent through WhatsApp will display here.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

