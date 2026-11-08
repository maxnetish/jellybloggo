'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { UserResponse } from '@/lib/api/user/dto';
import { UsersFilter } from './UsersFilter';
import { UsersPagination } from './UsersPagination';
import { UsersTable } from './UsersTable';
import { EditRolesModal } from './EditRolesModal';

interface UsersControlsProps {
  users: UserResponse[];
  total: number;
  perPage: number;
  sortBy: 'login' | 'created_at' | 'updated_at';
  sortDir: 'asc' | 'desc';
}

export function UsersControls({ users, total, perPage, sortBy: defaultSortBy, sortDir: defaultSortDir }: UsersControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read sort directly from URL, fall back to server-provided defaults.
  // No local state — URL is the single source of truth for sort.
  const sortBy = (searchParams.get('sort_by') as 'login' | 'created_at' | 'updated_at') || defaultSortBy;
  const sortDir = (searchParams.get('sort_dir') as 'asc' | 'desc') || defaultSortDir;

  // Filter values from URL (same pattern as sort — no local state).
  const search = searchParams.get('search') || '';
  const roles = searchParams.getAll('roles').filter(Boolean);

  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);

  function updateUrl(updates: Record<string, string | string[] | undefined>, resetPage = true) {
    const newParams = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      newParams.delete(key);
      if (Array.isArray(value)) {
        for (const v of value) {
          if (v) {
            newParams.append(key, v);
          }
        }
      } else if (value !== undefined && value !== '') {
        newParams.set(key, value);
      }
    }

    if (resetPage) {
      newParams.delete('page');
    }

    const queryString = newParams.toString();
    const newUrl = `${pathname}${queryString ? `?${queryString}` : ''}`;

    window.history.pushState({}, '', newUrl);
    router.refresh();
  }

  function handleSortChange(newSortBy: 'login' | 'created_at', newSortDir: 'asc' | 'desc') {
    updateUrl({ sort_by: newSortBy, sort_dir: newSortDir });
  }

  function handleEditRoles(user: UserResponse) {
    setEditingUser(user);
  }

  function handleRolesSaved() {
    router.refresh();
  }

  // Key remounts filter when search/roles change.
  // This ensures form is initialized with fresh values from URL.
  const filterKey = `${search}|${roles.sort().join(',')}`;

  return (
    <>
      <UsersFilter
        key={filterKey}
        initialSearch={search}
        initialRoles={roles}
      />
      <UsersTable
        users={users}
        sort={{ sortBy, sortDir }}
        onSortChange={handleSortChange}
        onEditRoles={handleEditRoles}
      />
      <UsersPagination
        total={total}
        perPage={perPage}
      />
      {editingUser && (
        <EditRolesModal
          user={editingUser}
          opened={true}
          onClose={() => setEditingUser(null)}
          onSuccess={handleRolesSaved}
        />
      )}
    </>
  );
}