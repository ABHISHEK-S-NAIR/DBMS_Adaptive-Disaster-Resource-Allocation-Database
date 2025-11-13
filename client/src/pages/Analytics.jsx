import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import DataTable from '../components/DataTable.jsx';
import '../styles/page.css';

const Analytics = () => {
  const { data: pending, loading: pendingLoading } = useFetch('/analytics/pending-by-disaster', { initialData: [] });
  const { data: utilization, loading: utilLoading } = useFetch('/analytics/resource-utilization', { initialData: [] });

  const loading = pendingLoading || utilLoading;

  return (
    <div className="page">
      <PageHeader title="Analytics" subtitle="Interactive insights built from joins, aggregates, and nested queries." />
      {loading ? (
        <Loader />
      ) : (
        <>
          <section className="card">
            <h3>Pending vs High Priority Requests</h3>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pending} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pending_requests" fill="#2563eb" name="Pending Requests" />
                  <Bar dataKey="high_priority" fill="#ef4444" name="High Priority" />
                  <Bar dataKey="open_allocations" fill="#f97316" name="Open Allocations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card">
            <h3>Resource Utilization by City</h3>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={utilization} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="resource_type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="quantity_available" stroke="#2563eb" name="Available" />
                  <Line type="monotone" dataKey="quantity_allocated" stroke="#22c55e" name="Allocated" />
                  <Line type="monotone" dataKey="utilization_rate" stroke="#f59e0b" name="Utilization %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card">
            <h3>Raw Utilization Data</h3>
            <DataTable
              columns={[
                { key: 'resource_type', header: 'Resource' },
                { key: 'city', header: 'City' },
                { key: 'quantity_available', header: 'Available' },
                { key: 'quantity_allocated', header: 'Allocated' },
                {
                  key: 'utilization_rate',
                  header: 'Utilization %',
                  render: (value) => (value ? `${value}%` : '0%'),
                },
              ]}
              data={utilization}
            />
          </section>
        </>
      )}
    </div>
  );
};

export default Analytics;
