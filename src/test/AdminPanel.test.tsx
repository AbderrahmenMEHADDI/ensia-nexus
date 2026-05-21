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
  getUsersPaged: vi.fn(),
  getTeachers: vi.fn(),
  getGroupMembers: vi.fn(),
  getLabAdmins: vi.fn(),
  createGroup: vi.fn(),
  validateGroup: vi.fn(),
  deleteGroup: vi.fn(),
  addLabAdmin: vi.fn(),
  removeLabAdmin: vi.fn(),
  getProjects: vi.fn(),
  getEligibleCollaborationCalls: vi.fn(),
  getApplications: vi.fn(),
  updateGroup: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  updateCollaborationCall: vi.fn(),
  deleteCollaborationCall: vi.fn(),
  reviewApplication: vi.fn(),
}));

let authState: any = {};

vi.mock('@/repositories/apiRepository', () => ({ apiRepository: mockApi }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('framer-motion', () => ({ motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> } }));
vi.mock('@/components/ui/tabs', () => {
  const Tabs = ({ children }: any) => <div>{children}</div>;
  const TabsList = ({ children }: any) => <div>{children}</div>;
  const TabsTrigger = ({ children, onClick }: any) => (
    <button type="button" onClick={onClick}>{children}</button>
  );
  const TabsContent = ({ children }: any) => <div>{children}</div>;
  return { Tabs, TabsList, TabsTrigger, TabsContent };
});
vi.mock('@/components/ui/select', () => {
  const Select = ({ value, onValueChange, children }: any) => (
    <>
      <label htmlFor="mock-select" className="sr-only">Mock select</label>
      <select
        id="mock-select"
        data-testid="lab-select"
        aria-label="lab-select"
        title="lab-select"
        value={value ?? ''}
        onChange={e => onValueChange?.(e.target.value)}
      >
        {children}
      </select>
    </>
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
  mockApi.getUsersPaged.mockResolvedValue({ items: [...baseUsers], total: baseUsers.length });
  mockApi.getTeachers.mockResolvedValue([
    {
      user_id: 1,
      experience_years: 12,
      grade: 'PROFESSOR',
      department: 'Computer Science',
      research_interests: 'AI',
      created_at: '2023-01-01',
    },
  ]);
  mockApi.getGroupMembers.mockResolvedValue([]);
  mockApi.getLabAdmins.mockResolvedValue([...baseLabAdmins]);
  mockApi.validateGroup.mockResolvedValue({ ...baseGroups[0], is_validated: true });
  mockApi.deleteGroup.mockResolvedValue(undefined);
  mockApi.createGroup.mockImplementation(async data => ({ id: 99, leader_user_id: 0, created_at: 'now', ...data }));
  
  mockApi.getProjects.mockResolvedValue([]);
  mockApi.getEligibleCollaborationCalls.mockResolvedValue([]);
  mockApi.getApplications.mockResolvedValue([]);
  mockApi.updateGroup.mockImplementation(async (id, data) => ({ id, ...data }));
  mockApi.updateProject.mockImplementation(async (id, data) => ({ id, ...data }));
  mockApi.deleteProject.mockResolvedValue(undefined);
  mockApi.updateCollaborationCall.mockImplementation(async (id, data) => ({ id, ...data }));
  mockApi.deleteCollaborationCall.mockResolvedValue(undefined);
  mockApi.reviewApplication.mockImplementation(async (id, data) => ({ id, ...data }));
});

describe('AdminPanel permissions', () => {
  it('shows lab create/edit for platform admin', async () => {
    setAuth(5, 'ADMIN');
    render(<AdminPanel />);
    await waitFor(() => expect(mockApi.getLabs).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /New Lab/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Admins/i }).length).toBeGreaterThan(0);
  });

  it('hides Add Lab for lab-only admin but shows Admins button', async () => {
    setAuth(1, 'TEACHER');
    render(<AdminPanel />);
    await waitFor(() => expect(mockApi.getLabs).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /New Lab/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Admins/i })).toBeInTheDocument();
  });

  it('hides group actions for unauthorized user', async () => {
    setAuth(2, 'STUDENT');
    render(<AdminPanel />);
    await waitFor(() => expect(mockApi.getGroups).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /Change Leader/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Validate/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
  });

  it('shows group actions for lab admin', async () => {
    setAuth(1, 'TEACHER');
    render(<AdminPanel />);
    await waitFor(() => expect(mockApi.getGroups).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /Change Leader/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Validate/i })).not.toHaveLength(0);
  });

  it('auto-validates group creation by lab admin', async () => {
    setAuth(1, 'TEACHER');
    render(<AdminPanel />);
    await waitFor(() => expect(mockApi.getLabs).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/New Group/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/New Group/i));
    fireEvent.change(screen.getByPlaceholderText(/Group name\.\.\./i), { target: { value: 'New Group' } });
    fireEvent.change(screen.getByPlaceholderText(/Description\.\.\./i), { target: { value: 'Desc' } });
    const labSelect = screen.getAllByTestId('lab-select').find(
      node => node.textContent?.includes('LRIA')
    );
    expect(labSelect).toBeDefined();
    fireEvent.change(labSelect!, { target: { value: '1' } });
    fireEvent.click(screen.getByText(/Create Group/i));

    await waitFor(() => expect(mockApi.createGroup).toHaveBeenCalled());
    const payload = mockApi.createGroup.mock.calls[0][0];
    expect(payload.is_validated).toBe(true);
    expect(payload.validated_by_admin_id).toBe(1);
  });

  it('shows Projects tab and allows group editing', async () => {
    setAuth(5, 'ADMIN');
    render(<AdminPanel />);
    await waitFor(() => expect(mockApi.getLabs).toHaveBeenCalled());
    
    // Verify Projects tab trigger is present
    expect(screen.getByRole('button', { name: /Projects/i })).toBeInTheDocument();
    
    // Active group Edit button is rendered
    mockApi.getGroups.mockResolvedValue([
      { id: 1, lab_id: 1, name: 'Active Group', description: 'desc', leader_user_id: 1, is_validated: true, created_at: '2024-01-01' }
    ]);
    render(<AdminPanel />);
    await waitFor(() => expect(screen.getByText(/Active Group/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /^Edit$/i })).toBeInTheDocument();
  });
});
