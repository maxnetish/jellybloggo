import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRootPage } from './admin-root-page';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiFade } from '@taiga-ui/kit';
import { TuiNavigation } from '@taiga-ui/layout';
import { provideRouter, RouterLink, RouterOutlet } from '@angular/router';

describe('AdminRootPage', () => {
  let component: AdminRootPage;
  let fixture: ComponentFixture<AdminRootPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminRootPage,
        TuiIcon,
        TuiFade,
        TuiNavigation,
        TuiButton,
        RouterLink,
        RouterOutlet,
      ],
      providers: [
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRootPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
