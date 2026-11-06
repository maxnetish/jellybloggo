import {
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
} from '@mantine/core';
import type { UserResponse } from '@/lib/api/user/dto';

interface UsersTableProps {
  users: UserResponse[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <Table striped highlightOnHover>
      <TableThead>
        <TableTr>
          <TableTh>Login</TableTh>
          <TableTh>Full name</TableTh>
          <TableTh>Roles</TableTh>
          <TableTh>Created date</TableTh>
        </TableTr>
      </TableThead>
      <TableTbody>
        {users.map((user) => (
          <TableTr key={user.id}>
            <TableTd>{user.login}</TableTd>
            <TableTd>{user.full_name}</TableTd>
            <TableTd>{user.roles.join(', ')}</TableTd>
            <TableTd>{formatDate(user.created_at)}</TableTd>
          </TableTr>
        ))}
      </TableTbody>
    </Table>
  );
}
