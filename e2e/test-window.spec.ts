import { test, expect } from './fixtures/electron-app';

test('check window.electron', async ({ mainWindow }) => {
  const result = await mainWindow.evaluate(() => {
    return {
      hasElectron: typeof (window as any).electron !== 'undefined',
      hasElectronAPI: typeof (window as any).electronAPI !== 'undefined',
      electronKeys: (window as any).electron ? Object.keys((window as any).electron) : [],
      electronAPIKeys: (window as any).electronAPI ? Object.keys((window as any).electronAPI) : [],
    };
  });
  console.log('Window object check:', JSON.stringify(result, null, 2));
});
