import { useEffect, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

function ChartFrame({ children, height = 260 }: { children: ReactNode; height?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Skeleton className="w-full rounded-xl" style={{ height }} />;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    fontSize: "12px",
    boxShadow: "var(--shadow-soft)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: "11px" },
};

export function AreaTrend({
  data,
  xKey,
  keys,
  height,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  keys: { key: string; color: string }[];
  height?: number;
}) {
  return (
    <ChartFrame height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {keys.map((k) => (
            <linearGradient key={k.key} id={`grad-${k.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={k.color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={k.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} />
        <Tooltip {...tooltipStyle} cursor={{ stroke: "var(--color-border)" }} />
        {keys.map((k) => (
          <Area
            key={k.key}
            type="monotone"
            dataKey={k.key}
            stroke={k.color}
            strokeWidth={2}
            fill={`url(#grad-${k.key})`}
          />
        ))}
      </AreaChart>
    </ChartFrame>
  );
}

export function BarTrend({
  data,
  xKey,
  dataKey,
  height,
  horizontal,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  dataKey: string;
  height?: number;
  horizontal?: boolean;
}) {
  return (
    <ChartFrame height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 8, left: horizontal ? 24 : -18, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axis} />
            <YAxis type="category" dataKey={xKey} width={110} {...axis} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axis} />
            <YAxis {...axis} />
          </>
        )}
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
        <Bar dataKey={dataKey} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={`var(--color-chart-${(i % 5) + 1})`} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

export function LineTrend({
  data,
  xKey,
  dataKey,
  height,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  dataKey: string;
  height?: number;
}) {
  return (
    <ChartFrame height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} />
        <Tooltip {...tooltipStyle} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="var(--color-chart-1)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--color-chart-1)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartFrame>
  );
}
