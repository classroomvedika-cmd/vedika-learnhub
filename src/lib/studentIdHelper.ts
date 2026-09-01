/**
 * Generates or retrieves a deterministic, persistent unique Student ID.
 * Format: VDH-2026-XXXXXX (e.g. VDH-2026-000123)
 * 
 * Once assigned to a student's unique UUID, it will ALWAYS resolve to the
 * exact same persistent identifier and never change on render, refresh, or navigation.
 */
export function getDeterministicStudentId(userId: string): string {
  if (!userId) return 'VDH-2026-000100';

  // Compute a stable 32-bit polynomial hash from the user's UUID string
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit signed integer
  }

  // Generate a stable 6-digit number in range 100000 - 999999
  const positiveNum = (Math.abs(hash) % 900000) + 100000;
  return `VDH-2026-${positiveNum.toString().padStart(6, '0')}`;
}

/**
 * Validates whether an existing student ID is non-empty, persistent, and not a generic placeholder.
 */
export function isValidPersistentStudentId(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed === '' || trimmed === 'VED-000000' || trimmed === 'VED-100001') {
    return false;
  }
  // Must match standard formats like VDH-2026-XXXXXX or VED-XXXXXX
  return /^(VDH-2026-\d{6}|VED-\d{5,8}|[A-Z]{2,4}-\d{4,8})$/i.test(trimmed);
}

/**
 * Resolves the persistent Student ID for a given user.
 * If the user already has a valid ID in the database, returns it.
 * Otherwise, generates a deterministic ID for that user's UUID.
 */
export function resolvePersistentStudentId(userId: string, existingId?: string | null): string {
  if (isValidPersistentStudentId(existingId)) {
    return existingId!.trim();
  }
  return getDeterministicStudentId(userId);
}
