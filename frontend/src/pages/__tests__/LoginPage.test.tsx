import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { ToastProvider } from '../../context/ToastContext';
import { AuthProvider } from '../../context/AuthContext';
import { CartProvider } from '../../context/CartContext';

const loginMock = vi.fn();

vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../context/AuthContext')>('../../context/AuthContext');
  return {
    ...actual,
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({
      user: null,
      loading: false,
      login: loginMock,
      register: vi.fn(),
      updateProfile: vi.fn(),
      logout: vi.fn(),
      hasRole: () => false,
    }),
  };
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <LoginPage />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
  });

  it('shows validation error when fields are empty', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /^login$/i }));
    expect(await screen.findByText(/please enter your email and password/i)).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('submits credentials when the form is filled', async () => {
    loginMock.mockResolvedValue({ id: 1, fullName: 'Demo', email: 'demo@x.com', mobile: '9000000002', roles: ['CUSTOMER'], enabled: true });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email address/i), 'demo@foodiehub.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Demo@123');
    await userEvent.click(screen.getByRole('button', { name: /^login$/i }));
    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('demo@foodiehub.com', 'Demo@123'));
  });

  it('links to signup page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute('href', '/signup');
  });
});
