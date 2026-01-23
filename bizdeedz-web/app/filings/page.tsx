'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  X
} from 'lucide-react';
import {
  FilingItem,
  FilingStatus,
  FilingFormType,
  TEXAS_COUNTIES,
  FILING_FORM_TYPES,
  isFilingOverdue,
  formatDate,
  isTexasCourtHoliday
} from '@/types/filing';
import { getFilings, createFiling, deleteFiling } from '@/lib/filings';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: (FilingStatus | 'All')[] = ['All', 'Draft', 'Pending', 'Accepted', 'Rejected'];

export default function FilingsPage() {
  const searchParams = useSearchParams();
  const [filings, setFilings] = useState<FilingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilingStatus | 'All'>('All');
  const [showNewFilingModal, setShowNewFilingModal] = useState(false);

  useEffect(() => {
    loadFilings();
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowNewFilingModal(true);
    }
  }, [searchParams]);

  async function loadFilings() {
    setLoading(true);
    const data = await getFilings();
    setFilings(data);
    setLoading(false);
  }

  async function handleCreateFiling(data: {
    title: string;
    county: string;
    formType: FilingFormType;
    caseNumber?: string;
    notes?: string;
    submitImmediately?: boolean;
  }) {
    await createFiling(data);
    await loadFilings();
    setShowNewFilingModal(false);
  }

  async function handleDeleteFiling(id: string) {
    if (confirm('Are you sure you want to delete this filing?')) {
      await deleteFiling(id);
      await loadFilings();
    }
  }

  // Filter filings
  const filteredFilings = filings.filter(filing => {
    const matchesSearch = searchQuery === '' ||
      filing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      filing.county.toLowerCase().includes(searchQuery.toLowerCase()) ||
      filing.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || filing.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Filings</h1>
          <p className="text-gray-500">{filings.length} total filings</p>
        </div>
        <button
          onClick={() => setShowNewFilingModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          New Filing
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search filings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {STATUS_FILTERS.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors",
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Filings List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredFilings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No filings found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Create your first filing to get started'}
          </p>
          <button
            onClick={() => setShowNewFilingModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            New Filing
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    County
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFilings.map(filing => (
                  <FilingTableRow
                    key={filing.id}
                    filing={filing}
                    onDelete={() => handleDeleteFiling(filing.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Filing Modal */}
      {showNewFilingModal && (
        <NewFilingModal
          onClose={() => setShowNewFilingModal(false)}
          onSubmit={handleCreateFiling}
        />
      )}
    </div>
  );
}

// Filing Table Row
function FilingTableRow({
  filing,
  onDelete
}: {
  filing: FilingItem;
  onDelete: () => void;
}) {
  const isOverdue = isFilingOverdue(filing);

  const statusColors: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-700',
    Pending: isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700',
    Accepted: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{filing.title}</span>
          {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
        </div>
        {filing.caseNumber && (
          <span className="text-sm text-gray-500">Case: {filing.caseNumber}</span>
        )}
      </td>
      <td className="px-6 py-4 text-gray-500">{filing.county}</td>
      <td className="px-6 py-4 text-gray-500">{filing.metadata.formType}</td>
      <td className="px-6 py-4">
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          statusColors[filing.status]
        )}>
          {isOverdue ? 'OVERDUE' : filing.status}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-500">{formatDate(filing.submittedAt)}</td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

// New Filing Modal
function NewFilingModal({
  onClose,
  onSubmit
}: {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    county: string;
    formType: FilingFormType;
    caseNumber?: string;
    notes?: string;
    submitImmediately?: boolean;
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [county, setCounty] = useState(TEXAS_COUNTIES[0]);
  const [formType, setFormType] = useState<FilingFormType>(FILING_FORM_TYPES[0]);
  const [caseNumber, setCaseNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitImmediately, setSubmitImmediately] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isHoliday = isTexasCourtHoliday(new Date());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    await onSubmit({
      title: title.trim(),
      county,
      formType,
      caseNumber: caseNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      submitImmediately,
    });
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">New Filing</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filing Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Change in Ownership - 123 Oak St"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  County *
                </label>
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {TEXAS_COUNTIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Type *
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as FilingFormType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {FILING_FORM_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Case Number (Optional)
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="e.g., 2026-CV-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes about this filing..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="submitImmediately"
                checked={submitImmediately}
                onChange={(e) => setSubmitImmediately(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="submitImmediately" className="text-sm text-gray-700">
                Submit immediately (start tracking)
              </label>
            </div>

            {submitImmediately && isHoliday && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-700">
                  Today is a Texas Court Holiday. Your filing may be delayed.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : submitImmediately ? 'Submit Filing' : 'Save Draft'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
