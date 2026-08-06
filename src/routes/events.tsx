import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, Pill, StatCard } from "@/components/nox/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currency, events as seed } from "@/data/demo";
import type { EventStatus, NoxEvent } from "@/types/nox";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — NOX OS" },
      {
        name: "description",
        content: "Plan, publish and track every night: capacity, ticket sales, attendance and revenue.",
      },
      { property: "og:title", content: "Events — NOX OS" },
      { property: "og:description", content: "Plan and track every night at your venue." },
    ],
  }),
  component: EventsPage,
});

const statusTone: Record<EventStatus, "success" | "primary" | "warning" | "muted" | "danger"> = {
  live: "danger",
  scheduled: "primary",
  "sold-out": "success",
  draft: "warning",
  finished: "muted",
};

function EventsPage() {
  const [rows, setRows] = useState<NoxEvent[]>(seed);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", artist: "", date: "", capacity: "600" });

  const filtered = rows.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.artist.toLowerCase().includes(query.toLowerCase()),
  );

  const totalRevenue = rows.reduce((s, e) => s + e.revenue, 0);
  const totalTickets = rows.reduce((s, e) => s + e.ticketsSold, 0);

  function createEvent() {
    if (!form.name) {
      toast.error("Give the event a name first.");
      return;
    }
    const event: NoxEvent = {
      id: `evt_${Math.random().toString(36).slice(2, 7)}`,
      name: form.name,
      artist: form.artist || "TBA",
      date: form.date || new Date().toISOString(),
      genre: "Techno",
      room: "Main Room",
      capacity: Number(form.capacity) || 600,
      attendance: 0,
      ticketsSold: 0,
      revenue: 0,
      status: "draft",
    };
    setRows((r) => [event, ...r]);
    setOpen(false);
    setForm({ name: "", artist: "", date: "", capacity: "600" });
    toast.success(`${event.name} created as a draft.`);
  }

  return (
    <AppShell
      title="Events"
      description="Every night you run, from draft to sold out."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 size-4" /> New event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create event</DialogTitle>
              <DialogDescription>It will be saved as a draft until you publish it.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Event name</Label>
                <Input
                  id="name"
                  placeholder="Neon Cathedral"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="artist">Headliner</Label>
                <Input
                  id="artist"
                  placeholder="AMELIE LENS"
                  value={form.artist}
                  onChange={(e) => setForm({ ...form, artist: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cap">Capacity</Label>
                  <Input
                    id="cap"
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createEvent}>Create event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Events" value={String(rows.length)} icon={CalendarDays} hint="this quarter" />
        <StatCard label="Tickets sold" value={totalTickets.toLocaleString()} delta={14.2} icon={CalendarDays} />
        <StatCard label="Gross revenue" value={currency(totalRevenue)} delta={21.7} icon={CalendarDays} />
        <StatCard label="Avg sell-through" value="82%" delta={5.1} icon={CalendarDays} />
      </div>

      <Panel
        className="mt-6"
        title="All events"
        subtitle={`${filtered.length} events`}
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-56 pl-9"
            />
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id} className="row-hover">
                <TableCell>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.artist} · {e.genre}
                  </p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(e.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-sm">{e.room}</TableCell>
                <TableCell className="w-44">
                  <Progress value={(e.ticketsSold / e.capacity) * 100} className="h-1.5" />
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {e.ticketsSold} / {e.capacity}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{currency(e.revenue)}</TableCell>
                <TableCell>
                  <Pill tone={statusTone[e.status]}>{e.status}</Pill>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info(`Editing ${e.name}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setRows((r) => r.filter((x) => x.id !== e.id));
                      toast.success(`${e.name} deleted.`);
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
