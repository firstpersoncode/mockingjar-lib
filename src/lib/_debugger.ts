// import * as fs from 'fs';
// import * as path from 'path';

// let debugSessionId: string | null = null;
// let logs: Record<string, unknown[]> = {};

// /**
//  * Simple reusable logging function for any data
//  */
// export function logDebugData(filename: string, data: unknown): void {
//   // return;
//   if (['prod', 'production'].includes(process.env.NODE_ENV as string)) return;

//   try {
//     // Initialize session ID on first call
//     if (!debugSessionId) {
//       debugSessionId = new Date().toISOString().replace(/[:.]/g, '-');
//     }

//     const debugDir = path.join(
//       process.cwd(),
//       'src',
//       'lib',
//       '_debug_',
//       debugSessionId
//     );

//     if (!logs[filename]) {
//       logs[filename] = [];
//     }

//     // Create directories if they don't exist
//     if (!fs.existsSync(debugDir)) {
//       fs.mkdirSync(debugDir, { recursive: true });
//     }

//     logs[filename].push(data);

//     // Write the data to file
//     fs.writeFileSync(
//       path.join(debugDir, filename),
//       JSON.stringify(logs[filename], null, 2)
//     );

//     console.log(`[DEBUG] Logged ${filename} to: ${debugDir}`);
//   } catch (error) {
//     console.error(`[DEBUG] Failed to log ${filename}:`, error);
//   }
// }

// /**
//  * Reset debug session for new test runs
//  */
// export function resetDebugSession(): void {
//   debugSessionId = null;
//   logs = {};
// }
