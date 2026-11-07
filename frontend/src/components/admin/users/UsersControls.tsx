'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { UserResponse } from '@/lib/api/user/dto';
import { UsersFilter } from './UsersFilter';
import { UsersPagination } from './UsersPagination';
import { UsersTable } from './UsersTable';

interface UsersControlsProps {
  users: UserResponse[];
  total: number;
  perPage: number;
}

function parseFromSearchParams(searchParams: URLSearchParams): {
  sortBy: 'login' | 'created_at' | 'updated_at' | undefined;
  sortDir: 'asc' | 'desc' | undefined;
  search: string;
  roles: string[];
} {
  const roles = searchParams.getAll('roles');
  const search = searchParams.get('search') || '';
  const sortBy = (searchParams.get('sort_by') as 'login' | 'created_at' | 'updated_at') || undefined;
  const sortDir = (searchParams.get('sort_dir') as 'asc' | 'desc') || undefined;

  return {
    search,
    roles: roles.length > 0 ? roles : [],
    sortBy,
    sortDir,
  };
}

export function UsersControls({ users, total, perPage }: UsersControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = parseFromSearchParams(searchParams);

  const [sortBy, setSortBy] = useState(params.sortBy);
  const [sortDir, setSortDir] = useState(params.sortDir);

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
    setSortBy(newSortBy);
    setSortDir(newSortDir);
    updateUrl({ sort_by: newSortBy, sort_dir: newSortDir });
  }

  // Key remounts component when filter params change.
  // This ensures clean state: form is created with fresh initialValues from URL.
  const filterKey = `${params.search}|${params.roles.sort().join(',')}`;

  return (
    <>
      <UsersFilter
        key={filterKey}
        initialSearch={params.search}
        initialRoles={params.roles}
      />
      <UsersTable
        users={users}
        sort={{ sortBy, sortDir }}
        onSortChange={handleSortChange}
      />
      <UsersPagination
        total={total}
        perPage={perPage}
      />
    </>
  );
}