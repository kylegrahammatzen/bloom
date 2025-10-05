/**
 * Common passwords blacklist
 *
 * This list contains common passwords that attackers use in dictionary attacks.
 * Even though many simple passwords won't pass our complexity requirements,
 * this list focuses on common patterns that DO meet complexity rules but are still weak.
 *
 * Sources: HaveIBeenPwned, SecLists, common password databases
 */

export const COMMON_PASSWORDS = new Set([
  // Common patterns with numbers and special chars
  'Password1!',
  'Password123!',
  'Password@1',
  'Password@123',
  'Admin123!',
  'Admin@123',
  'Welcome1!',
  'Welcome123!',
  'Welcome@1',
  'Welcome@123',
  'Qwerty123!',
  'Qwerty@123',
  'Abc123!@#',
  'Abc@123',
  'Test123!',
  'Test@123',
  'User123!',
  'User@123',
  'Login123!',
  'Login@123',

  // Keyboard patterns with modifications
  'Qwerty1!',
  'Qwerty12!',
  'Asdfgh1!',
  'Zxcvbn1!',
  'Qazwsx1!',
  'Q1w2e3r4!',
  'A1s2d3f4!',

  // Common words with predictable modifications
  'Summer2024!',
  'Winter2024!',
  'Spring2024!',
  'Autumn2024!',
  'Summer2025!',
  'Winter2025!',
  'January1!',
  'February1!',
  'Monday123!',
  'Sunday123!',

  // Company/service related
  'Company123!',
  'Business123!',
  'Service123!',
  'Account123!',
  'Portal123!',

  // Name-based patterns (common first names)
  'Michael1!',
  'Michael123!',
  'Jennifer1!',
  'Jennifer123!',
  'Robert1!',
  'Robert123!',
  'Jessica1!',
  'Jessica123!',

  // Sequential patterns
  'Abcd1234!',
  'Abc12345!',
  '1qaz2wsx!',
  '1qaz!QAZ',

  // Common substitutions (l33t speak)
  'P@ssw0rd',
  'P@ssw0rd1',
  'P@ssw0rd!',
  'Passw0rd!',
  'Passw0rd1!',
  'L3tM3In!',
  'Adm1n!',
  'Adm1n123!',

  // Sports teams (examples)
  'Yankees1!',
  'Lakers123!',
  'Cowboys1!',

  // Technology related
  'Computer1!',
  'Internet1!',
  'Database1!',
  'Server123!',
  'Network1!',

  // Family related
  'Family123!',
  'Mother123!',
  'Father123!',

  // Simple phrases
  'LetMeIn1!',
  'LetMeIn123!',
  'TrustNo1!',
  'ILoveYou1!',

  // Default passwords that meet requirements
  'Default123!',
  'Change123!',
  'ChangeMe1!',
  'Temp123!',
  'Temporary1!',
]);

/**
 * Check if a password is in the common passwords blacklist
 * Performs case-insensitive comparison
 *
 * @param password - Password to check
 * @returns True if password is common (should be rejected)
 */
export function isCommonPassword(password: string): boolean {
  // Check exact match (case-insensitive)
  if (COMMON_PASSWORDS.has(password)) {
    return true;
  }

  // Check lowercase version
  const lowerPassword = password.toLowerCase();
  for (const commonPass of COMMON_PASSWORDS) {
    if (commonPass.toLowerCase() === lowerPassword) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate password entropy (randomness)
 * Higher entropy = stronger password
 *
 * @param password - Password to analyze
 * @returns Entropy in bits
 */
export function calculatePasswordEntropy(password: string): number {
  let charsetSize = 0;

  // Determine character set size
  if (/[a-z]/.test(password)) charsetSize += 26;        // lowercase
  if (/[A-Z]/.test(password)) charsetSize += 26;        // uppercase
  if (/[0-9]/.test(password)) charsetSize += 10;        // digits
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32; // special chars (approximate)

  // Entropy = log2(charsetSize^length)
  // Simplified: length * log2(charsetSize)
  const entropy = password.length * Math.log2(charsetSize);

  return entropy;
}

/**
 * Check if password has sufficient entropy
 * Recommended minimum: 50 bits for strong passwords
 *
 * @param password - Password to check
 * @returns True if entropy is sufficient
 */
export function hasSufficientEntropy(password: string): boolean {
  const entropy = calculatePasswordEntropy(password);
  return entropy >= 50; // 50 bits = reasonably strong
}

/**
 * Detect common password patterns
 *
 * @param password - Password to analyze
 * @returns Array of detected patterns (empty if none found)
 */
export function detectPasswordPatterns(password: string): string[] {
  const patterns: string[] = [];

  // Sequential numbers (123, 234, etc.)
  if (/(?:012|123|234|345|456|567|678|789)/.test(password)) {
    patterns.push('sequential numbers');
  }

  // Sequential letters (abc, bcd, etc.)
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    patterns.push('sequential letters');
  }

  // Keyboard patterns (qwerty, asdfgh, etc.)
  if (/(?:qwerty|asdfgh|zxcvbn|qazwsx)/i.test(password)) {
    patterns.push('keyboard pattern');
  }

  // Repeated characters (aaa, 111, etc.)
  if (/(.)\1\1/.test(password)) {
    patterns.push('repeated characters');
  }

  // Common words at start
  if (/^(?:password|admin|user|test|welcome|login|guest)/i.test(password)) {
    patterns.push('common word at start');
  }

  // Just numbers at end (typical pattern)
  if (/\d{3,}[!@#$%^&*]*$/.test(password)) {
    patterns.push('numbers clustered at end');
  }

  return patterns;
}
