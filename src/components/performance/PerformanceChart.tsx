'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataPoint {
  date: string;
  clicks: number;
  impressions: number;
  avgPosition: number;
  avgCtr: number;
}

export function PerformanceChart({ data }: { data: DataPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
    ctrPercent: (d.avgCtr * 100).toFixed(2),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance ao Longo do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              reversed
              tick={{ fontSize: 12 }}
              domain={[0, 50]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="clicks"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
              name="Cliques"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="impressions"
              stroke="#94a3b8"
              strokeWidth={2}
              dot={false}
              name="Impressoes"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgPosition"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Posicao"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
