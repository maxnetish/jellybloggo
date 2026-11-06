import { headers } from 'next/headers';
import type { ListUsersQuery } from '@/lib/api/user/dto';
import { listUsers } from '@/lib/api/user/client';
import { UsersTable } from '@/components/admin/users';

interface UsersPageProps {
  searchParams: Promise<ListUsersQuery>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const cookieHeader = (await headers()).get('cookie');

  // Parse pagination params
  const page = params.page ? Math.max(1, Number(params.page)) : 1;
  const perPage = params.per_page
    ? Math.min(100, Math.max(1, Number(params.per_page)))
    : 10;

  // Parse filter/sort params
  const query: ListUsersQuery = {
    roles: params.roles,
    search: params.search,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
    page,
    per_page: perPage,
  };

  const { content: users } = await listUsers({
    query,
    cookieHeader,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <UsersTable users={users} />
    </div>
  );
}
