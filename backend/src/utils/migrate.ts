import { initializeDatabase } from './database';
import { UserModel } from '../models/User';
import { Role } from '../types';

async function migrate() {
  console.log('Running database migration...');

  // Initialize database schema
  initializeDatabase();

  // Create default admin user if no users exist
  const users = UserModel.findAll();

  if (users.length === 0) {
    console.log('Creating default admin user...');
    await UserModel.create('admin', 'admin@whiskeybible.com', 'admin123', Role.ADMIN);
    console.log('Default admin user created:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    console.log('\n⚠️  Please change the password after first login!');
  }

  console.log('Migration completed successfully!');
  process.exit(0);
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
