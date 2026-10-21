interface StatCardProps {
  title: string;
  value: string;
  suffix?: string;
  subtitle?: string;
  trend?: "positive" | "negative" | "neutral";
}

export default function StatCard({ title, value, suffix, subtitle, trend = "neutral" }: StatCardProps) {
  const color =
    trend === "positive" ? "text-emerald-400" :
    trend === "negative" ? "text-red-400" :
    "text-white";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-sm text-zinc-400 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>
        {value}
        {suffix && <span className="text-sm font-normal text-zinc-500 ml-1">{suffix}</span>}
      </p>
      {subtitle && <p className={`text-sm mt-1 ${color}`}>{subtitle}</p>}
    </div>
  );
}
