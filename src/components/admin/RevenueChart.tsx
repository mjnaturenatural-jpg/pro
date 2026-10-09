"use client";

export function RevenueChart({
  data,
}: {
  data: { label: string; revenue: number; orders: number }[];
}) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-bark-500">No revenue data yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const width = Math.max(data.length * 18, 300);

  return (
    <div className="overflow-x-auto">
      <div className="flex h-44 items-end gap-1" style={{ width }}>
        {data.map((d, i) => (
          <div key={i} className="group relative flex-1">
            <div
              className="w-full rounded-t bg-caramel-400 transition group-hover:bg-caramel-500"
              style={{ height: `${Math.max(4, (d.revenue / max) * 160)}px` }}
              title={`${d.label}: ₹${d.revenue.toLocaleString("en-IN")} (${d.orders} orders)`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-bark-400">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
