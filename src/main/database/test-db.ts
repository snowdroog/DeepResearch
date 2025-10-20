/**
 * Database Test Script
 * Run with: tsx src/main/database/test-db.ts
 */

import { db } from './db.js';
import { randomUUID } from 'crypto';

console.log('\n=== DeepResearch Database Test ===\n');

// Mock app.getPath for testing
const mockApp = {
  getPath: (name: string) => {
    if (name === 'userData') {
      return process.cwd() + '/.test-data';
    }
    return '';
  },
};

// Replace electron app with mock
(global as any).app = mockApp;

try {
  // Initialize database
  console.log('1. Initializing database...');
  db.initialize();
  console.log('✓ Database initialized\n');

  // Test: Create sessions
  console.log('2. Creating test sessions...');
  const session1 = db.createSession({
    id: randomUUID(),
    provider: 'claude',
    name: 'Claude Research',
    partition: 'persist:claude-test',
  });
  console.log('✓ Created session:', session1.name);

  const session2 = db.createSession({
    id: randomUUID(),
    provider: 'openai',
    name: 'ChatGPT Work',
    partition: 'persist:openai-test',
  });
  console.log('✓ Created session:', session2.name);

  // Test: Get sessions
  console.log('\n3. Retrieving sessions...');
  const sessions = db.getSessions();
  console.log(`✓ Found ${sessions.length} sessions`);

  // Test: Create captures
  console.log('\n4. Creating test captures...');
  const capture1 = db.createCapture({
    id: randomUUID(),
    session_id: session1.id,
    provider: 'claude',
    prompt: 'What is SQLite?',
    response:
      'SQLite is a C-language library that implements a small, fast, self-contained, high-reliability, full-featured, SQL database engine. It is the most used database engine in the world.',
    response_format: 'text',
    model: 'claude-3-5-sonnet',
    tags: JSON.stringify(['database', 'sqlite', 'learning']),
  });
  console.log('✓ Created capture 1');

  const capture2 = db.createCapture({
    id: randomUUID(),
    session_id: session1.id,
    provider: 'claude',
    prompt: 'How does full-text search work in SQLite?',
    response:
      'SQLite provides FTS5 (Full-Text Search 5), a virtual table module that allows users to perform full-text searches. It creates an inverted index for fast text lookups and supports Boolean queries, phrase searches, and proximity searches.',
    response_format: 'text',
    model: 'claude-3-5-sonnet',
    tags: JSON.stringify(['database', 'fts5', 'search']),
  });
  console.log('✓ Created capture 2');

  const capture3 = db.createCapture({
    id: randomUUID(),
    session_id: session2.id,
    provider: 'openai',
    prompt: 'Explain Electron BrowserView',
    response:
      'BrowserView is an Electron API that allows you to embed web content within a BrowserWindow. Unlike webview tags, BrowserViews run in a separate process and provide better isolation and security.',
    response_format: 'text',
    model: 'gpt-4',
    tags: JSON.stringify(['electron', 'browserview']),
  });
  console.log('✓ Created capture 3');

  // Test: Get all captures
  console.log('\n5. Retrieving all captures...');
  const allCaptures = db.getCaptures();
  console.log(`✓ Found ${allCaptures.length} captures`);

  // Test: Filter by provider
  console.log('\n6. Filtering captures by provider (claude)...');
  const claudeCaptures = db.getCaptures({ provider: 'claude' });
  console.log(`✓ Found ${claudeCaptures.length} Claude captures`);

  // Test: Full-text search
  console.log('\n7. Testing full-text search for "full-text"...');
  const searchResults = db.searchCaptures('full-text');
  console.log(`✓ Found ${searchResults.length} matching captures`);
  if (searchResults.length > 0) {
    console.log(`  - "${searchResults[0].prompt}"`);
  }

  // Test: Update tags
  console.log('\n8. Updating tags on capture...');
  db.updateCaptureTags(capture1.id, ['database', 'sqlite', 'learning', 'tutorial']);
  const updatedCapture = db.getCapture(capture1.id);
  console.log('✓ Updated tags:', updatedCapture?.tags);

  // Test: Add notes
  console.log('\n9. Adding notes to capture...');
  db.updateCaptureNotes(capture2.id, 'Great explanation of FTS5 - review later');
  const captureWithNotes = db.getCapture(capture2.id);
  console.log('✓ Added notes:', captureWithNotes?.notes);

  // Test: Archive capture
  console.log('\n10. Archiving a capture...');
  db.setCaptureArchived(capture3.id, true);
  const archivedCount = db.getCaptures({ isArchived: true }).length;
  console.log(`✓ Archived captures: ${archivedCount}`);

  // Test: Database statistics
  console.log('\n11. Database statistics...');
  const stats = db.getStats();
  console.log('✓ Stats:');
  console.log(`  - Total sessions: ${stats.totalSessions}`);
  console.log(`  - Active sessions: ${stats.activeSessions}`);
  console.log(`  - Total captures: ${stats.totalCaptures}`);
  console.log(`  - Archived captures: ${stats.archivedCaptures}`);
  console.log(`  - Database size: ${(stats.dbSizeBytes / 1024).toFixed(2)} KB`);

  // Clean up
  console.log('\n12. Cleaning up test data...');
  db.deleteSession(session1.id);
  db.deleteSession(session2.id);
  console.log('✓ Deleted test sessions (captures deleted via CASCADE)');

  const finalStats = db.getStats();
  console.log('✓ Final stats:', finalStats);

  // Close database
  db.close();
  console.log('\n✓ Database connection closed');

  console.log('\n=== All Tests Passed! ===\n');
} catch (error) {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
}
