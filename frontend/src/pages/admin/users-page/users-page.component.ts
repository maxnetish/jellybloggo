import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiTable, TuiTablePagination, TuiTablePaginationEvent } from '@taiga-ui/addon-table';
import { TuiLoader } from '@taiga-ui/core';
import { TuiElasticContainer } from '@taiga-ui/layout';
import { UsersStore } from './users.store';

@Component({
  selector: 'app-users-page',
  imports: [DatePipe, TuiElasticContainer, TuiLoader, TuiTable, TuiTablePagination],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UsersStore],
})
export class UsersPageComponent {
  protected readonly store = inject(UsersStore);

  protected readonly pageSizeOptions = [10, 20, 50] as const;

  constructor() {
    this.store.loadPage();
  }

  protected onPagination({ page, size }: TuiTablePaginationEvent): void {
    if (size !== this.store.pageSize()) {
      // Changing page size resets the page number to the initial value
      this.store.setPageSize(size);
    } else if (page !== this.store.pageNumber()) {
      this.store.setPageNumber(page);
    }
  }
}
