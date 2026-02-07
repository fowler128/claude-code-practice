import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { mattersApi, controlledListsApi } from '../services/api';
import { Plus, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import CreateMatterModal from '../components/CreateMatterModal';

export default function MattersPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [practiceAreaFilter, setPracticeAreaFilter] = useState('');

  const { data: mattersData, isLoading } = useQuery({
    queryKey: ['matters', { status: statusFilter, practice_area_id: practiceAreaFilter }],
    queryFn: () =>
      mattersApi.getAll({
        status: statusFilter || undefined,
        practice_area_id: practiceAreaFilter || undefined,
      }),
  });

  const { data: practiceAreas } = useQuery({
    queryKey: ['practice-areas'],
    queryFn: controlledListsApi.getPracticeAreas,
  });

  const matters = mattersData?.matters || [];

  const filteredMatters = matters.filter((matter: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      matter.matter_number?.toLowerCase().includes(search) ||
      matter.client_name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Matters</h1>
          <p className="mt-1 text-gray-600">Manage all client matters</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          New Matter
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Matter number or client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">
              <Filter className="w-4 h-4 inline mr-1" />
              Practice Area
            </label>
            <select
              value={practiceAreaFilter}
              onChange={(e) => setPracticeAreaFilter(e.target.value)}
              className="input"
            >
              <option value="">All Practice Areas</option>
              {practiceAreas?.map((pa: any) => (
                <option key={pa.practice_area_id} value={pa.practice_area_id}>
                  {pa.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="new_lead">New Lead</option>
              <option value="intake">Intake</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matters List */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <p className="mt-2 text-sm text-gray-600">Loading matters...</p>
          </div>
        ) : filteredMatters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No matters found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matter #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Practice Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opened
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMatters.map((matter: any) => (
                  <tr key={matter.matter_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/matters/${matter.matter_id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {matter.matter_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{matter.client_name}</div>
                      {matter.client_entity && (
                        <div className="text-xs text-gray-500">{matter.client_entity}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="badge badge-info">{matter.practice_area_name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{matter.status}</span>
                      <div className="text-xs text-gray-500">{matter.lane}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`badge ${
                          matter.priority === 'urgent'
                            ? 'badge-danger'
                            : matter.priority === 'high'
                            ? 'badge-warning'
                            : matter.priority === 'medium'
                            ? 'badge-info'
                            : 'badge-gray'
                        }`}
                      >
                        {matter.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(matter.opened_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/matters/${matter.matter_id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {mattersData?.pagination && mattersData.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredMatters.length}</span> of{' '}
            <span className="font-medium">{mattersData.pagination.total}</span> matters
          </div>
          <div className="flex space-x-2">
            {/* Pagination controls would go here */}
          </div>
        </div>
      )}

      {/* Create Matter Modal */}
      {isCreateModalOpen && (
        <CreateMatterModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['matters'] });
          }}
        />
      )}
    </div>
  );
}
