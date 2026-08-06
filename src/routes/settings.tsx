import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, Pill } from "@/components/nox/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { employees, venue } from "@/data/demo";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NOX OS" },
      { name: "description", content: "Business information, branches, users, permissions and notifications." },
      { property: "og:title", content: "Settings — NOX OS" },
      { property: "og:description", content: "Business, branches, users and notification settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  return (
    <AppShell title="Settings" description="Configure your venue, team and notifications.">
      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-6">
          <Panel title="Business information" subtitle="Shown on tickets and receipts">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Legal name</Label>
                <Input defaultValue="NOX Entertainment SA" />
              </div>
              <div className="grid gap-2">
                <Label>Trading name</Label>
                <Input defaultValue={venue.name} />
              </div>
              <div className="grid gap-2">
                <Label>Tax ID</Label>
                <Input defaultValue="30-71455821-4" />
              </div>
              <div className="grid gap-2">
                <Label>City</Label>
                <Input defaultValue={venue.city} />
              </div>
            </div>
            <Button className="mt-6" onClick={() => toast.success("Business information saved.")}>
              Save changes
            </Button>
          </Panel>
        </TabsContent>

        <TabsContent value="branches" className="mt-6">
          <Panel title="Branches" subtitle="3 venues connected">
            <ul className="divide-y divide-border">
              {[
                ["Palermo Soho", "1,200 capacity", "primary"],
                ["Costanera Norte", "800 capacity", "muted"],
                ["Rooftop Recoleta", "350 capacity", "muted"],
              ].map(([name, cap, tone]) => (
                <li key={name} className="row-hover flex items-center justify-between px-2 py-4">
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{cap}</p>
                  </div>
                  <Pill tone={tone as "primary" | "muted"}>
                    {tone === "primary" ? "Active" : "Connected"}
                  </Pill>
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Panel title="Users & permissions" subtitle="Who can access NOX OS">
            <ul className="divide-y divide-border">
              {employees.slice(0, 6).map((e) => (
                <li key={e.id} className="row-hover flex items-center justify-between px-2 py-4">
                  <div>
                    <p className="text-sm font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.email}</p>
                  </div>
                  <Pill tone={e.role.includes("Manager") ? "primary" : "muted"}>{e.role}</Pill>
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Panel title="Your profile" subtitle={user?.email ?? ""}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Full name</Label>
                <Input defaultValue={user?.name ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input defaultValue={user?.email ?? ""} />
              </div>
            </div>
            <Button className="mt-6" onClick={() => toast.success("Profile updated.")}>
              Update profile
            </Button>
          </Panel>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Panel title="Notifications" subtitle="Choose what reaches you at 2am">
            <ul className="space-y-5">
              {[
                ["Critical stock alerts", "When a product drops below its minimum."],
                ["Duplicate scans", "When the door flags a repeated QR code."],
                ["Sold out events", "When an event sells its last ticket."],
                ["Nightly summary", "A revenue recap every morning at 9am."],
              ].map(([title, body], i) => (
                <li key={title} className="flex items-center justify-between gap-6">
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{body}</p>
                  </div>
                  <Switch defaultChecked={i !== 3} />
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
