/**
 * @see backend/internal/users/model.go:Role
 */
export interface UserRole {
  id: number;
  name: string;
}

export enum Role {
  admin = 'admin',
  author = 'author',
  reader = 'reader',
}
