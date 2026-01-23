'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { FilingItem, isFilingOverdue, getHoursPending, formatDate } from '@/types/filing';
import { getFilings } from '@/lib/filings';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [filings, setFilings] = useState<FilingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilings();
  }, []);

  async function loadFilings() {
    setLoading(true);
    const data = await getFilings();
    setFilings(data);
    setLoading(false);
  }

  // Calculate stats
  const pendingCount = filings.filter(f => f.status === 'Pending').length;
  const acceptedCount = filings.filter(f => f.status === 'Accepted').length;
  const rejectedCount = filings.filter(f => f.status === 'Rejected').length;
  const draftCount = filings.filter(f => f.status === 'Draft').length;
  const overdueFilings = filings.filter(isFilingOverdue);

  // Governance Score (EDGE methodology)
  const totalNonDraft = filings.filter(f => f.status !== 'Draft').length;
  const governanceScore = totalNonDraft > 0
    ? Math.max(0, Math.min(100, Math.round((acceptedCount / totalNonDraft) * 100 - overdueFilings.length * 5)))
    : 100;

  const recentFilings = [...filings]
    .sort((a, b) => new Date(b.lastCheckedAt).getTime() - new Date(a.lastCheckedAt).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Track your filings across Texas counties</p>
      </div>

      {/* Stats Grid (Bento Box) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending"
          count={pendingCount}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Accepted"
          count={acceptedCount}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Drafts"
          count={draftCount}
          icon={FileText}
          color="gray"
        />
        <StatCard
          title="Rejected"
          count={rejectedCount}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Governance Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">EDGE Governance Score</h2>
          </div>
          <span className={cn(
            "text-2xl font-bold",
            governanceScore >= 80 ? "text-green-600" :
            governanceScore >= 60 ? "text-yellow-600" :
            governanceScore >= 40 ? "text-orange-600" : "text-red-600"
          )}>
            {governanceScore}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={cn(
              "h-3 rounded-full transition-all duration-500",
              governanceScore >= 80 ? "bg-green-500" :
              governanceScore >= 60 ? "bg-yellow-500" :
              governanceScore >= 40 ? "bg-orange-500" : "bg-red-500"
            )}
            style={{ width: `${governanceScore}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Based on Accepted vs Overdue filings ratio
        </p>
      </div>

      {/* Overdue Alerts */}
      {overdueFilings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Overdue Alerts</h2>
          </div>
          <div className="space-y-3">
            {overdueFilings.map(filing => (
              <div
                key={filing.id}
                className="flex items-center justify-between bg-white rounded-lg p-4 border border-red-200"
              >
                <div>
                  <p className="font-medium text-gray-900">{filing.title}</p>
                  <p className="text-sm text-red-600">
                    Pending for {getHoursPending(filing)} hours
                  </p>
                </div>
                <span className="text-sm text-gray-500">{filing.county} County</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Filings */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Filings</h2>
          <Link
            href="/filings"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            View all
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentFilings.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No filings yet. Create your first filing to get started.
            </div>
          ) : (
            recentFilings.map(filing => (
              <FilingRow key={filing.id} filing={filing} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  count,
  icon: Icon,
  color,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
  color: 'orange' | 'green' | 'gray' | 'red';
}) {
  const colorClasses = {
    orange: 'text-orange-600 bg-orange-50',
    green: 'text-green-600 bg-green-50',
    gray: 'text-gray-600 bg-gray-50',
    red: 'text-red-600 bg-red-50',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={cn("inline-flex p-2 rounded-lg mb-3", colorClasses[color])}>
        <Icon size={20} />
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className={cn("text-2xl font-bold", `text-${color}-600`)}>{count}</p>
    </div>
  );
}

// Filing Row Component
function FilingRow({ filing }: { filing: FilingItem }) {
  const isOverdue = isFilingOverdue(filing);

  const statusColors: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-700',
    Pending: isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700',
    Accepted: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{filing.title}</p>
            {isOverdue && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
          <p className="text-sm text-gray-500">
            {filing.county} County • {formatDate(filing.submittedAt)}
          </p>
        </div>
      </div>
      <span className={cn(
        "px-3 py-1 rounded-full text-xs font-medium",
        statusColors[filing.status]
      )}>
        {isOverdue ? 'OVERDUE' : filing.status}
      </span>
    </div>
  );
}
