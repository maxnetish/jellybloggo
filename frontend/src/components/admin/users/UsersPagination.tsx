'use client';

import { useRef } from 'react';
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

  const routerRef = useRef(router);
  const pathnameRef = useRef(pathname);
  const searchParamsRef = useRef(searchParams);
  routerRef.current = router;
  pathnameRef.current = pathname;
  searchParamsRef.current = searchParams;

  const totalPages = Math.ceil(total / perPage);
  const currentPage = Number(searchParamsRef.current.get('page')) || 1;

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    params.set('page', String(page));
    routerRef.current.push(`${pathnameRef.current}?${params.toString()}`);
  }

  if (totalPages <= 1) {
    return null;
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