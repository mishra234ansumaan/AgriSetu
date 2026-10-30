"use client";

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  CartesianGrid,
} from "recharts";

export interface PricePoint {
  date: string;
  modalP: number;
  label?: string;
}

export function PriceAreaChart({
  data,
  color = "#3e9b4f",
  height = 300,
}: {
  data: PricePoint[];
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id={`pg-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="#16281f" strokeOpacity={0.08} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#16281f", opacity: 0.5 }}
          tickLine={false}
          axisLine={false}
          minTickGap={28}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#16281f", opacity: 0.5 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => "₹" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v)}
          domain={["auto", "auto"]}
        />
        <Tooltip
          cursor={{ stroke: "#16281f", strokeOpacity: 0.15, strokeDasharray: "4 4" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="rounded-xl border border-forest-900/10 bg-white/95 px-3 py-2 text-xs shadow-lg">
                <p className="font-semibold text-forest-950">{label}</p>
                <p className="tnum text-clay-600">
                  Modal ₹{Number(payload[0].value).toLocaleString("en-IN")}/q
                </p>
              </div>
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="modalP"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#pg-${color})`}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DecayChart({
  data,
  elapsed,
  height = 280,
}: {
  data: { day: number; open: number; actual: number }[];
  elapsed: number;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="#f6f2e7" strokeOpacity={0.12} vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "#f6f2e7", opacity: 0.5 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(d: number) => "Day " + d}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#f6f2e7", opacity: 0.5 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => v + "%"}
          domain={[0, 100]}
        />
        <Tooltip
          cursor={{ stroke: "#f6f2e7", strokeOpacity: 0.2 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="rounded-xl border border-white/10 bg-forest-950/95 px-3 py-2 text-xs text-paper shadow-lg">
                <p className="font-semibold">Day {label}</p>
                {payload.map((p) => (
                  <p key={p.dataKey as string} className="tnum" style={{ color: p.color }}>
                    {p.dataKey === "actual" ? "Your storage" : "Open air"}: {p.value}% fresh
                  </p>
                ))}
              </div>
            ) : null
          }
        />
        <Line type="monotone" dataKey="open" stroke="#d9622b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        <Line type="monotone" dataKey="actual" stroke="#63b26e" strokeWidth={3} dot={false} />
        {data.map((p) =>
          p.day === elapsed ? (
            <ReferenceDot key="now" x={p.day} y={p.actual} r={7} fill="#f2c14e" stroke="#0e2f24" strokeWidth={2} />
          ) : null,
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Spark({ data, color = "#3e9b4f" }: { data: number[]; color?: string }) {
  const pts = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={pts} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sp-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#sp-${color.replace("#", "")})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
