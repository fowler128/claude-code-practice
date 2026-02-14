import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentOpsApi } from '../services/api';
import type { ContentCalendarEntry } from '@shared/types';

export default function ContentCalendarPage() {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Start from 7 days ago
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Show next 30 days
    return date.toISOString().split('T')[0];
  });

  const { data: calendarEntries, isLoading } = useQuery<any[]>({
    queryKey: ['content-calendar', startDate, endDate],
    queryFn: () => contentOpsApi.getCalendar({ start_date: startDate, end_date: endDate }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      contentOpsApi.updateCalendarEntry(id, { publish_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-calendar'] });
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      publishing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      published: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      linkedin: '💼',
      tiktok: '🎵',
      twitter: '🐦',
      instagram: '📷',
      youtube: '▶️',
    };
    return icons[platform] || '📱';
  };

  const groupByDate = (entries: any[]) => {
    const grouped: Record<string, any[]> = {};
    entries?.forEach((entry) => {
      const date = new Date(entry.scheduled_for).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });
    return grouped;
  };

  const groupedEntries = groupByDate(calendarEntries || []);
  const dates = Object.keys(groupedEntries).sort();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
        <p className="text-gray-600 mt-1">Schedule and track content publication</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="ml-auto">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
              + Schedule Content
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-700 mb-1">Scheduled</div>
          <div className="text-2xl font-bold text-blue-900">
            {calendarEntries?.filter((e) => e.publish_status === 'scheduled').length || 0}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-sm text-yellow-700 mb-1">Publishing</div>
          <div className="text-2xl font-bold text-yellow-900">
            {calendarEntries?.filter((e) => e.publish_status === 'publishing').length || 0}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-700 mb-1">Published</div>
          <div className="text-2xl font-bold text-green-900">
            {calendarEntries?.filter((e) => e.publish_status === 'published').length || 0}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-sm text-red-700 mb-1">Failed</div>
          <div className="text-2xl font-bold text-red-900">
            {calendarEntries?.filter((e) => e.publish_status === 'failed').length || 0}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-700 mb-1">Cancelled</div>
          <div className="text-2xl font-bold text-gray-900">
            {calendarEntries?.filter((e) => e.publish_status === 'cancelled').length || 0}
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading calendar...</div>
        </div>
      ) : dates.length > 0 ? (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {groupedEntries[date]
                  .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
                  .map((entry) => (
                    <div key={entry.calendar_id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getPlatformIcon(entry.platform)}</span>
                            <span className="font-semibold text-gray-900">{entry.platform}</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(entry.publish_status)}`}>
                              {entry.publish_status}
                            </span>
                            {entry.lane && (
                              <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                                {entry.lane}
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            Scheduled: {new Date(entry.scheduled_for).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>

                          {entry.hook_1 && (
                            <div className="text-sm text-gray-900 mb-2">
                              <strong>Hook:</strong> {entry.hook_1}
                            </div>
                          )}

                          {entry.sku && (
                            <div className="text-xs text-gray-500">
                              SKU: {entry.sku}
                            </div>
                          )}

                          {entry.publish_url && (
                            <div className="mt-2">
                              <a
                                href={entry.publish_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View Published Content →
                              </a>
                            </div>
                          )}

                          {entry.publish_error && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              <strong>Error:</strong> {entry.publish_error}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          {entry.publish_status === 'scheduled' && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: entry.calendar_id,
                                    status: 'publishing',
                                  })
                                }
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                Publish Now
                              </button>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: entry.calendar_id,
                                    status: 'cancelled',
                                  })
                                }
                                className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {entry.publish_status === 'failed' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: entry.calendar_id,
                                  status: 'scheduled',
                                })
                              }
                              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No content scheduled for this date range</p>
        </div>
      )}
    </div>
  );
}
