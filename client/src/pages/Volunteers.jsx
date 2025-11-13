import { useEffect, useState } from 'react';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Loader from '../components/Loader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import http from '../api/httpClient.js';
import '../styles/forms.css';
import '../styles/page.css';

const volunteerDefaults = {
  name: '',
  skill_set: '',
  availability_status: 'Available',
  contact_number: '',
  location: '',
};

const assignDefaults = {
  disaster_id: '',
  task: '',
  skill_set: '',
};

const Volunteers = () => {
  const { data: volunteers, loading, refresh } = useFetch('/volunteers', { initialData: { roster: [], assignments: [] } });
  const { data: disasters } = useFetch('/disasters', { initialData: [] });
  const [volunteerForm, setVolunteerForm] = useState(volunteerDefaults);
  const [assignForm, setAssignForm] = useState(assignDefaults);
  const [message, setMessage] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [assignmentHistory, setAssignmentHistory] = useState([]);

  useEffect(() => {
    if (!selectedVolunteer) {
      setAssignmentHistory([]);
      return;
    }
    http
      .get(`/volunteers/${selectedVolunteer}/assignments`)
      .then((response) => setAssignmentHistory(response.data))
      .catch((error) => setMessage(error.message));
  }, [selectedVolunteer]);

  const handleChange = (setter) => (event) => {
    const { name, value } = event.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateVolunteer = async (event) => {
    event.preventDefault();
    try {
      await http.post('/volunteers', volunteerForm);
      setVolunteerForm(volunteerDefaults);
      setMessage('Volunteer added');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAssign = async (event) => {
    event.preventDefault();
    try {
      await http.post('/volunteers/assign', {
        disaster_id: Number(assignForm.disaster_id),
        task: assignForm.task,
        skill_set: assignForm.skill_set || null,
      });
      setAssignForm(assignDefaults);
      setMessage('Volunteer assigned successfully');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="page">
      <PageHeader title="Volunteer Corps" subtitle="Mobilize field teams, track assignments, and balance workloads." />
      {message ? <div className="alert">{message}</div> : null}
      {loading ? (
        <Loader />
      ) : (
        <section className="grid grid--two">
          <div className="card">
            <h3>Volunteer Roster</h3>
            <DataTable
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'skill_set', header: 'Skill' },
                {
                  key: 'availability_status',
                  header: 'Availability',
                  render: (value) => <StatusBadge status={value} />,
                },
                { key: 'contact_number', header: 'Contact' },
                { key: 'location', header: 'Location' },
                { key: 'open_assignments', header: 'Active Assignments' },
              ]}
              data={volunteers?.roster || []}
            />
          </div>
          <div className="card">
            <h3>Current Assignments</h3>
            <DataTable
              columns={[
                { key: 'task', header: 'Task' },
                { key: 'volunteer_name', header: 'Volunteer' },
                { key: 'disaster_type', header: 'Disaster' },
                { key: 'status', header: 'Status' },
              ]}
              data={volunteers?.assignments || []}
            />
          </div>
        </section>
      )}

      <section className="grid grid--two">
        <form className="form-card" onSubmit={handleCreateVolunteer}>
          <h3>Add Volunteer</h3>
          <label>
            Name
            <input name="name" value={volunteerForm.name} onChange={handleChange(setVolunteerForm)} required />
          </label>
          <label>
            Skill Set
            <input name="skill_set" value={volunteerForm.skill_set} onChange={handleChange(setVolunteerForm)} />
          </label>
          <label>
            Availability
            <select name="availability_status" value={volunteerForm.availability_status} onChange={handleChange(setVolunteerForm)}>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
            </select>
          </label>
          <label>
            Contact Number
            <input name="contact_number" value={volunteerForm.contact_number} onChange={handleChange(setVolunteerForm)} />
          </label>
          <label>
            Location
            <input name="location" value={volunteerForm.location} onChange={handleChange(setVolunteerForm)} />
          </label>
          <button type="submit">Save Volunteer</button>
        </form>

        <form className="form-card" onSubmit={handleAssign}>
          <h3>Auto Assign Volunteer</h3>
          <label>
            Disaster
            <select name="disaster_id" value={assignForm.disaster_id} onChange={handleChange(setAssignForm)} required>
              <option value="">Select disaster</option>
              {(disasters || []).map((disaster) => (
                <option key={disaster.id} value={disaster.id}>
                  {disaster.type} — {disaster.location}
                </option>
              ))}
            </select>
          </label>
          <label>
            Requested Skill (optional)
            <input name="skill_set" value={assignForm.skill_set} onChange={handleChange(setAssignForm)} placeholder="e.g. Medical" />
          </label>
          <label>
            Task Description
            <textarea name="task" rows="3" value={assignForm.task} onChange={handleChange(setAssignForm)} required />
          </label>
          <button type="submit">Assign Volunteer</button>
        </form>
      </section>

      <section className="card">
        <h3>Assignment History</h3>
        <label>
          Volunteer
          <select value={selectedVolunteer} onChange={(event) => setSelectedVolunteer(event.target.value)}>
            <option value="">Select volunteer</option>
            {(volunteers?.roster || []).map((volunteer) => (
              <option key={volunteer.id} value={volunteer.id}>
                {volunteer.name}
              </option>
            ))}
          </select>
        </label>
        <DataTable
          columns={[
            { key: 'task', header: 'Task' },
            { key: 'disaster_type', header: 'Disaster' },
            { key: 'status', header: 'Status' },
            { key: 'created_at', header: 'Assigned On' },
          ]}
          data={assignmentHistory}
          emptyMessage="Select a volunteer to view past assignments."
        />
      </section>
    </div>
  );
};

export default Volunteers;
