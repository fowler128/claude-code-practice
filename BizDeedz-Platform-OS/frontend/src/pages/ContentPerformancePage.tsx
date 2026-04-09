import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentOpsApi } from '../services/api';

export default function ContentPerformancePage() {
  const [sortBy, setSortBy] = useState<'performance_score' | 'measured_at'>('performance_score');

  const { data: performanceData, isLoading } = useQuery<any[]>({
    queryKey: ['content-performance'],
    queryFn: () => contentOpsApi.getPerformance(),
  });

  const sortedData = performanceData
    ? [...performanceData].sort((a, b) => {
        if (sortBy === 'performance_score') {
          return (b.performance_score || 0) - (a.performance_score || 0);
        } else {
          return new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime();
        }
      })
    : [];

  const calculateEngagementRate = (data: any) => {
    if (!data.impressions || data.impressions === 0) return 0;
    const totalEngagements = (data.saves || 0) + (data.comments || 0) + (data.likes || 0) + (data.shares || 0);
    return ((totalEngagements / data.impressions) * 100).toFixed(2);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Content Performance</h1>
        <p className="text-gray-600 mt-1">Track engagement metrics and business outcomes</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'performance_score' | 'measured_at')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="performance_score">Performance Score (High to Low)</option>
              <option value="measured_at">Most Recent</option>
            </select>
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
            + Log Performance
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {performanceData && performanceData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-700 mb-1">Total Impressions</div>
            <div className="text-2xl font-bold text-purple-900">
              {performanceData.reduce((sum, d) => sum + (d.impressions || 0), 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-700 mb-1">Total Conversions</div>
            <div className="text-2xl font-bold text-green-900">
              {performanceData.reduce((sum, d) => sum + (d.conversions || 0), 0)}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-700 mb-1">Total Calls Booked</div>
            <div className="text-2xl font-bold text-blue-900">
              {performanceData.reduce((sum, d) => sum + (d.calls || 0), 0)}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-orange-700 mb-1">Total DMs</div>
            <div className="text-2xl font-bold text-orange-900">
              {performanceData.reduce((sum, d) => sum + (d.dms || 0), 0)}
            </div>
          </div>
        </div>
      )}

      {/* Performance Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading performance data...</div>
        </div>
      ) : sortedData.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lane
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Eng. Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saves
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DMs
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calls
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conv.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Measured
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((item, idx) => (
                  <tr key={item.performance_id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.platform}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.lane}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-right text-purple-600">
                      {Math.round(item.performance_score || 0)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {(item.impressions || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                      {calculateEngagementRate(item)}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {item.saves || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {item.comments || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {item.shares || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-orange-600">
                      {item.dms || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                      {item.calls || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                      {item.conversions || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.measured_at
                        ? new Date(item.measured_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed View - Expandable Rows (Future Enhancement) */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            <p>
              Performance Score Formula: (Impressions × 0.1) + (Saves × 5) + (Comments × 3) + (Likes × 1) +
              (Shares × 10) + (DMs × 20) + (Calls × 100) + (Conversions × 500)
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No performance data logged yet</p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Log Your First Performance Entry
          </button>
        </div>
      )}

      {/* Performance Insights */}
      {sortedData.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Performing Platform */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Best Performing Platform</h3>
            {(() => {
              const platformScores: Record<string, number> = {};
              sortedData.forEach((item) => {
                if (!platformScores[item.platform]) platformScores[item.platform] = 0;
                platformScores[item.platform] += item.performance_score || 0;
              });
              const bestPlatform = Object.entries(platformScores).sort((a, b) => b[1] - a[1])[0];
              return (
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">{bestPlatform[0]}</div>
                  <div className="text-sm text-gray-600">
                    Total Score: {Math.round(bestPlatform[1]).toLocaleString()}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Best Performing Lane */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Best Performing Lane</h3>
            {(() => {
              const laneScores: Record<string, number> = {};
              sortedData.forEach((item) => {
                if (!laneScores[item.lane]) laneScores[item.lane] = 0;
                laneScores[item.lane] += item.performance_score || 0;
              });
              const bestLane = Object.entries(laneScores).sort((a, b) => b[1] - a[1])[0];
              return (
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-1 capitalize">{bestLane[0]}</div>
                  <div className="text-sm text-gray-600">
                    Total Score: {Math.round(bestLane[1]).toLocaleString()}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
