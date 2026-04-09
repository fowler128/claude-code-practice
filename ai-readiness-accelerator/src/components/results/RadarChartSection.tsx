/**
 * RadarChartSection Component
 *
 * Displays pillar scores in a radar/spider chart visualization
 * using Recharts library.
 */

import React, { memo, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { Card } from '../ui';

/**
 * Individual pillar score for the radar chart
 */
export interface PillarScoreData {
  /** Display name of the pillar */
  name: string;
  /** Score value (0-100) */
  score: number;
}

export interface RadarChartSectionProps {
  /** Array of pillar scores to display */
  pillarScores: PillarScoreData[];
}

/**
 * Custom tooltip component for the radar chart
 */
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload: PillarScoreData }>;
}> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-indigo-600 font-semibold">{data.score}%</p>
      </div>
    );
  }
  return null;
};

/**
 * RadarChartSection displays pillar maturity scores in a radar chart.
 * Uses an indigo/purple color theme for visual consistency with the app design.
 * Includes proper accessibility considerations for data visualization.
 */
export const RadarChartSection: React.FC<RadarChartSectionProps> = memo(({ pillarScores }) => {
  // Memoize chart data transformation
  const chartData = useMemo(() => {
    return pillarScores.map(pillar => ({
      ...pillar,
      // Ensure scores are within valid range
      score: Math.max(0, Math.min(100, Math.round(pillar.score))),
      // Full mark for the outer ring
      fullMark: 100,
    }));
  }, [pillarScores]);

  // Handle empty data gracefully
  if (!pillarScores || pillarScores.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Maturity Radar
        </h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No pillar scores available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Maturity Radar
      </h3>

      {/* Screen reader accessible data summary */}
      <div className="sr-only">
        <h4>Pillar Scores Summary</h4>
        <ul>
          {chartData.map(pillar => (
            <li key={pillar.name}>
              {pillar.name}: {pillar.score} out of 100
            </li>
          ))}
        </ul>
      </div>

      {/* Radar Chart */}
      <div className="h-80" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="70%"
            data={chartData}
          >
            <PolarGrid
              gridType="polygon"
              stroke="#e5e7eb"
            />
            <PolarAngleAxis
              dataKey="name"
              tick={{
                fill: '#4b5563',
                fontSize: 12,
                fontWeight: 500,
              }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{
                fill: '#9ca3af',
                fontSize: 10,
              }}
              tickCount={5}
              axisLine={false}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.3}
              strokeWidth={2}
              dot={{
                r: 4,
                fill: '#6366f1',
                strokeWidth: 0,
              }}
              activeDot={{
                r: 6,
                fill: '#4f46e5',
                strokeWidth: 0,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / Score list for smaller viewports */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {chartData.map(pillar => (
          <div
            key={pillar.name}
            className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded text-sm"
          >
            <span className="text-gray-600 truncate mr-2">{pillar.name}</span>
            <span className="font-semibold text-indigo-600">{pillar.score}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
});

RadarChartSection.displayName = 'RadarChartSection';

export default RadarChartSection;
