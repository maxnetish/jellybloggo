import { ComponentFixture, TestBed } from '@angular/core/testing';

import { S3ConfigCardComponent } from './s3-config-card.component';

describe('S3ConfigCardComponent', () => {
  let component: S3ConfigCardComponent;
  let fixture: ComponentFixture<S3ConfigCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [S3ConfigCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(S3ConfigCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
