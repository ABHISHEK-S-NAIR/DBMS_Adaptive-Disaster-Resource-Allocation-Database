import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Loader from '../components/Loader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import http from '../api/httpClient.js';
import useAuth from '../hooks/useAuth.js';
import useFetch from '../hooks/useFetch.js';
import '../styles/forms.css';
import '../styles/page.css';

const severityLevels = ['Low', 'Medium', 'High', 'Critical'];
const emptyForm = { type: '', location: '', severity_level: 'Low' };

const Disasters = () => {
  const { isAuthorized } = useAuth();
  const canManage = isAuthorized(['Administrator', 'Field Coordinator']);
  const { data: disasters = [], loading, error, refresh } = useFetch('/disasters', { initialData: [] });
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) {
      setMessage('You do not have permission to add disasters.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await http.post('/disasters', form);
      setForm(emptyForm);
      setMessage('Disaster record created successfully.');
      await refresh();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeverityChange = async (id, severity_level) => {
    if (!canManage) {
      return;
    }
    setUpdatingId(id);
    setMessage('');
    try {
      await http.patch(`/disasters/${id}/severity`, { severity_level });
      setMessage('Severity updated.');
      await refresh();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    { key: 'type', header: 'Type' },
    { key: 'location', header: 'Location' },
    {
      key: 'severity_level',
      header: 'Severity',
      render: (value, row) => (
        <div className="disaster-severity">
          <StatusBadge status={value} />
          {canManage ? (
            <select
              value={value}
              onChange={(event) => handleSeverityChange(row.id, event.target.value)}
              disabled={updatingId === row.id}
            >
              {severityLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      ),
    },
    {
      key: 'pending_requests',
      header: 'Pending Requests',
      render: (value) => value ?? 0,
    },
    {
      key: 'priority_high',
      header: 'High Priority',
      render: (value) => value ?? 0,
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Disaster Registry"
        subtitle="Track incident hotspots and maintain an up-to-date disaster catalog."
      />
      {message ? <div className="alert">{message}</div> : null}
      {error ? <div className="alert alert--error">{error.message}</div> : null}

      {loading ? (
        <Loader />
      ) : (
        <DataTable columns={columns} data={disasters} emptyMessage="No disaster events logged." />
      )}

      {canManage ? (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>Add Disaster Event</h3>
          <label>
            Disaster Type
            <input name="type" value={form.type} onChange={handleChange} required />
          </label>
          <label>
            Location
            <input name="location" value={form.location} onChange={handleChange} required />
          </label>
          <label>
            Severity Level
            <select name="severity_level" value={form.severity_level} onChange={handleChange}>
              {severityLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Record Disaster'}
          </button>
        </form>
      ) : (
        <div className="card">
          <h3>Insufficient Privileges</h3>
          <p>
            You can review disaster data, but only Field Coordinators or Administrators are allowed to register
            new incidents or change severity.
          </p>
        </div>
      )}
    </div>
  );
};

export default Disasters;
