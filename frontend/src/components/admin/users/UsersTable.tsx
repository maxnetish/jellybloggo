import {
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  ActionIcon,
  Group,
} from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import type { UserResponse } from '@/lib/api/user/dto';

interface SortState {
  sortBy: string | undefined;
  sortDir: 'asc' | 'desc' | undefined;
}

interface UsersTableProps {
  users: UserResponse[];
  sort: SortState;
  onSortChange: (sortBy: 'login' | 'created_at', sortDir: 'asc' | 'desc') => void;
  onEditRoles: (user: UserResponse) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function SortableTh({
  label,
  sortKey,
  sort,
  onSortChange,
}: {
  label: string;
  sortKey: 'login' | 'created_at';
  sort: SortState;
  onSortChange: (sortBy: 'login' | 'created_at', sortDir: 'asc' | 'desc') => void;
}) {
  const isActive = sort.sortBy === sortKey;
  const direction = isActive ? sort.sortDir : undefined;

  function handleClick() {
    if (isActive) {
      // Toggle direction
      onSortChange(sortKey, sort.sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to asc
      onSortChange(sortKey, 'asc');
    }
  }

  return (
    <TableTh
      aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button
        type="button"
        onClick={handleClick}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          fontWeight: 'inherit',
          color: 'inherit',
          fontSize: 'inherit',
        }}
      >
        {label}
        {direction === 'asc' && ' ↑'}
        {direction === 'desc' && ' ↓'}
      </button>
    </TableTh>
  );
}

function UsersTableInner({ users, sort, onSortChange, onEditRoles }: UsersTableProps) {
  return (
    <Table striped highlightOnHover layout="fixed">
      <TableThead>
        <TableTr>
          <SortableTh
            label="Login"
            sortKey="login"
            sort={sort}
            onSortChange={onSortChange}
          />
          <TableTh style={{ width: 200 }}>Full name</TableTh>
          <TableTh style={{ width: 220 }}>Roles</TableTh>
          <SortableTh
            label="Created date"
            sortKey="created_at"
            sort={sort}
            onSortChange={onSortChange}
          />
        </TableTr>
      </TableThead>
      <TableTbody>
        {users.map((user) => (
          <TableTr key={user.id}>
            <TableTd style={{ width: 160 }}>{user.login}</TableTd>
            <TableTd style={{ width: 200 }}>{user.full_name}</TableTd>
            <TableTd style={{ width: 220 }}>
              <Group gap="xs">
                <span>{user.roles.length > 0 ? user.roles.join(', ') : <span className="text-muted-foreground">&lt;Empty&gt;</span>}</span>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => onEditRoles(user)}
                  aria-label="Edit roles"
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Group>
            </TableTd>
            <TableTd>{formatDate(user.created_at)}</TableTd>
          </TableTr>
        ))}
      </TableTbody>
    </Table>
  );
}

export { UsersTableInner as UsersTable };
export type { UsersTableProps };