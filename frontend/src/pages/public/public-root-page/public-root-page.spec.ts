import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PublicRootPage } from './public-root-page';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../../common/auth/auth.service';
import { UserInfoComponent } from '../../../common/auth/widgets/user-info/user-info.component';

describe('PublicRootPage', () => {
  let component: PublicRootPage;
  let fixture: ComponentFixture<PublicRootPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicRootPage, UserInfoComponent],
      providers: [
        provideRouter([]),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser$: of(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicRootPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
