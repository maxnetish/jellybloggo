'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
  search: string;
  roles: string[];
  sortBy: 'login' | 'created_at' | 'updated_at' | undefined;
  sortDir: 'asc' | 'desc' | undefined;
  page: number;
} {
  const roles = searchParams.getAll('roles');
  const search = searchParams.get('search') || '';
  const sortBy = (searchParams.get('sort_by') as 'login' | 'created_at' | 'updated_at') || undefined;
  const sortDir = (searchParams.get('sort_dir') as 'asc' | 'desc') || undefined;
  const page = searchParams.get('page');

  return {
    search,
    roles: roles.length > 0 ? roles : [],
    sortBy,
    sortDir,
    page: page ? Math.max(1, Number(page)) : 1,
  };
}

export function UsersControls({ users, total, perPage }: UsersControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Keep refs to current values for use in callbacks
  const routerRef = useRef(router);
  const pathnameRef = useRef(pathname);
  const searchParamsRef = useRef(searchParams);
  routerRef.current = router;
  pathnameRef.current = pathname;
  searchParamsRef.current = searchParams;

  // Parse current URL params
  const params = parseFromSearchParams(searchParams);

  const [sortBy, setSortBy] = useState(params.sortBy);
  const [sortDir, setSortDir] = useState(params.sortDir);

  function updateUrl(updates: Record<string, string | string[] | undefined>, resetPage = true) {
    const newParams = new URLSearchParams(searchParamsRef.current.toString());

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
    routerRef.current.push(`${pathnameRef.current}${queryString ? `?${queryString}` : ''}`);
  }

  function handleSortChange(newSortBy: 'login' | 'created_at', newSortDir: 'asc' | 'desc') {
    setSortBy(newSortBy);
    setSortDir(newSortDir);
    updateUrl({ sort_by: newSortBy, sort_dir: newSortDir });
  }

  return (
    <>
      <UsersFilter
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