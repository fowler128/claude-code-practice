import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { mattersApi, controlledListsApi } from '../services/api';
import { AlertCircle, Clock, TrendingUp, Filter } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { useAuthStore } from '../stores/authStore';

interface MatterCardProps {
  matter: any;
}

function MatterCard({ matter }: MatterCardProps) {
  const hoursSinceUpdate = differenceInHours(new Date(), new Date(matter.updated_at));
  const isOverdue = hoursSinceUpdate > 48;

  const healthColorClass =
    !matter.matter_health_score ? 'bg-gray-100 text-gray-600' :
    matter.matter_health_score >= 80 ? 'bg-green-100 text-green-700' :
    matter.matter_health_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-700';

  const priorityColorClass =
    matter.priority === 'urgent' ? 'bg-red-100 text-red-700' :
    matter.priority === 'high' ? 'bg-orange-100 text-orange-700' :
    matter.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
    'bg-gray-100 text-gray-700';

  return (
    <Link
      to={`/matters/${matter.matter_id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{matter.client_name}</div>
          <div className="text-sm text-gray-500">{matter.matter_number}</div>
        </div>
        {matter.matter_health_score !== null && (
          <div className={`px-2 py-1 rounded text-xs font-medium ${healthColorClass}`}>
            {matter.matter_health_score}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColorClass}`}>
            {matter.priority || 'medium'}
          </span>
          <span className="text-xs text-gray-600">{matter.status}</span>
        </div>

        {matter.owner_first_name && (
          <div className="text-xs text-gray-600">
            Owner: {matter.owner_first_name} {matter.owner_last_name}
          </div>
        )}

        {isOverdue && (
          <div className="flex items-center text-xs text-red-600">
            <Clock className="w-3 h-3 mr-1" />
            {hoursSinceUpdate}h since update
          </div>
        )}

        {matter.defect_count > 0 && (
          <div className="flex items-center text-xs text-orange-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            {matter.defect_count} defect{matter.defect_count > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Link>
  );
}

interface LaneColumnProps {
  laneName: string;
  laneId: string;
  matters: any[];
  isLoading: boolean;
}

function LaneColumn({ laneName, laneId, matters, isLoading }: LaneColumnProps) {
  const laneMatters = matters.filter(m => m.lane === laneId);

  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{laneName}</h3>
        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
          {laneMatters.length}
        </span>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : laneMatters.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No matters</div>
        ) : (
          laneMatters.map(matter => (
            <MatterCard key={matter.matter_id} matter={matter} />
          ))
        )}
      </div>
    </div>
  );
}

export default function SmartQueuePage() {
  const { user } = useAuthStore();
  const [practiceAreaFilter, setPracticeAreaFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data: mattersData, isLoading } = useQuery({
    queryKey: ['matters', { practice_area_id: practiceAreaFilter }],
    queryFn: () =>
      mattersApi.getAll({
        practice_area_id: practiceAreaFilter || undefined,
      }),
  });

  const { data: practiceAreas } = useQuery({
    queryKey: ['practice-areas'],
    queryFn: controlledListsApi.getPracticeAreas,
  });

  const matters = mattersData?.matters || [];

  const filteredMatters = matters.filter((matter: any) => {
    if (priorityFilter && matter.priority !== priorityFilter) return false;
    return true;
  });

  // Common lanes (these should ideally come from playbooks API)
  const lanes = [
    { id: 'intake_triage', name: 'Intake & Triage' },
    { id: 'engagement_conflicts', name: 'Engagement & Conflicts' },
    { id: 'document_collection', name: 'Document Collection' },
    { id: 'drafting_prep', name: 'Drafting / Case Prep' },
    { id: 'attorney_review', name: 'Attorney Review' },
    { id: 'filing_submission', name: 'Filing / Submission' },
    { id: 'post_filing', name: 'Post-Filing' },
    { id: 'billing_closeout', name: 'Billing & Closeout' },
  ];

  const stats = {
    total: filteredMatters.length,
    urgent: filteredMatters.filter((m: any) => m.priority === 'urgent').length,
    withDefects: filteredMatters.filter((m: any) => m.defect_count > 0).length,
    avgHealth: filteredMatters.length > 0
      ? Math.round(
          filteredMatters
            .filter((m: any) => m.matter_health_score !== null)
            .reduce((sum: number, m: any) => sum + (m.matter_health_score || 0), 0) /
            filteredMatters.filter((m: any) => m.matter_health_score !== null).length
        )
      : 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Smart Queue</h1>
        <p className="mt-1 text-gray-600">Lane-based workflow view for {user?.role}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600">Total Matters</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Urgent</div>
          <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">With Defects</div>
          <div className="text-2xl font-bold text-orange-600">{stats.withDefects}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Avg Health Score</div>
          <div className="text-2xl font-bold text-green-600">{stats.avgHealth || 'N/A'}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="label">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {lanes.map(lane => (
            <LaneColumn
              key={lane.id}
              laneName={lane.name}
              laneId={lane.id}
              matters={filteredMatters}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
