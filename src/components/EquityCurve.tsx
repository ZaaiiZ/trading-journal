"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  equity: number;
}

export default function EquityCurve({
  data,
  startingCapital,
}: {
  data: DataPoint[];
  startingCapital: number;
}) {
  if (data.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-72 flex items-center justify-center text-zinc-500">
        Aucun trade pour afficher la courbe
      </div>
    );
  }

  const fullData = [{ date: "Début", equity: startingCapital }, ...data];

  const minEquity = Math.min(...fullData.map((d) => d.equity));
  const maxEquity = Math.max(...fullData.map((d) => d.equity));
  const padding = (maxEquity - minEquity) * 0.15 || startingCapital * 0.005;
  const yMin = Math.floor(minEquity - padding);
  const yMax = Math.ceil(maxEquity + padding);

  const gradientOffset = () => {
    const range = yMax - yMin;
    if (range === 0) return 0.5;
    return (yMax - startingCapital) / range;
  };

  const off = Math.max(0, Math.min(1, gradientOffset()));

  const fmtEur = (v: number) =>
    v.toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + "€";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm shadow-lg">
        <p className="text-zinc-400 text-xs mb-1">{label}</p>
        <p className="text-white font-medium">{fmtEur(payload[0].value as number)}</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">
        Courbe de Capital
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={fullData}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="#10b981" stopOpacity={0.35} />
              <stop offset={off} stopColor="#10b981" stopOpacity={0.05} />
              <stop offset={off} stopColor="#ef4444" stopOpacity={0.05} />
              <stop offset={1} stopColor="#ef4444" stopOpacity={0.35} />
            </linearGradient>
            <linearGradient id="equityStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="#10b981" stopOpacity={1} />
              <stop offset={off} stopColor="#ef4444" stopOpacity={1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[yMin, yMax]}
            tickFormatter={fmtEur}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={startingCapital}
            stroke="#3b82f6"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: `${fmtEur(startingCapital)}`,
              position: "left",
              fill: "#3b82f6",
              fontSize: 11,
            }}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="url(#equityStroke)"
            strokeWidth={2.5}
            fill="url(#equityFill)"
            dot={false}
            activeDot={{ r: 5, fill: "#fff", stroke: "#10b981", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
