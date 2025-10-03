import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BloomProvider, useAuth } from '../src/provider';

// Mock the client
vi.mock('@bloom/client', () => ({
  createBloomClient: vi.fn(() => ({
    getSession: vi.fn().mockResolvedValue({ data: null }),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    deleteAccount: vi.fn(),
  })),
}));

describe('BloomProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', async () => {
    render(
      <BloomProvider>
        <div>Test Child</div>
      </BloomProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Child')).toBeDefined();
    });
  });

  it('should provide auth context', async () => {
    const TestComponent = () => {
      const auth = useAuth();
      return (
        <div>
          <div>Loading: {String(auth.isLoading)}</div>
          <div>Signed In: {String(auth.isSignedIn)}</div>
        </div>
      );
    };

    render(
      <BloomProvider>
        <TestComponent />
      </BloomProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Loading: false/)).toBeDefined();
    });
  });
});

describe('useAuth', () => {
  it('should throw error when used outside provider', () => {
    const TestComponent = () => {
      useAuth();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within BloomProvider');
  });
});
