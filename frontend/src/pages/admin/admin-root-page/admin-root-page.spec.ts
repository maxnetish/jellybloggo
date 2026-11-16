import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AdminRootPage } from './admin-root-page';
import { AdminHeaderComponent } from './admin-header.component';
import { RouterOutlet } from '@angular/router';
import { UserInfoComponent } from '../../../common/auth/widgets/user-info/user-info.component';
import { AuthService } from '../../../common/auth/auth.service';

describe('AdminRootPage', () => {
  let component: AdminRootPage;
  let fixture: ComponentFixture<AdminRootPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminRootPage,
        RouterOutlet,
        AdminHeaderComponent,
        UserInfoComponent,
      ],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser$: of(null) } },
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
