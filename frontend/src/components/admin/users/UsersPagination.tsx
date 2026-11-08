'use client';

import { Pagination } from '@mantine/core';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

interface UsersPaginationProps {
  total: number;
  perPage: number;
}

export function UsersPagination({ total, perPage }: UsersPaginationProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const totalPages = Math.ceil(total / perPage);
  const currentPage = Number(searchParams.get('page')) || 1;

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    const newUrl = `${pathname}?${params.toString()}`;

    window.history.pushState({}, '', newUrl);
    router.refresh();
  }

  return (
    <div className="flex justify-center mt-4">
      <Pagination
        total={totalPages}
        value={currentPage}
        onChange={handlePageChange}
      />
    </div>
  );
}