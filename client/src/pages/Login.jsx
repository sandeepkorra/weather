import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/search', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to log in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-section">
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Email<input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" /></label>
        <label htmlFor="login-password">Password</label>
        <div className="password-input-row">
          <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} autoComplete="current-password" />
          <button
            className="password-toggle"
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p>Need an account? <Link to="/register">Register</Link></p>
    </section>
  );
}