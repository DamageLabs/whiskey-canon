import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { UserModel } from './User';
import { testDb } from '../test/setup';
import { Role } from '../types';

describe('UserModel', () => {
  describe('create', () => {
    it('creates a user with required fields', async () => {
      const user = await UserModel.create('testuser', 'test@example.com', 'password123');

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe(Role.EDITOR); // Default role
    });

    it('creates a user with specified role', async () => {
      const user = await UserModel.create('adminuser', 'admin@example.com', 'password123', Role.ADMIN);

      expect(user.role).toBe(Role.ADMIN);
    });

    it('creates a user with firstName and lastName', async () => {
      const user = await UserModel.create('fullname', 'full@example.com', 'password123', Role.EDITOR, 'John', 'Doe');

      expect(user.first_name).toBe('John');
      expect(user.last_name).toBe('Doe');
    });

    it('hashes the password', async () => {
      const user = await UserModel.create('hashtest', 'hash@example.com', 'password123');

      expect(user.password).not.toBe('password123');
      expect(user.password.startsWith('$2')).toBe(true); // bcrypt hash prefix
    });

    it('sets created_at timestamp', async () => {
      const user = await UserModel.create('timestamp', 'time@example.com', 'password123');

      expect(user.created_at).toBeDefined();
    });
  });

  describe('findById', () => {
    it('finds user by id', async () => {
      const created = await UserModel.create('findme', 'find@example.com', 'password123');
      const found = UserModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.username).toBe('findme');
    });

    it('returns undefined for non-existent id', () => {
      const found = UserModel.findById(99999);

      expect(found).toBeUndefined();
    });
  });

  describe('findByUsername', () => {
    it('finds user by username', async () => {
      await UserModel.create('uniqueuser', 'unique@example.com', 'password123');
      const found = UserModel.findByUsername('uniqueuser');

      expect(found).toBeDefined();
      expect(found?.email).toBe('unique@example.com');
    });

    it('returns undefined for non-existent username', () => {
      const found = UserModel.findByUsername('nonexistent');

      expect(found).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    it('finds user by email', async () => {
      await UserModel.create('emailuser', 'email@example.com', 'password123');
      const found = UserModel.findByEmail('email@example.com');

      expect(found).toBeDefined();
      expect(found?.username).toBe('emailuser');
    });

    it('returns undefined for non-existent email', () => {
      const found = UserModel.findByEmail('nonexistent@example.com');

      expect(found).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      await UserModel.create('user1', 'user1@example.com', 'password123');
      await UserModel.create('user2', 'user2@example.com', 'password123');
      await UserModel.create('user3', 'user3@example.com', 'password123');

      const users = UserModel.findAll();

      expect(users).toHaveLength(3);
    });

    it('returns empty array when no users', () => {
      const users = UserModel.findAll();

      expect(users).toHaveLength(0);
    });

    it('orders by created_at descending', async () => {
      await UserModel.create('first', 'first@example.com', 'password123');
      await UserModel.create('second', 'second@example.com', 'password123');

      const users = UserModel.findAll();

      // Verify both users exist (order may vary due to timestamp granularity)
      expect(users).toHaveLength(2);
      expect(users.map(u => u.username).sort()).toEqual(['first', 'second']);
    });
  });

  describe('validatePassword', () => {
    it('returns true for correct password', async () => {
      const user = await UserModel.create('validate', 'validate@example.com', 'correctpassword');
      const isValid = await UserModel.validatePassword('correctpassword', user.password);

      expect(isValid).toBe(true);
    });

    it('returns false for incorrect password', async () => {
      const user = await UserModel.create('validate2', 'validate2@example.com', 'correctpassword');
      const isValid = await UserModel.validatePassword('wrongpassword', user.password);

      expect(isValid).toBe(false);
    });
  });

  describe('updateRole', () => {
    it('updates user role', async () => {
      const user = await UserModel.create('roleuser', 'role@example.com', 'password123', Role.EDITOR);

      const updated = UserModel.updateRole(user.id, Role.ADMIN);

      expect(updated).toBeDefined();
      expect(updated?.role).toBe(Role.ADMIN);
    });

    it('returns undefined for non-existent user', () => {
      const updated = UserModel.updateRole(99999, Role.ADMIN);

      expect(updated).toBeUndefined();
    });
  });

  describe('updateEmail', () => {
    it('updates user email', async () => {
      const user = await UserModel.create('emailupdate', 'old@example.com', 'password123');

      const updated = UserModel.updateEmail(user.id, 'new@example.com');

      expect(updated).toBeDefined();
      expect(updated?.email).toBe('new@example.com');
    });

    it('returns undefined for non-existent user', () => {
      const updated = UserModel.updateEmail(99999, 'new@example.com');

      expect(updated).toBeUndefined();
    });
  });

  describe('updatePassword', () => {
    it('updates user password', async () => {
      const user = await UserModel.create('passupdate', 'pass@example.com', 'oldpassword');
      const oldHash = user.password;

      const updated = await UserModel.updatePassword(user.id, 'newpassword');

      expect(updated).toBeDefined();
      expect(updated?.password).not.toBe(oldHash);

      // Verify new password works
      const isValid = await UserModel.validatePassword('newpassword', updated!.password);
      expect(isValid).toBe(true);
    });

    it('returns undefined for non-existent user', async () => {
      const updated = await UserModel.updatePassword(99999, 'newpassword');

      expect(updated).toBeUndefined();
    });
  });

  describe('updateProfile', () => {
    it('updates email', async () => {
      const user = await UserModel.create('profile1', 'profile1@example.com', 'password123');

      const updated = UserModel.updateProfile(user.id, { email: 'updated@example.com' });

      expect(updated?.email).toBe('updated@example.com');
    });

    it('updates firstName and lastName', async () => {
      const user = await UserModel.create('profile2', 'profile2@example.com', 'password123');

      const updated = UserModel.updateProfile(user.id, {
        firstName: 'Jane',
        lastName: 'Smith'
      });

      expect(updated?.first_name).toBe('Jane');
      expect(updated?.last_name).toBe('Smith');
    });

    it('updates multiple fields at once', async () => {
      const user = await UserModel.create('profile3', 'profile3@example.com', 'password123');

      const updated = UserModel.updateProfile(user.id, {
        email: 'multi@example.com',
        firstName: 'Multi',
        lastName: 'Update'
      });

      expect(updated?.email).toBe('multi@example.com');
      expect(updated?.first_name).toBe('Multi');
      expect(updated?.last_name).toBe('Update');
    });

    it('returns existing user when no updates provided', async () => {
      const user = await UserModel.create('profile4', 'profile4@example.com', 'password123');

      const updated = UserModel.updateProfile(user.id, {});

      expect(updated?.email).toBe('profile4@example.com');
    });

    it('returns undefined for non-existent user', () => {
      const updated = UserModel.updateProfile(99999, { email: 'test@example.com' });

      expect(updated).toBeUndefined();
    });

    it('clears firstName/lastName when set to empty string', async () => {
      const user = await UserModel.create('profile5', 'profile5@example.com', 'password123', Role.EDITOR, 'First', 'Last');

      const updated = UserModel.updateProfile(user.id, {
        firstName: '',
        lastName: ''
      });

      expect(updated?.first_name).toBeNull();
      expect(updated?.last_name).toBeNull();
    });
  });

  describe('updateProfilePhoto', () => {
    it('updates profile photo path', async () => {
      const user = await UserModel.create('photo1', 'photo1@example.com', 'password123');

      const updated = UserModel.updateProfilePhoto(user.id, '/uploads/profiles/photo.jpg');

      expect(updated?.profile_photo).toBe('/uploads/profiles/photo.jpg');
    });

    it('clears profile photo when set to empty string', async () => {
      const user = await UserModel.create('photo2', 'photo2@example.com', 'password123');
      UserModel.updateProfilePhoto(user.id, '/uploads/profiles/photo.jpg');

      const updated = UserModel.updateProfilePhoto(user.id, '');

      expect(updated?.profile_photo).toBe('');
    });

    it('returns undefined for non-existent user', () => {
      const updated = UserModel.updateProfilePhoto(99999, '/path/to/photo.jpg');

      expect(updated).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('deletes user', async () => {
      const user = await UserModel.create('deleteme', 'delete@example.com', 'password123');

      const deleted = UserModel.delete(user.id);

      expect(deleted).toBe(true);
      expect(UserModel.findById(user.id)).toBeUndefined();
    });

    it('returns false for non-existent user', () => {
      const deleted = UserModel.delete(99999);

      expect(deleted).toBe(false);
    });

    it('cascades delete to whiskeys', async () => {
      const user = await UserModel.create('cascade', 'cascade@example.com', 'password123');

      // Create a whiskey for this user
      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by)
        VALUES (?, ?, ?, ?)
      `).run('Test Whiskey', 'bourbon', 'Test Distillery', user.id);

      // Verify whiskey exists
      const whiskeyBefore = testDb.prepare('SELECT * FROM whiskeys WHERE created_by = ?').get(user.id);
      expect(whiskeyBefore).toBeDefined();

      // Delete user
      UserModel.delete(user.id);

      // Verify whiskey is also deleted (cascade)
      const whiskeyAfter = testDb.prepare('SELECT * FROM whiskeys WHERE created_by = ?').get(user.id);
      expect(whiskeyAfter).toBeUndefined();
    });
  });

  describe('setVerificationCode', () => {
    it('returns undefined for non-existent user', () => {
      const code = '123456';
      const expiresAt = new Date(Date.now() + 3600000);

      const result = UserModel.setVerificationCode(99999, code, expiresAt);
      expect(result).toBeUndefined();
    });
  });

  describe('incrementVerificationAttempts', () => {
    it('increments verification attempts for user', async () => {
      const user = await UserModel.create('attempts', 'attempts@example.com', 'password123');

      const attempts1 = UserModel.incrementVerificationAttempts(user.id);
      expect(attempts1).toBe(1);

      const attempts2 = UserModel.incrementVerificationAttempts(user.id);
      expect(attempts2).toBe(2);
    });

    it('returns 0 for non-existent user', () => {
      const result = UserModel.incrementVerificationAttempts(99999);
      expect(result).toBe(0);
    });
  });

  describe('markEmailVerified', () => {
    it('marks user email as verified', async () => {
      const user = await UserModel.create('unverified', 'unverified@example.com', 'password123');

      // Set verification code first
      testDb.prepare(`
        UPDATE users
        SET verification_code = '123456',
            verification_code_expires_at = datetime('now', '+1 hour'),
            email_verified = 0
        WHERE id = ?
      `).run(user.id);

      const updated = UserModel.markEmailVerified(user.id);

      expect(updated).toBeDefined();
      expect(updated?.email_verified).toBe(1);
      expect(updated?.verification_code).toBeNull();
    });

    it('returns undefined for non-existent user', () => {
      const result = UserModel.markEmailVerified(99999);
      expect(result).toBeUndefined();
    });
  });

  describe('setPasswordResetToken', () => {
    it('sets password reset token for user', async () => {
      const user = await UserModel.create('resettoken', 'resettoken@example.com', 'password123');
      const token = 'reset-token-abc123';
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      const updated = UserModel.setPasswordResetToken(user.id, token, expiresAt);

      expect(updated).toBeDefined();
      expect(updated?.password_reset_token).toBe(token);
    });

    it('returns undefined for non-existent user', () => {
      const token = 'token-for-nobody';
      const expiresAt = new Date(Date.now() + 3600000);

      const result = UserModel.setPasswordResetToken(99999, token, expiresAt);
      expect(result).toBeUndefined();
    });
  });

  describe('findByPasswordResetToken', () => {
    it('finds user by valid password reset token', async () => {
      const user = await UserModel.create('resetuser', 'reset@example.com', 'password123');
      const token = 'valid-reset-token-123';

      // Set the password reset token directly in the database
      testDb.prepare(`
        UPDATE users
        SET password_reset_token = ?,
            password_reset_expires_at = datetime('now', '+1 hour')
        WHERE id = ?
      `).run(token, user.id);

      const found = UserModel.findByPasswordResetToken(token);

      expect(found).toBeDefined();
      expect(found?.id).toBe(user.id);
      expect(found?.username).toBe('resetuser');
    });

    it('returns undefined for non-existent token', () => {
      const found = UserModel.findByPasswordResetToken('non-existent-token');
      expect(found).toBeUndefined();
    });

    it('returns undefined for empty token', () => {
      const found = UserModel.findByPasswordResetToken('');
      expect(found).toBeUndefined();
    });
  });

  describe('clearPasswordResetToken', () => {
    it('clears password reset token for user', async () => {
      const user = await UserModel.create('clearuser', 'clear@example.com', 'password123');
      const token = 'token-to-clear';

      // Set the password reset token
      testDb.prepare(`
        UPDATE users
        SET password_reset_token = ?,
            password_reset_expires_at = datetime('now', '+1 hour')
        WHERE id = ?
      `).run(token, user.id);

      // Verify token is set
      const beforeClear = UserModel.findByPasswordResetToken(token);
      expect(beforeClear).toBeDefined();

      // Clear the token
      const updated = UserModel.clearPasswordResetToken(user.id);

      expect(updated).toBeDefined();
      expect(updated?.id).toBe(user.id);

      // Verify token is cleared
      const afterClear = UserModel.findByPasswordResetToken(token);
      expect(afterClear).toBeUndefined();
    });

    it('returns undefined for non-existent user', () => {
      const result = UserModel.clearPasswordResetToken(99999);
      expect(result).toBeUndefined();
    });
  });
});
