import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import useFetch from '../hooks/useFetch.js';
import Loader from '../components/Loader.jsx';
import StatCard from '../components/StatCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import '../styles/page.css';

const Dashboard = () => {
  const { data: summary, loading: summaryLoading } = useFetch('/analytics/summary', { initialData: { totals: {}, readiness: [] } });
  const { data: lowStock, loading: lowStockLoading } = useFetch('/resources/low-stock', { initialData: [] });
  const { data: disasters, loading: disasterLoading } = useFetch('/disasters', { initialData: [] });

  const isLoading = summaryLoading || lowStockLoading || disasterLoading;

  const totals = summary?.totals ?? { disasters: 0, requests: 0, allocations: 0, volunteers: 0 };

  return (
    <div className="page">
      <PageHeader title="Operational Dashboard" subtitle="Monitor critical indicators across disasters, resources, and teams." />
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <section className="grid grid--stats">
            <StatCard label="Active Disasters" value={totals.disasters} accent="#ef4444" />
            <StatCard label="Demand Requests" value={totals.requests} accent="#f97316" />
            <StatCard label="Allocations" value={totals.allocations} accent="#10b981" />
            <StatCard label="Volunteers" value={totals.volunteers} accent="#2563eb" />
          </section>

          <section className="card">
            <h3>Resource Readiness by Disaster</h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary?.readiness ?? []} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRequested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAllocated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" />
                  <XAxis dataKey="disaster_type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="total_requested" stroke="#f97316" fill="url(#colorRequested)" name="Requested" />
                  <Area type="monotone" dataKey="total_allocated" stroke="#22c55e" fill="url(#colorAllocated)" name="Allocated" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid grid--two">
            <div className="card">
              <h3>High Priority Disasters</h3>
              <DataTable
                columns={[
                  { key: 'type', header: 'Disaster' },
                  { key: 'location', header: 'Location' },
                  {
                    key: 'severity_level',
                    header: 'Severity',
                    render: (value) => <StatusBadge status={value} />,
                  },
                  { key: 'pending_requests', header: 'Pending Requests' },
                  { key: 'priority_high', header: 'High Priority' },
                ]}
                data={(disasters || []).filter((item) => item.severity_level !== 'Low')}
                emptyMessage="All disasters are currently in low severity."
              />
            </div>
            <div className="card">
              <h3>Low Stock Alerts</h3>
              <DataTable
                columns={[
                  { key: 'resource_type', header: 'Resource' },
                  { key: 'storage_name', header: 'Storage' },
                  { key: 'quantity_available', header: 'Qty Available' },
                  { key: 'last_alerted_at', header: 'Last Alerted' },
                ]}
                data={lowStock || []}
                emptyMessage="All resources are sufficiently stocked."
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
