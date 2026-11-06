/**
 * User roles matching backend values.
 */
export const UserRole = {
  ADMIN: "admin",
  AUTHOR: "author",
  READER: "reader",
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];