import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function validate() {
    if (!form.name || !form.email || !form.password) return 'Name, email, and password are required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate();
    setError(validationError);
    if (validationError) return;

    setIsSubmitting(true);
    try {
      await register(form);
      navigate('/search', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-section">
      <h1>Register</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Name<input name="name" value={form.name} onChange={updateField} autoComplete="name" /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" /></label>
        <label>Password<input name="password" type="password" value={form.password} onChange={updateField} autoComplete="new-password" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}</button>
      </form>
      <p>Already registered? <Link to="/login">Log in</Link></p>
    </section>
  );
}