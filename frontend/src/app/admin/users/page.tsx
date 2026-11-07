import { Suspense } from 'react';
import { headers } from 'next/headers';
import type { ListUsersQuery } from '@/lib/api/user/dto';
import { listUsers } from '@/lib/api/user/client';
import { UsersControls } from '@/components/admin/users';

interface UsersPageProps {
  searchParams: Promise<ListUsersQuery>;
}

async function loadUsers(searchParams: ListUsersQuery) {
  const cookieHeader = (await headers()).get('cookie');

  const page = searchParams.page ? Math.max(1, Number(searchParams.page)) : 1;
  const perPage = 10;

  const query: ListUsersQuery = {
    roles: searchParams.roles,
    search: searchParams.search,
    sort_by: searchParams.sort_by,
    sort_dir: searchParams.sort_dir,
    page,
    per_page: perPage,
  };

  return listUsers({ query, cookieHeader });
}

async function UsersContent({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const { content: users, pagination } = await loadUsers(params);

  return (
    <UsersControls
      users={users}
      total={pagination.total}
      perPage={pagination.per_page}
    />
  );
}

export default async function UsersPage(props: UsersPageProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <Suspense fallback={null}>
        <UsersContent {...props} />
      </Suspense>
    </div>
  );
}