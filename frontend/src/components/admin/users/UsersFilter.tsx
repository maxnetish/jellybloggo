'use client';

import { useState } from 'react';
import { TextInput, MultiSelect } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { UserRole } from '@/lib/api/user/dto';
import { useDebouncedCallback } from '@/lib/utils';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

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

  // Debounced update using current searchParams from hook
  const debouncedUpdate = useDebouncedCallback((newSearch: string, newRoles: string[]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newSearch) {
      params.set('search', newSearch);
    } else {
      params.delete('search');
    }

    params.delete('roles');
    for (const role of newRoles) {
      if (role) {
        params.append('roles', role);
      }
    }

    params.delete('page');

    const queryString = params.toString();
    const newUrl = `${pathname}${queryString ? `?${queryString}` : ''}`;

    window.history.pushState({}, '', newUrl);
    router.refresh();
  }, 2000);

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