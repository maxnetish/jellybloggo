import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRootPage } from './admin-root-page';

describe('AdminRootPage', () => {
  let component: AdminRootPage;
  let fixture: ComponentFixture<AdminRootPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRootPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRootPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
