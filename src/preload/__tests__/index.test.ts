/**
 * Unit Tests for Preload Script
 * Tests the IPC bridge API exposed to the renderer process
 *
 * Coverage:
 * - Window control methods (minimize, maximize, close)
 * - Auth methods (login, logout, getSession)
 * - Session management methods (create, activate, delete, list, getActive)
 * - Data operations (getCaptures, getCapture, search, updates, delete, stats)
 * - Export operations (showSaveDialog, write methods, progress listener)
 * - contextBridge exposure
 * - IPC channel invocations
 * - Return value forwarding
 * - Event listener management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock electron module
const mockInvoke = vi.fn();
const mockSend = vi.fn();
const mockOn = vi.fn();
const mockRemoveListener = vi.fn();
const mockExposeInMainWorld = vi.fn();

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: mockExposeInMainWorld,
  },
  ipcRenderer: {
    invoke: mockInvoke,
    send: mockSend,
    on: mockOn,
    removeListener: mockRemoveListener,
  },
}));

describe('Preload Script', () => {
  let electronAPI: any;
  let electron: any;

  beforeEach(async () => {
    // Reset modules to ensure fresh import
    vi.resetModules();

    // Clear all mocks
    vi.clearAllMocks();

    // Dynamically import the preload script (this will execute it and call exposeInMainWorld)
    await import('../index');

    // Extract the exposed APIs from the mock calls
    const calls = mockExposeInMainWorld.mock.calls;

    // Find electronAPI and electron objects
    const electronAPICall = calls.find((call) => call[0] === 'electronAPI');
    const electronCall = calls.find((call) => call[0] === 'electron');

    electronAPI = electronAPICall ? electronAPICall[1] : null;
    electron = electronCall ? electronCall[1] : null;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Context Bridge Exposure', () => {
    it('should expose electronAPI to main world', () => {
      expect(mockExposeInMainWorld).toHaveBeenCalledWith('electronAPI', expect.any(Object));
    });

    it('should expose electron object for testing', () => {
      expect(mockExposeInMainWorld).toHaveBeenCalledWith('electron', expect.any(Object));
    });

    it('should expose all required API categories', () => {
      expect(electronAPI).toHaveProperty('minimizeWindow');
      expect(electronAPI).toHaveProperty('maximizeWindow');
      expect(electronAPI).toHaveProperty('closeWindow');
      expect(electronAPI).toHaveProperty('auth');
      expect(electronAPI).toHaveProperty('sessions');
      expect(electronAPI).toHaveProperty('data');
      expect(electronAPI).toHaveProperty('export');
    });
  });

  describe('Window Controls', () => {
    it('should send minimize window command', () => {
      electronAPI.minimizeWindow();
      expect(mockSend).toHaveBeenCalledWith('window:minimize');
    });

    it('should send maximize window command', () => {
      electronAPI.maximizeWindow();
      expect(mockSend).toHaveBeenCalledWith('window:maximize');
    });

    it('should send close window command', () => {
      electronAPI.closeWindow();
      expect(mockSend).toHaveBeenCalledWith('window:close');
    });
  });

  describe('Auth Methods', () => {
    it('should invoke login with provider', async () => {
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.auth.login('google');

      expect(mockInvoke).toHaveBeenCalledWith('auth:login', 'google');
    });

    it('should invoke logout', async () => {
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.auth.logout();

      expect(mockInvoke).toHaveBeenCalledWith('auth:logout');
    });

    it('should invoke getSession', async () => {
      const mockSession = { id: '123', user: 'test' };
      mockInvoke.mockResolvedValue(mockSession);

      const result = await electronAPI.auth.getSession();

      expect(mockInvoke).toHaveBeenCalledWith('auth:get-session');
      expect(result).toEqual(mockSession);
    });
  });

  describe('Session Management', () => {
    it('should create session with config', async () => {
      const config = { provider: 'claude' as const, name: 'Test Session' };
      mockInvoke.mockResolvedValue({ id: 'session-123' });

      const result = await electronAPI.sessions.create(config);

      expect(mockInvoke).toHaveBeenCalledWith('session:create', config);
      expect(result).toEqual({ id: 'session-123' });
    });

    it('should activate session by id', async () => {
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.sessions.activate('session-123');

      expect(mockInvoke).toHaveBeenCalledWith('session:activate', 'session-123');
    });

    it('should delete session by id', async () => {
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.sessions.delete('session-123');

      expect(mockInvoke).toHaveBeenCalledWith('session:delete', 'session-123');
    });

    it('should list all sessions', async () => {
      const mockSessions = [{ id: '1' }, { id: '2' }];
      mockInvoke.mockResolvedValue(mockSessions);

      const result = await electronAPI.sessions.list();

      expect(mockInvoke).toHaveBeenCalledWith('session:list', undefined);
      expect(result).toEqual(mockSessions);
    });

    it('should list sessions with includeInactive flag', async () => {
      mockInvoke.mockResolvedValue([]);

      await electronAPI.sessions.list(true);

      expect(mockInvoke).toHaveBeenCalledWith('session:list', true);
    });

    it('should get active session', async () => {
      const mockActiveSession = { id: 'active-123' };
      mockInvoke.mockResolvedValue(mockActiveSession);

      const result = await electronAPI.sessions.getActive();

      expect(mockInvoke).toHaveBeenCalledWith('session:getActive');
      expect(result).toEqual(mockActiveSession);
    });
  });

  describe('Data Operations', () => {
    it('should get captures without filters', async () => {
      const mockCaptures = [{ id: '1' }, { id: '2' }];
      mockInvoke.mockResolvedValue(mockCaptures);

      const result = await electronAPI.data.getCaptures();

      expect(mockInvoke).toHaveBeenCalledWith('data:getCaptures', undefined);
      expect(result).toEqual(mockCaptures);
    });

    it('should get captures with filters', async () => {
      const filters = { provider: 'claude', archived: false };
      mockInvoke.mockResolvedValue([]);

      await electronAPI.data.getCaptures(filters);

      expect(mockInvoke).toHaveBeenCalledWith('data:getCaptures', filters);
    });

    it('should get single capture by id', async () => {
      const mockCapture = { id: 'capture-123', content: 'test' };
      mockInvoke.mockResolvedValue(mockCapture);

      const result = await electronAPI.data.getCapture('capture-123');

      expect(mockInvoke).toHaveBeenCalledWith('data:getCapture', 'capture-123');
      expect(result).toEqual(mockCapture);
    });

    it('should search captures with query only', async () => {
      mockInvoke.mockResolvedValue([]);

      await electronAPI.data.searchCaptures('test query');

      expect(mockInvoke).toHaveBeenCalledWith('data:searchCaptures', 'test query', undefined);
    });

    it('should search captures with query and filters', async () => {
      const filters = { provider: 'openai' };
      mockInvoke.mockResolvedValue([]);

      await electronAPI.data.searchCaptures('test query', filters);

      expect(mockInvoke).toHaveBeenCalledWith('data:searchCaptures', 'test query', filters);
    });

    it('should update capture tags', async () => {
      const tags = ['tag1', 'tag2', 'tag3'];
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.data.updateTags('capture-123', tags);

      expect(mockInvoke).toHaveBeenCalledWith('data:updateTags', 'capture-123', tags);
    });

    it('should update capture notes', async () => {
      const notes = 'These are my notes';
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.data.updateNotes('capture-123', notes);

      expect(mockInvoke).toHaveBeenCalledWith('data:updateNotes', 'capture-123', notes);
    });

    it('should set capture archived status to true', async () => {
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.data.setArchived('capture-123', true);

      expect(mockInvoke).toHaveBeenCalledWith('data:setArchived', 'capture-123', true);
    });

    it('should set capture archived status to false', async () => {
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.data.setArchived('capture-123', false);

      expect(mockInvoke).toHaveBeenCalledWith('data:setArchived', 'capture-123', false);
    });

    it('should delete capture by id', async () => {
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.data.deleteCapture('capture-123');

      expect(mockInvoke).toHaveBeenCalledWith('data:deleteCapture', 'capture-123');
    });

    it('should get database stats', async () => {
      const mockStats = { totalCaptures: 100, providers: { claude: 50 } };
      mockInvoke.mockResolvedValue(mockStats);

      const result = await electronAPI.data.getStats();

      expect(mockInvoke).toHaveBeenCalledWith('data:getStats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('Export Operations', () => {
    it('should show save dialog with default options', async () => {
      const mockPath = '/path/to/file.json';
      mockInvoke.mockResolvedValue({ filePath: mockPath });

      const result = await electronAPI.export.showSaveDialog({});

      expect(mockInvoke).toHaveBeenCalledWith('export:showSaveDialog', {});
      expect(result).toEqual({ filePath: mockPath });
    });

    it('should show save dialog with custom options', async () => {
      const options = {
        defaultPath: 'export.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      };
      mockInvoke.mockResolvedValue({ filePath: '/path/to/export.json' });

      await electronAPI.export.showSaveDialog(options);

      expect(mockInvoke).toHaveBeenCalledWith('export:showSaveDialog', options);
    });

    it('should write JSON data to file', async () => {
      const data = { captures: [{ id: '1' }] };
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.export.writeJson('/path/to/file.json', data);

      expect(mockInvoke).toHaveBeenCalledWith('export:writeJson', '/path/to/file.json', data);
    });

    it('should write JSON stream without filters', async () => {
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.export.writeJsonStream('/path/to/file.json');

      expect(mockInvoke).toHaveBeenCalledWith('export:writeJsonStream', '/path/to/file.json', undefined);
    });

    it('should write JSON stream with filters', async () => {
      const filters = { provider: 'claude' };
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.export.writeJsonStream('/path/to/file.json', filters);

      expect(mockInvoke).toHaveBeenCalledWith('export:writeJsonStream', '/path/to/file.json', filters);
    });

    it('should write CSV without filters', async () => {
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.export.writeCsv('/path/to/file.csv');

      expect(mockInvoke).toHaveBeenCalledWith('export:writeCsv', '/path/to/file.csv', undefined);
    });

    it('should write CSV with filters', async () => {
      const filters = { archived: false };
      mockInvoke.mockResolvedValue({ success: true });

      await electronAPI.export.writeCsv('/path/to/file.csv', filters);

      expect(mockInvoke).toHaveBeenCalledWith('export:writeCsv', '/path/to/file.csv', filters);
    });

    it('should register progress listener and receive updates', () => {
      const callback = vi.fn();
      const mockProgress = { processed: 50, total: 100, percentage: 50 };

      // Register the listener
      const unsubscribe = electronAPI.export.onProgress(callback);

      // Verify listener was registered
      expect(mockOn).toHaveBeenCalledWith('export:progress', expect.any(Function));

      // Simulate progress event
      const listener = mockOn.mock.calls[0][1];
      listener(null, mockProgress);

      // Verify callback was called with progress data
      expect(callback).toHaveBeenCalledWith(mockProgress);

      // Test unsubscribe
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();

      expect(mockRemoveListener).toHaveBeenCalledWith('export:progress', listener);
    });

    it('should handle multiple progress updates', () => {
      const callback = vi.fn();

      electronAPI.export.onProgress(callback);
      const listener = mockOn.mock.calls[0][1];

      // Simulate multiple progress events
      listener(null, { processed: 25, total: 100, percentage: 25 });
      listener(null, { processed: 50, total: 100, percentage: 50 });
      listener(null, { processed: 100, total: 100, percentage: 100 });

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, { processed: 25, total: 100, percentage: 25 });
      expect(callback).toHaveBeenNthCalledWith(2, { processed: 50, total: 100, percentage: 50 });
      expect(callback).toHaveBeenNthCalledWith(3, { processed: 100, total: 100, percentage: 100 });
    });
  });

  describe('Error Handling', () => {
    it('should forward IPC errors to caller', async () => {
      const error = new Error('IPC communication failed');
      mockInvoke.mockRejectedValue(error);

      await expect(electronAPI.sessions.list()).rejects.toThrow('IPC communication failed');
    });

    it('should handle errors in data operations', async () => {
      mockInvoke.mockRejectedValue(new Error('Database error'));

      await expect(electronAPI.data.getCaptures()).rejects.toThrow('Database error');
    });

    it('should handle errors in export operations', async () => {
      mockInvoke.mockRejectedValue(new Error('Write failed'));

      await expect(electronAPI.export.writeJson('/path', {})).rejects.toThrow('Write failed');
    });
  });

  describe('Raw Electron API', () => {
    it('should expose raw ipcRenderer for testing', () => {
      expect(electron).toHaveProperty('ipcRenderer');
      expect(electron.ipcRenderer).toHaveProperty('invoke');
      expect(electron.ipcRenderer).toHaveProperty('send');
      expect(electron.ipcRenderer).toHaveProperty('on');
      expect(electron.ipcRenderer).toHaveProperty('removeListener');
    });

    it('should allow direct IPC invocation', async () => {
      mockInvoke.mockResolvedValue({ result: 'test' });

      const result = await electron.ipcRenderer.invoke('custom:channel', 'arg1', 'arg2');

      expect(mockInvoke).toHaveBeenCalledWith('custom:channel', 'arg1', 'arg2');
      expect(result).toEqual({ result: 'test' });
    });

    it('should allow direct IPC send', () => {
      electron.ipcRenderer.send('custom:channel', 'data');

      expect(mockSend).toHaveBeenCalledWith('custom:channel', 'data');
    });
  });
});
