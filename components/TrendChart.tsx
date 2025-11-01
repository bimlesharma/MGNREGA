'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendChartProps {
  data: any[];
  dataKey: string;
}

export default function TrendChart({ data, dataKey }: TrendChartProps) {
  // Format data for chart
  const chartData = data
    .slice()
    .reverse()
    .map((item) => ({
      month: `${getMonthName(item.month)} ${item.year}`,
      value: item[dataKey] || 0,
    }));

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            angle={-45}
            textAnchor="end"
            height={80}
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis style={{ fontSize: '0.75rem' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0070f3"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function getMonthName(month: number): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return months[month - 1] || '';
}
