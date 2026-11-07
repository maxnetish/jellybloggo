'use client';

import { useForm } from '@mantine/form';
import { TextInput, MultiSelect } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { UserRole } from '@/lib/api/user/dto';
import { useDebouncedCallback } from '@/lib/utils';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface UsersFilterProps {
  initialSearch: string;
  initialRoles: string[];
}

/**
 * Filter form component.
 * Remounts when initialValues change (controlled by key in parent).
 * On mount: form is initialized from props.
 * On change: debounced URL update.
 */
export function UsersFilter({ initialSearch, initialRoles }: UsersFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateUrl = useDebouncedCallback(
    (values: { search: string; roles: string[] }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (values.search) {
        params.set('search', values.search);
      } else {
        params.delete('search');
      }

      params.delete('roles');
      for (const role of values.roles) {
        if (role) {
          params.append('roles', role);
        }
      }

      params.delete('page');

      const queryString = params.toString();
      const newUrl = `${pathname}${queryString ? `?${queryString}` : ''}`;

      window.history.pushState({}, '', newUrl);
      router.refresh();
    },
    2000,
  );

  const form = useForm({
    initialValues: {
      search: initialSearch,
      roles: initialRoles,
    },
    onValuesChange: (values) => {
      updateUrl(values);
    },
  });

  return (
    <div className="flex gap-4 mb-4">
      <TextInput
        placeholder="Search by login..."
        maxLength={32}
        rightSection={
          form.values.search ? (
            <IconX
              size={14}
              className="cursor-pointer"
              onClick={() => form.setFieldValue('search', '')}
            />
          ) : null
        }
        {...form.getInputProps('search')}
        style={{ flex: 1, maxWidth: 280 }}
      />
      <MultiSelect
        placeholder="Filter by roles"
        data={[
          { value: UserRole.ADMIN, label: 'Admin' },
          { value: UserRole.AUTHOR, label: 'Author' },
          { value: UserRole.READER, label: 'Reader' },
        ]}
        clearable
        {...form.getInputProps('roles')}
        style={{ flex: 1, maxWidth: 280 }}
      />
    </div>
  );
}