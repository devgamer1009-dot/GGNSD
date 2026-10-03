/**
 * Slice Demo Entry Point
 * P19 - Main entry point for the playable slice
 */

import { SliceDemo } from './SliceDemo.js';

async function main() {
  console.log('[Main] Starting CrownFall Slice Demo...');
  
  // Create demo instance
  const demo = new SliceDemo();
  
  try {
    // Initialize
    await demo.init();
    
    // Start the demo
    demo.start();
    
    console.log('[Main] Slice Demo running');
    console.log('[Main] Controls:');
    console.log('  - ESC: Toggle pause');
    console.log('  - S: Save game');
    console.log('  - L: Load game');
    console.log('  - Q: Advance quest');
    
  } catch (error) {
    console.error('[Main] Failed to start demo:', error);
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    demo.dispose();
  });
}

// Start the demo
main();
