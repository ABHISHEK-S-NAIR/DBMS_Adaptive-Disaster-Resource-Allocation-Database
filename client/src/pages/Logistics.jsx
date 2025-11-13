import { useState } from 'react';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Loader from '../components/Loader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import http from '../api/httpClient.js';
import '../styles/forms.css';
import '../styles/page.css';

const transportStatusDefaults = {
  id: '',
  status: 'In Transit',
};

const dispatchStatusDefaults = {
  id: '',
  status: 'Delivered',
};

const dispatchCreateDefaults = {
  allocation_id: '',
  transport_id: '',
  status: 'In Transit',
};

const Logistics = () => {
  const { data: transports, loading: transportsLoading, refresh: refreshTransports } = useFetch('/transports', { initialData: [] });
  const { data: dispatches, loading: dispatchLoading, refresh: refreshDispatches } = useFetch('/dispatches', { initialData: [] });
  const { data: allocations } = useFetch('/allocations', { initialData: [] });
  const [transportStatusForm, setTransportStatusForm] = useState(transportStatusDefaults);
  const [dispatchStatusForm, setDispatchStatusForm] = useState(dispatchStatusDefaults);
  const [dispatchCreateForm, setDispatchCreateForm] = useState(dispatchCreateDefaults);
  const [message, setMessage] = useState('');

  const handleChange = (setter) => (event) => {
    const { name, value } = event.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransportStatus = async (event) => {
    event.preventDefault();
    try {
      await http.patch(`/transports/${transportStatusForm.id}/status`, { status: transportStatusForm.status });
      setTransportStatusForm(transportStatusDefaults);
      setMessage('Transport status updated');
      await refreshTransports();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDispatchStatus = async (event) => {
    event.preventDefault();
    try {
      await http.patch(`/dispatches/${dispatchStatusForm.id}/status`, { status: dispatchStatusForm.status });
      setDispatchStatusForm(dispatchStatusDefaults);
      setMessage('Dispatch status updated');
      await refreshDispatches();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleCreateDispatch = async (event) => {
    event.preventDefault();
    try {
      await http.post('/dispatches', {
        allocation_id: Number(dispatchCreateForm.allocation_id),
        transport_id: dispatchCreateForm.transport_id ? Number(dispatchCreateForm.transport_id) : null,
        status: dispatchCreateForm.status,
      });
      setDispatchCreateForm(dispatchCreateDefaults);
      setMessage('Dispatch created');
      await Promise.all([refreshDispatches(), refreshTransports()]);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loading = transportsLoading || dispatchLoading;

  return (
    <div className="page">
      <PageHeader title="Logistics Control" subtitle="Coordinate transport fleets and dispatch movements across the network." />
      {message ? <div className="alert">{message}</div> : null}
      {loading ? (
        <Loader />
      ) : (
        <section className="grid grid--two">
          <div className="card">
            <h3>Transport Fleet</h3>
            <DataTable
              columns={[
                { key: 'vehicle_type', header: 'Vehicle' },
                { key: 'capacity', header: 'Capacity' },
                { key: 'driver_name', header: 'Driver' },
                { key: 'contact_number', header: 'Contact' },
                { key: 'current_location', header: 'Location' },
                {
                  key: 'status',
                  header: 'Status',
                  render: (value) => <StatusBadge status={value} />,
                },
              ]}
              data={transports || []}
            />
          </div>
          <div className="card">
            <h3>Dispatch Status</h3>
            <DataTable
              columns={[
                { key: 'allocation_id', header: 'Allocation' },
                { key: 'transport_id', header: 'Transport' },
                {
                  key: 'status',
                  header: 'Status',
                  render: (value) => <StatusBadge status={value} />,
                },
              ]}
              data={dispatches || []}
            />
          </div>
        </section>
      )}

      <section className="grid grid--two">
        <form className="form-card" onSubmit={handleTransportStatus}>
          <h3>Update Transport Status</h3>
          <label>
            Transport
            <select name="id" value={transportStatusForm.id} onChange={handleChange(setTransportStatusForm)} required>
              <option value="">Select transport</option>
              {(transports || []).map((transport) => (
                <option key={transport.id} value={transport.id}>
                  #{transport.id} — {transport.vehicle_type}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select name="status" value={transportStatusForm.status} onChange={handleChange(setTransportStatusForm)}>
              <option value="Available">Available</option>
              <option value="In Transit">In Transit</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </label>
          <button type="submit">Update Status</button>
        </form>

        <form className="form-card" onSubmit={handleDispatchStatus}>
          <h3>Update Dispatch Status</h3>
          <label>
            Dispatch
            <select name="id" value={dispatchStatusForm.id} onChange={handleChange(setDispatchStatusForm)} required>
              <option value="">Select dispatch</option>
              {(dispatches || []).map((dispatch) => (
                <option key={dispatch.id} value={dispatch.id}>
                  #{dispatch.id} — Allocation {dispatch.allocation_id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select name="status" value={dispatchStatusForm.status} onChange={handleChange(setDispatchStatusForm)}>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </label>
          <button type="submit">Save</button>
        </form>
      </section>

      <section className="card">
        <h3>Create Dispatch</h3>
        <form className="form-card" onSubmit={handleCreateDispatch}>
          <label>
            Allocation
            <select name="allocation_id" value={dispatchCreateForm.allocation_id} onChange={handleChange(setDispatchCreateForm)} required>
              <option value="">Select allocation</option>
              {(allocations || []).map((allocation) => (
                <option key={allocation.id} value={allocation.id}>
                  #{allocation.id} — Request {allocation.request_id} ({allocation.status})
                </option>
              ))}
            </select>
          </label>
          <label>
            Transport (optional)
            <select name="transport_id" value={dispatchCreateForm.transport_id} onChange={handleChange(setDispatchCreateForm)}>
              <option value="">Auto assign later</option>
              {(transports || []).map((transport) => (
                <option key={transport.id} value={transport.id}>
                  #{transport.id} — {transport.vehicle_type}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select name="status" value={dispatchCreateForm.status} onChange={handleChange(setDispatchCreateForm)}>
              <option value="In Transit">In Transit</option>
              <option value="Pending">Pending</option>
              <option value="Delivered">Delivered</option>
            </select>
          </label>
          <button type="submit">Create Dispatch</button>
        </form>
      </section>
    </div>
  );
};

export default Logistics;
