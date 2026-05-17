import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicRootPage } from './public-root-page';

describe('PublicRootPage', () => {
  let component: PublicRootPage;
  let fixture: ComponentFixture<PublicRootPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicRootPage],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicRootPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
