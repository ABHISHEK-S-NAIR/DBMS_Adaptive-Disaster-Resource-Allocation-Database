import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Loader from '../components/Loader.jsx';
import http from '../api/httpClient.js';
import '../styles/forms.css';
import '../styles/page.css';

const createDefaults = {
  disaster_id: '',
  requested_by: '',
  priority_level: 'High',
  location: '',
  resource_type: '',
  quantity_requested: 10,
};

const statusDefaults = {
  id: '',
  status: 'In Progress',
};

const DemandRequests = () => {
  const { data: disasters } = useFetch('/disasters', { initialData: [] });
  const { data: requests, loading, refresh } = useFetch('/demand-requests', { initialData: [] });
  const [createForm, setCreateForm] = useState(createDefaults);
  const [statusForm, setStatusForm] = useState(statusDefaults);
  const [selectedRequest, setSelectedRequest] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!selectedRequest) {
      setRecommendations([]);
      return;
    }
    http
      .get(`/demand-requests/${selectedRequest}/recommendations`)
      .then((response) => setRecommendations(response.data))
      .catch((error) => setMessage(error.message));
  }, [selectedRequest]);

  const handleChange = (setter) => (event) => {
    const { name, value } = event.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await http.post('/demand-requests', {
        ...createForm,
        disaster_id: Number(createForm.disaster_id),
        quantity_requested: Number(createForm.quantity_requested),
      });
      setCreateForm(createDefaults);
      setMessage('Demand request logged');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleStatusUpdate = async (event) => {
    event.preventDefault();
    try {
      await http.patch(`/demand-requests/${statusForm.id}/status`, { status: statusForm.status });
      setStatusForm(statusDefaults);
      setMessage('Status updated');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await http.delete(`/demand-requests/${id}`);
      setMessage('Request deleted');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="page">
      <PageHeader title="Demand Requests" subtitle="Capture new requirements, manage prioritization, and route fulfillment." />
      {message ? <div className="alert">{message}</div> : null}
      {loading ? (
        <Loader />
      ) : (
        <DataTable
          columns={[
            { key: 'id', header: 'ID' },
            { key: 'disaster_type', header: 'Disaster' },
            { key: 'requested_by', header: 'Requested By' },
            {
              key: 'priority_level',
              header: 'Priority',
              render: (value) => <PriorityBadge priority={value} />,
            },
            { key: 'quantity_requested', header: 'Qty Requested' },
            {
              key: 'status',
              header: 'Status',
              render: (value) => <StatusBadge status={value} />,
            },
            {
              key: 'allocated_quantity',
              header: 'Qty Allocated',
              render: (value) => value ?? 0,
            },
            {
              key: 'created_at',
              header: 'Logged At',
              render: (value) => (value ? format(new Date(value), 'PPpp') : ''),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (_, row) => (
                <button type="button" className="inline-danger" onClick={() => handleDelete(row.id)}>
                  Delete
                </button>
              ),
            },
          ]}
          data={requests || []}
        />
      )}

      <section className="grid grid--two">
        <form className="form-card" onSubmit={handleCreate}>
          <h3>Log New Request</h3>
          <label>
            Disaster
            <select name="disaster_id" value={createForm.disaster_id} onChange={handleChange(setCreateForm)} required>
              <option value="">Select disaster</option>
              {(disasters || []).map((disaster) => (
                <option key={disaster.id} value={disaster.id}>
                  {disaster.type} — {disaster.location}
                </option>
              ))}
            </select>
          </label>
          <label>
            Requested By
            <input name="requested_by" value={createForm.requested_by} onChange={handleChange(setCreateForm)} required />
          </label>
          <label>
            Priority Level
            <select name="priority_level" value={createForm.priority_level} onChange={handleChange(setCreateForm)}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
          <label>
            Location
            <input name="location" value={createForm.location} onChange={handleChange(setCreateForm)} />
          </label>
          <label>
            Resource Needed
            <input name="resource_type" value={createForm.resource_type} onChange={handleChange(setCreateForm)} required />
          </label>
          <label>
            Quantity Requested
            <input
              type="number"
              min="1"
              name="quantity_requested"
              value={createForm.quantity_requested}
              onChange={handleChange(setCreateForm)}
              required
            />
          </label>
          <button type="submit">Submit Request</button>
        </form>

        <form className="form-card" onSubmit={handleStatusUpdate}>
          <h3>Update Status</h3>
          <label>
            Request ID
            <select name="id" value={statusForm.id} onChange={handleChange(setStatusForm)} required>
              <option value="">Select request</option>
              {(requests || []).map((request) => (
                <option key={request.id} value={request.id}>
                  #{request.id} — {request.requested_by}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select name="status" value={statusForm.status} onChange={handleChange(setStatusForm)}>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
          <button type="submit">Save Status</button>
        </form>
      </section>

      <section className="card">
        <h3>Resource Recommendations</h3>
        <div className="recommendations">
          <label>
            Select Request
            <select value={selectedRequest} onChange={(event) => setSelectedRequest(event.target.value)}>
              <option value="">Choose request</option>
              {(requests || []).map((request) => (
                <option key={request.id} value={request.id}>
                  #{request.id} — {request.resource_type} ({request.quantity_requested})
                </option>
              ))}
            </select>
          </label>
        </div>
        <DataTable
          columns={[
            { key: 'resource_type', header: 'Resource' },
            { key: 'storage_name', header: 'Storage' },
            { key: 'city', header: 'City' },
            { key: 'fulfillment_status', header: 'Fulfillment' },
            {
              key: 'distance_km',
              header: 'Distance (Km)',
              render: (value) => (value ? value.toFixed(1) : 'N/A'),
            },
            { key: 'quantity_available', header: 'Qty Available' },
          ]}
          data={recommendations}
          emptyMessage="Select a request above to view allocation suggestions."
        />
      </section>
    </div>
  );
};

export default DemandRequests;
