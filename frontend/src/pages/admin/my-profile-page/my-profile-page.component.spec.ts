import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyProfilePageComponent } from './my-profile-page.component';

describe('MyProfilePageComponent', () => {
  let component: MyProfilePageComponent;
  let fixture: ComponentFixture<MyProfilePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyProfilePageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyProfilePageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
