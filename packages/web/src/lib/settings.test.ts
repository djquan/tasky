import { beforeEach, describe, expect, it } from 'vitest';
import { getSyncSettings, resetSettings, saveSettings } from './settings';

const SETTINGS_KEY = 'tasky-settings';

describe('settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default sync settings', () => {
    expect(getSyncSettings()).toEqual({
      enabled: false,
      syncUrl: 'http://localhost:8080',
    });
  });

  it('saves and loads syncUrl settings', () => {
    saveSettings({
      enabled: true,
      syncUrl: 'https://sync.example.com',
    });

    expect(getSyncSettings()).toEqual({
      enabled: true,
      syncUrl: 'https://sync.example.com',
    });
  });

  it('migrates legacy tokenUrl settings to syncUrl', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      enabled: true,
      tokenUrl: 'http://localhost:8092',
    }));

    expect(getSyncSettings()).toEqual({
      enabled: true,
      syncUrl: 'http://localhost:8092',
    });
    expect(localStorage.getItem(SETTINGS_KEY)).toBe(JSON.stringify({
      enabled: true,
      syncUrl: 'http://localhost:8092',
    }));
  });

  it('rejects invalid sync URLs', () => {
    expect(() => saveSettings({
      enabled: true,
      syncUrl: 'ftp://sync.example.com',
    })).toThrow('Invalid sync URL');
  });

  it('resets settings to defaults', () => {
    saveSettings({
      enabled: true,
      syncUrl: 'https://sync.example.com',
    });

    resetSettings();

    expect(getSyncSettings()).toEqual({
      enabled: false,
      syncUrl: 'http://localhost:8080',
    });
  });
});
