import { initializeDatabase } from './database';

console.log('Adding new fields to whiskeys table...');
initializeDatabase();
console.log('All new fields added successfully!');
process.exit(0);
