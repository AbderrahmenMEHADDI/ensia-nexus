import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminPanel from '../pages/AdminPanel';
import { vi, describe, it, beforeEach, expect } from 'vitest';

const baseLabs = [
  { id: 1, name: 'LRIA — AI Lab', description: 'AI research', head_teacher_id: 1, created_at: '2023-03-01' },
];

const baseGroups = [
  { id: 1, lab_id: 1, name: 'Pending Group', description: 'desc', leader_user_id: 0, is_validated: false, created_at: '2024-01-01' },
];

const baseUsers = [
  { id: 1, full_name: 'Lab Admin', email: 'lab@lab.com', role: 'TEACHER', created_at: '2023-01-01' },
  { id: 2, full_name: 'Student', email: 'stud@lab.com', role: 'STUDENT', created_at: '2023-01-01' },
  { id: 5, full_name: 'Platform Admin', email: 'admin@lab.com', role: 'ADMIN', created_at: '2023-01-01' },
];

const baseLabAdmins = [{ lab_id: 1, user_id: 1, created_at: '2023-03-01' }];

const mockApi = vi.hoisted(() => ({
  getLabs: vi.fn(),
  getGroups: vi.fn(),
  getUsers: vi.fn(),
  getLabAdmins: vi.fn(),
  createGroup: vi.fn(),
  validateGroup: vi.fn(),
  deleteGroup: vi.fn(),
  addLabAdmin: vi.fn(),
  removeLabAdmin: vi.fn(),
}));

let authState: any = {};

vi.mock('@/repositories/apiRepository', () => ({ apiRepository: mockApi }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('framer-motion', () => ({ motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> } }));
vi.mock('@/components/ui/tabs', () => {
  const Tabs = ({ children }: any) => <div>{children}</div>;
  const TabsList = ({ children }: any) => <div > {children}</div>;
  const TabsTrigger = ({ children, onClick }: any) => (
    <button type="button" role="tab" onClick={onClick}>{children}</button>
  );
  const TabsContent = ({ children }: any) => <div>{children}</div>;
  return { Tabs, TabsList, TabsTrigger, TabsContent };
});
vi.mock('@/components/ui/select', () => {
  const Select = ({ value, onValueChange, children }: any) => (
    <select
      data-testid="lab-select"
      aria-label="lab-select"
      title="lab-select"
      value={value ?? ''}
      onChange={e => onValueChange?.(e.target.value)}
    >
      {children}
    </select>
  );
  const SelectTrigger = ({ children }: any) => <>{children}</>;
  const SelectContent = ({ children }: any) => <>{children}</>;
  const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>;
  const SelectValue = ({ placeholder }: any) => <>{placeholder}</>;
  return { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
});

const setAuth = (userId: number, role: string) => {
  const user = baseUsers.find(u => u.id === userId)!;
  authState = {
    user,
    isAdmin: role === 'ADMIN',
    isAuthenticated: true,
    isLoading: false,
    isInitialLoading: false,
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.getLabs.mockResolvedValue([...baseLabs]);
  mockApi.getGroups.mockResolvedValue([...baseGroups]);
  mockApi.getUsers.mockResolvedValue([...baseUsers]);
  mockApi.getLabAdmins.mockResolvedValue([...baseLabAdmins]);
  mockApi.validateGroup.mockResolvedValue({ ...baseGroups[0], is_validated: true });
  mockApi.deleteGroup.mockResolvedValue(undefined);
  mockApi.createGroup.mockImplementation(async data => ({ id: 99, leader_user_id: 0, created_at: 'now', ...data }));
});

describe('AdminPanel permissions', () => {
  it('shows lab create/edit for platform admin', async () => {
    setAuth(5, 'ADMIN');
    render(<AdminPanel />);
    await waitFor(() => expect(mockApi.getLabs).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('tab', { name: /Labs/i }));
    expect(screen.getByRole('button', { name: /Add Lab/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Admins/i }).length).toBeGreaterThan(0);
  });

  it('hides Add Lab for lab-only admin but shows Admins button', async () => {
    setAuth(1, 'TEACHER');
    render(<AdminPanel />);
    await waitFor(() => expect(mockApi.getLabs).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('tab', { name: /Labs/i }));
    expect(screen.queryByRole('button', { name: /Add Lab/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Admins/i })).toBeInTheDocument();
  });

  it('hides group actions for unauthorized user', async () => {
    setAuth(2, 'STUDENT');
    render(<AdminPanel />);
    await waitFor(() => expect(mockApi.getGroups).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /Assign Leader/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Validate/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
  });

  it('shows group actions for lab admin', async () => {
    setAuth(1, 'TEACHER');
    render(<AdminPanel />);
    await waitFor(() => expect(mockApi.getGroups).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /Assign Leader/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Validate/i })).not.toHaveLength(0);
  });

  it('auto-validates group creation by lab admin', async () => {
    setAuth(1, 'TEACHER');
    render(<AdminPanel />);
    await waitFor(() => expect(mockApi.getLabs).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/Add Group/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Add Group/i));
    fireEvent.change(screen.getByPlaceholderText(/NLP .* Understanding/i), { target: { value: 'New Group' } });
    fireEvent.change(screen.getByPlaceholderText(/Brief description/i), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByTestId('lab-select'), { target: { value: '1' } });
    fireEvent.click(screen.getByText(/Create Group/i));

    await waitFor(() => expect(mockApi.createGroup).toHaveBeenCalled());
    const payload = mockApi.createGroup.mock.calls[0][0];
    expect(payload.is_validated).toBe(true);
    expect(payload.validated_by_admin_id).toBe(1);
  });
});
