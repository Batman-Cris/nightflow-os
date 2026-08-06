import { createFileRoute } from "@tanstack/react-router";
import { IdCard } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, Pill, StatCard } from "@/components/nox/primitives";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currency, employees } from "@/data/demo";

export const Route = createFileRoute("/employees")({
  head: () => ({
    meta: [
      { title: "Employees — NOX OS" },
      { name: "description", content: "Staff roles, permissions, shifts and attendance for every night." },
      { property: "og:title", content: "Employees — NOX OS" },
      { property: "og:description", content: "Roles, shifts and attendance for your team." },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const onShift = employees.filter((e) => e.status === "on-shift").length;
  return (
    <AppShell title="Employees" description="Who is working tonight, and how they are performing.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Team members" value={String(employees.length)} icon={IdCard} />
        <StatCard label="On shift now" value={String(onShift)} icon={IdCard} hint="live" />
        <StatCard label="Avg attendance" value="93%" delta={1.8} icon={IdCard} />
        <StatCard label="Labour cost tonight" value={currency(2410)} delta={-3.1} icon={IdCard} />
      </div>

      <Panel className="mt-6" title="Staff" subtitle={`${employees.length} people`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Hourly</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((e) => (
              <TableRow key={e.id} className="row-hover">
                <TableCell>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.email}</p>
                </TableCell>
                <TableCell className="text-sm">{e.role}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{e.shift}</TableCell>
                <TableCell className="w-40">
                  <Progress value={e.attendance} className="h-1.5" />
                  <span className="mt-1 block text-[11px] text-muted-foreground">{e.attendance}%</span>
                </TableCell>
                <TableCell>{currency(e.hourly)}</TableCell>
                <TableCell>
                  <Pill tone={e.status === "on-shift" ? "success" : e.status === "break" ? "warning" : "muted"}>
                    {e.status}
                  </Pill>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
