import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Loader from '../components/Loader.jsx';
import http from '../api/httpClient.js';
import '../styles/forms.css';
import '../styles/page.css';

const emptyRole = { role_name: '', description: '' };
const emptyUser = { username: '', display_name: '', role_id: '', contact_email: '' };
const reassignDefaults = { user_id: '', role_id: '' };

const AccessControl = () => {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [roleForm, setRoleForm] = useState(emptyRole);
  const [userForm, setUserForm] = useState(emptyUser);
  const [reassignForm, setReassignForm] = useState(reassignDefaults);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesResponse, usersResponse] = await Promise.all([http.get('/access/roles'), http.get('/access/users')]);
      setRoles(rolesResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (setter) => (event) => {
    const { name, value } = event.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateRole = async (event) => {
    event.preventDefault();
    try {
      await http.post('/access/roles', roleForm);
      setRoleForm(emptyRole);
      setMessage('Role created successfully');
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    try {
      await http.post('/access/users', { ...userForm, role_id: Number(userForm.role_id) });
      setUserForm(emptyUser);
      setMessage('User created successfully');
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleReassign = async (event) => {
    event.preventDefault();
    try {
      await http.patch(`/access/users/${reassignForm.user_id}/role`, { role_id: Number(reassignForm.role_id) });
      setReassignForm(reassignDefaults);
      setMessage('User role updated');
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="page">
      <PageHeader title="Access Management" subtitle="Create command center accounts and manage privilege tiers." />
      {message ? <div className="alert">{message}</div> : null}
      {loading ? (
        <Loader />
      ) : (
        <section className="grid grid--two">
          <div className="card">
            <h3>Role Directory</h3>
            <DataTable
              columns={[
                { key: 'role_name', header: 'Role' },
                { key: 'description', header: 'Description' },
                { key: 'user_count', header: 'Assigned Users' },
              ]}
              data={roles}
            />
          </div>
          <div className="card">
            <h3>Application Users</h3>
            <DataTable
              columns={[
                { key: 'username', header: 'Username' },
                { key: 'display_name', header: 'Name' },
                { key: 'role_name', header: 'Role' },
                { key: 'contact_email', header: 'Email' },
              ]}
              data={users}
            />
          </div>
        </section>
      )}

      <section className="grid grid--two">
        <form className="form-card" onSubmit={handleCreateRole}>
          <h3>Create Role</h3>
          <label>
            Role Name
            <input name="role_name" value={roleForm.role_name} onChange={handleChange(setRoleForm)} required />
          </label>
          <label>
            Description
            <textarea name="description" rows="3" value={roleForm.description} onChange={handleChange(setRoleForm)} />
          </label>
          <button type="submit">Save Role</button>
        </form>

        <form className="form-card" onSubmit={handleCreateUser}>
          <h3>Create User</h3>
          <label>
            Username
            <input name="username" value={userForm.username} onChange={handleChange(setUserForm)} required />
          </label>
          <label>
            Display Name
            <input name="display_name" value={userForm.display_name} onChange={handleChange(setUserForm)} required />
          </label>
          <label>
            Email
            <input type="email" name="contact_email" value={userForm.contact_email} onChange={handleChange(setUserForm)} />
          </label>
          <label>
            Role
            <select name="role_id" value={userForm.role_id} onChange={handleChange(setUserForm)} required>
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Create User</button>
        </form>
      </section>

      <section className="card">
        <h3>Reassign Privileges</h3>
        <form className="form-card" onSubmit={handleReassign}>
          <label>
            User
            <select name="user_id" value={reassignForm.user_id} onChange={handleChange(setReassignForm)} required>
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.display_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            New Role
            <select name="role_id" value={reassignForm.role_id} onChange={handleChange(setReassignForm)} required>
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Update Role</button>
        </form>
      </section>
    </div>
  );
};

export default AccessControl;
