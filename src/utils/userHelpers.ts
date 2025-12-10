/**
 * Helper utilities for user operations
 */

/**
 * Get the Supabase UUID from user object
 * JWT backend returns member_id (like "3") but Supabase needs UUID
 * This function extracts the supabaseUserId if available, falls back to user.id
 */
export function getSupabaseUserId(user: any): string | null {
    if (!user) {
        return null;
    }

    // UUID validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Try to get supabaseUserId first (stored during login/signup)
    if (user.supabaseUserId && uuidRegex.test(user.supabaseUserId)) {
        return user.supabaseUserId;
    }

    // Fallback to user.id (might be UUID if user signed up properly)
    if (user.id && uuidRegex.test(user.id)) {
        return user.id;
    }

    // No valid UUID found - return null silently
    // App can work without Supabase UUID using local storage
    return null;
}

/**
 * Check if user has valid Supabase UUID
 */
export function hasValidSupabaseId(user: any): boolean {
    const id = getSupabaseUserId(user);
    if (!id) return false;

    // UUID format check (8-4-4-4-12 hex characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}
