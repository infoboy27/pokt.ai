// Simple file-based storage for registered users
// In production, this would be a real database

import fs from 'fs';
import path from 'path';

interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In production, this would be hashed
  company?: string;
  plan: string;
  organizationId: string;
  status: 'pending_verification' | 'verified';
  createdAt: string;
  verifiedAt?: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'users.json');

function loadUsers(): User[] {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
  }
  
  // Return default demo user if no storage file exists
  return [{
    id: 'current_user',
    name: 'Demo User',
    email: 'demo@pokt.ai',
    password: 'demo123',
    company: 'Demo Company',
    plan: 'starter',
    organizationId: 'org_current_user',
    status: 'verified',
    createdAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
  }];
}

function saveUsers(users: User[]): void {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
  }
}

export function createUser(userData: {
  name: string;
  email: string;
  password: string;
  company?: string;
  plan: string;
}): User {
  const users = loadUsers();
  
  const user: User = {
    id: `user_${Date.now()}`,
    name: userData.name,
    email: userData.email,
    password: userData.password, // In production, hash this
    company: userData.company,
    plan: userData.plan,
    organizationId: `org_${Date.now()}`,
    status: 'pending_verification',
    createdAt: new Date().toISOString(),
  };
  
  users.push(user);
  saveUsers(users);
  return user;
}

export function getUserByEmail(email: string): User | undefined {
  const users = loadUsers();
  return users.find(user => user.email === email);
}

export function verifyUser(email: string): User | undefined {
  const users = loadUsers();
  const user = users.find(user => user.email === email);
  if (user) {
    user.status = 'verified';
    user.verifiedAt = new Date().toISOString();
    saveUsers(users);
    return user;
  }
  return undefined;
}

export function authenticateUser(email: string, password: string): User | undefined {
  const users = loadUsers();
  const user = users.find(user => user.email === email);
  if (user && user.password === password && user.status === 'verified') {
    return user;
  }
  return undefined;
}

