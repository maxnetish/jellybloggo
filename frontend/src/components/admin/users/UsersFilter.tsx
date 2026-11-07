'use client';

import { useRef, useState, useEffect } from 'react';
import { TextInput, MultiSelect } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { UserRole } from '@/lib/api/user/dto';
import { useDebouncedCallback } from '@/lib/utils';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface UsersFilterProps {
  initialSearch: string;
  initialRoles: string[];
}

export function UsersFilter({ initialSearch, initialRoles }: UsersFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [roles, setRoles] = useState<string[]>(initialRoles);

  // Keep refs to current values for use in debounced callback
  const pathnameRef = useRef(pathname);
  const searchParamsRef = useRef(searchParams);
  pathnameRef.current = pathname;
  searchParamsRef.current = searchParams;

  // Track last pushed URL to avoid duplicate navigations
  const lastPushedUrlRef = useRef<string | null>(null);

  // Create debounced function - stable reference
  const debouncedUpdate = useDebouncedCallback((newSearch: string, newRoles: string[]) => {
    const currentParams = searchParamsRef.current;

    // Check if values actually changed from what was originally in URL
    const currentSearch = currentParams.get('search') || '';
    const currentRoles = currentParams.getAll('roles');

    const searchMatches = newSearch === currentSearch;
    const rolesMatch =
      newRoles.length === currentRoles.length &&
      newRoles.every((r) => currentRoles.includes(r));

    if (searchMatches && rolesMatch) {
      // No actual change, skip
      return;
    }

    // Build new URL
    const params = new URLSearchParams(currentParams.toString());

    if (newSearch) {
      params.set('search', newSearch);
    } else {
      params.delete('search');
    }

    // Clear existing roles and add new ones
    params.delete('roles');
    for (const role of newRoles) {
      if (role) {
        params.append('roles', role);
      }
    }

    // Reset page when filter changes
    params.delete('page');

    const queryString = params.toString();
    const newUrl = `${pathnameRef.current}${queryString ? `?${queryString}` : ''}`;

    // Avoid pushing same URL twice
    if (newUrl === lastPushedUrlRef.current) {
      return;
    }

    lastPushedUrlRef.current = newUrl;

    // Use native history API to avoid Next.js router overhead
    window.history.pushState({}, '', newUrl);

    // Trigger Next.js navigation to re-fetch data
    router.refresh();
  }, 2000);

  // Sync with URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlRoles = searchParams.getAll('roles');

    setSearch(urlSearch);
    setRoles(urlRoles.length > 0 ? urlRoles : []);
  }, [searchParams]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.currentTarget.value;
    setSearch(value);
    debouncedUpdate(value, roles);
  }

  function handleRolesChange(value: string[]) {
    setRoles(value);
    debouncedUpdate(search, value);
  }

  function handleSearchClear() {
    setSearch('');
    debouncedUpdate('', roles);
  }

  function handleRolesClear() {
    setRoles([]);
    debouncedUpdate(search, []);
  }

  return (
    <div className="flex gap-4 mb-4">
      <TextInput
        placeholder="Search by login..."
        value={search}
        onChange={handleSearchChange}
        maxLength={32}
        rightSection={
          search ? (
            <IconX
              size={14}
              className="cursor-pointer"
              onClick={handleSearchClear}
            />
          ) : null
        }
        style={{ flex: 1, maxWidth: 280 }}
      />
      <MultiSelect
        placeholder="Filter by roles"
        data={[
          { value: UserRole.ADMIN, label: 'Admin' },
          { value: UserRole.AUTHOR, label: 'Author' },
          { value: UserRole.READER, label: 'Reader' },
        ]}
        value={roles}
        onChange={handleRolesChange}
        clearable
        onClear={handleRolesClear}
        style={{ flex: 1, maxWidth: 280 }}
      />
    </div>
  );
}