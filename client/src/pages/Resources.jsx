import { useState } from 'react';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Loader from '../components/Loader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import http from '../api/httpClient.js';
import '../styles/forms.css';
import '../styles/page.css';

const initialResourceForm = {
  resource_type: '',
  quantity_available: 0,
  status: 'Available',
  storage_location_id: '',
};

const initialReplenishForm = {
  id: '',
  quantity: 10,
};

const Resources = () => {
  const { data: resources, loading, refresh } = useFetch('/resources', { initialData: [] });
  const { data: storages } = useFetch('/storage-locations', { initialData: [] });
  const [resourceForm, setResourceForm] = useState(initialResourceForm);
  const [replenishForm, setReplenishForm] = useState(initialReplenishForm);
  const [message, setMessage] = useState('');

  const handleChange = (setter) => (event) => {
    const { name, value } = event.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitResource = async (event) => {
    event.preventDefault();
    try {
      await http.post('/resources', {
        ...resourceForm,
        quantity_available: Number(resourceForm.quantity_available),
        storage_location_id: resourceForm.storage_location_id ? Number(resourceForm.storage_location_id) : null,
      });
      setResourceForm(initialResourceForm);
      setMessage('Resource created successfully');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleReplenish = async (event) => {
    event.preventDefault();
    try {
      await http.post(`/resources/${replenishForm.id}/replenish`, { quantity: Number(replenishForm.quantity) });
      setReplenishForm(initialReplenishForm);
      setMessage('Resource replenished');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="page">
      <PageHeader title="Resource Inventory" subtitle="Track, replenish, and route relief inventory in real time." />
      {message ? <div className="alert">{message}</div> : null}
      {loading ? (
        <Loader />
      ) : (
        <>
          <DataTable
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'resource_type', header: 'Resource' },
              {
                key: 'status',
                header: 'Status',
                render: (value) => <StatusBadge status={value} />,
              },
              { key: 'quantity_available', header: 'Quantity' },
              { key: 'storage_name', header: 'Storage Location' },
              { key: 'city', header: 'City' },
            ]}
            data={resources || []}
          />

          <section className="grid grid--two">
            <form className="form-card" onSubmit={handleSubmitResource}>
              <h3>Create Resource</h3>
              <label>
                Resource Type
                <input name="resource_type" value={resourceForm.resource_type} onChange={handleChange(setResourceForm)} required />
              </label>
              <label>
                Quantity Available
                <input
                  type="number"
                  min="0"
                  name="quantity_available"
                  value={resourceForm.quantity_available}
                  onChange={handleChange(setResourceForm)}
                  required
                />
              </label>
              <label>
                Status
                <select name="status" value={resourceForm.status} onChange={handleChange(setResourceForm)}>
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                  <option value="Reserved">Reserved</option>
                </select>
              </label>
              <label>
                Storage Location
                <select name="storage_location_id" value={resourceForm.storage_location_id} onChange={handleChange(setResourceForm)}>
                  <option value="">Select location</option>
                  {(storages || []).map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} — {store.city}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit">Create Resource</button>
            </form>

            <form className="form-card" onSubmit={handleReplenish}>
              <h3>Replenish Stock</h3>
              <label>
                Resource
                <select name="id" value={replenishForm.id} onChange={handleChange(setReplenishForm)} required>
                  <option value="">Choose resource</option>
                  {(resources || []).map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.resource_type} — {resource.quantity_available} units
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity to Add
                <input
                  type="number"
                  min="1"
                  name="quantity"
                  value={replenishForm.quantity}
                  onChange={handleChange(setReplenishForm)}
                  required
                />
              </label>
              <button type="submit">Replenish</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
};

export default Resources;
