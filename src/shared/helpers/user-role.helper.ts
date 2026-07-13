import { Role } from "../enum/role.enum";

export const BUYER_ROLE_ALIAS = "buyer";

export function normalizeRole(role?: unknown): Role | null {
  const value = String(role ?? "")
    .trim()
    .toLowerCase();

  if (!value) {
    return null;
  }

  if (value === BUYER_ROLE_ALIAS || value === Role.User) {
    return Role.User;
  }

  if (value === Role.Seller) {
    return Role.Seller;
  }

  if (value === Role.Admin) {
    return Role.Admin;
  }

  if (value === Role.SuperAdmin) {
    return Role.SuperAdmin;
  }

  return null;
}

export function normalizeRoles(
  roles?: unknown,
  fallbackRole?: unknown,
): Role[] {
  const values = Array.isArray(roles)
    ? roles
    : typeof roles === "string"
    ? [roles]
    : [];

  const normalized = values
    .map((role) => normalizeRole(role))
    .filter((role): role is Role => role !== null);

  const fallback = normalizeRole(fallbackRole);

  if (fallback && !normalized.includes(fallback)) {
    normalized.push(fallback);
  }

  if (!normalized.length) {
    normalized.push(Role.User);
  }

  return Array.from(new Set(normalized));
}

export function hasRole(
  roles: unknown,
  requiredRole: Role,
  fallbackRole?: unknown,
): boolean {
  return normalizeRoles(roles, fallbackRole).includes(requiredRole);
}

export function resolveActiveRole(
  roles: unknown,
  activeRole?: unknown,
  fallbackRole?: unknown,
): Role {
  const normalizedRoles = normalizeRoles(roles, fallbackRole);
  const requestedActiveRole = normalizeRole(activeRole);

  if (requestedActiveRole && normalizedRoles.includes(requestedActiveRole)) {
    return requestedActiveRole;
  }

  if (normalizedRoles.includes(Role.SuperAdmin)) {
    return Role.SuperAdmin;
  }

  if (normalizedRoles.includes(Role.Admin)) {
    return Role.Admin;
  }

  if (normalizedRoles.includes(Role.Seller)) {
    return Role.Seller;
  }

  return Role.User;
}

export function deriveUserType(roles: unknown, fallbackRole?: unknown): string {
  const normalizedRoles = normalizeRoles(roles, fallbackRole);

  if (normalizedRoles.includes(Role.Seller)) {
    return Role.Seller;
  }

  if (normalizedRoles.includes(Role.SuperAdmin)) {
    return Role.SuperAdmin;
  }

  if (normalizedRoles.length === 1 && normalizedRoles.includes(Role.Admin)) {
    return Role.Admin;
  }

  return Role.User;
}
