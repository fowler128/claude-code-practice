import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch analytics data (mock for now)
  const { data: matters } = useQuery({
    queryKey: ['matters'],
    queryFn: () => api.getMatters({ limit: 1000 })
  });

  const allMatters = matters?.matters || [];

  // Calculate metrics
  const metrics = calculateMetrics(allMatters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Performance metrics and insights
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Cycle Time"
          value={`${metrics.avgCycleTime} days`}
          trend="+5%"
          trendUp={false}
        />
        <MetricCard
          title="SLA Compliance"
          value={`${metrics.slaCompliance}%`}
          trend="+2%"
          trendUp={true}
        />
        <MetricCard
          title="Defect Rate"
          value={`${metrics.defectRate}%`}
          trend="-3%"
          trendUp={true}
        />
        <MetricCard
          title="Avg Health Score"
          value={metrics.avgHealthScore}
          trend="+8"
          trendUp={true}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cycle time by practice area */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Cycle Time by Practice Area
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.cycleTimeByPracticeArea}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="avgDays" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Matter distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Matters by Practice Area
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.mattersByPracticeArea}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderPieLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {metrics.mattersByPracticeArea.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defects over time */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Defects & Rework Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.defectTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="defects" stroke="#EF4444" strokeWidth={2} />
              <Line type="monotone" dataKey="rework" stroke="#F59E0B" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* SLA compliance over time */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            SLA Compliance Rate
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.slaComplianceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} label={{ value: '%', position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="compliance"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Health score distribution */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Matter Health Score Distribution
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-700">
              {metrics.healthDistribution.low}
            </div>
            <div className="text-sm text-green-600 mt-1">Low Risk (80-100)</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-700">
              {metrics.healthDistribution.medium}
            </div>
            <div className="text-sm text-yellow-600 mt-1">Medium Risk (60-79)</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-700">
              {metrics.healthDistribution.high}
            </div>
            <div className="text-sm text-red-600 mt-1">High Risk (0-59)</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={metrics.healthScoreDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top drivers */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Health Score Drivers (Most Common Issues)
        </h3>
        <div className="space-y-3">
          {metrics.topDrivers.map((driver, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{driver.description}</div>
                <div className="text-sm text-gray-600 mt-1">{driver.recommendation}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">{driver.count}</div>
                <div className="text-xs text-gray-500">matters affected</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, trendUp }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
      {trend && (
        <div className={`mt-2 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? '↑' : '↓'} {trend} vs last period
        </div>
      )}
    </div>
  );
}

function renderPieLabel(entry) {
  return `${entry.name}: ${entry.value}`;
}

function calculateMetrics(matters) {
  // Mock calculations - in production, this would come from the API

  // Cycle time
  const avgCycleTime = 45; // days

  // SLA compliance
  const totalWithSLA = matters.length;
  const slaBreaches = matters.filter(m => m.sla_breach_at).length;
  const slaCompliance = totalWithSLA > 0
    ? Math.round(((totalWithSLA - slaBreaches) / totalWithSLA) * 100)
    : 100;

  // Defect rate
  const totalDefects = matters.reduce((sum, m) => sum + (m.defect_count || 0), 0);
  const defectRate = matters.length > 0
    ? Math.round((totalDefects / matters.length) * 100)
    : 0;

  // Avg health score
  const avgHealthScore = matters.length > 0
    ? Math.round(matters.reduce((sum, m) => sum + (m.health_score || 100), 0) / matters.length)
    : 100;

  // Matters by practice area
  const practiceAreaCounts = matters.reduce((acc, m) => {
    const pa = m.practice_area_name || 'Unknown';
    acc[pa] = (acc[pa] || 0) + 1;
    return acc;
  }, {});

  const mattersByPracticeArea = Object.entries(practiceAreaCounts).map(([name, value]) => ({
    name,
    value
  }));

  // Cycle time by practice area (mock data)
  const cycleTimeByPracticeArea = [
    { name: 'Bankruptcy', avgDays: 42 },
    { name: 'Family Law', avgDays: 58 },
    { name: 'Immigration', avgDays: 65 },
    { name: 'Probate', avgDays: 38 }
  ];

  // Defect trend (mock data)
  const defectTrend = [
    { month: 'Sep', defects: 12, rework: 8 },
    { month: 'Oct', defects: 15, rework: 10 },
    { month: 'Nov', defects: 10, rework: 7 },
    { month: 'Dec', defects: 8, rework: 5 },
    { month: 'Jan', defects: 6, rework: 4 }
  ];

  // SLA compliance trend (mock data)
  const slaComplianceTrend = [
    { month: 'Sep', compliance: 82 },
    { month: 'Oct', compliance: 85 },
    { month: 'Nov', compliance: 88 },
    { month: 'Dec', compliance: 91 },
    { month: 'Jan', compliance: 93 }
  ];

  // Health distribution
  const healthDistribution = {
    low: matters.filter(m => m.health_risk_tier === 'low').length,
    medium: matters.filter(m => m.health_risk_tier === 'medium').length,
    high: matters.filter(m => m.health_risk_tier === 'high').length
  };

  // Health score distribution
  const healthScoreDistribution = [
    { range: '0-20', count: matters.filter(m => m.health_score <= 20).length },
    { range: '21-40', count: matters.filter(m => m.health_score > 20 && m.health_score <= 40).length },
    { range: '41-60', count: matters.filter(m => m.health_score > 40 && m.health_score <= 60).length },
    { range: '61-80', count: matters.filter(m => m.health_score > 60 && m.health_score <= 80).length },
    { range: '81-100', count: matters.filter(m => m.health_score > 80).length }
  ];

  // Top drivers
  const topDrivers = [
    {
      description: 'Missing required artifacts',
      recommendation: 'Implement proactive document request follow-ups',
      count: 23
    },
    {
      description: 'Status aging exceeds SLA',
      recommendation: 'Review resource allocation and workload distribution',
      count: 18
    },
    {
      description: 'Engagement letter not signed',
      recommendation: 'Streamline engagement process with e-signature',
      count: 15
    },
    {
      description: 'Payment/retainer not received',
      recommendation: 'Require payment before substantive work begins',
      count: 12
    },
    {
      description: 'High defect count',
      recommendation: 'Enhance QC processes and paralegal training',
      count: 9
    }
  ];

  return {
    avgCycleTime,
    slaCompliance,
    defectRate,
    avgHealthScore,
    mattersByPracticeArea,
    cycleTimeByPracticeArea,
    defectTrend,
    slaComplianceTrend,
    healthDistribution,
    healthScoreDistribution,
    topDrivers
  };
}
