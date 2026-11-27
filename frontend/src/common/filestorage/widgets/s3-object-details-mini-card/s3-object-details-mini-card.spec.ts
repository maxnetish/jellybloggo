import { ComponentFixture, TestBed } from '@angular/core/testing';
import { S3ObjectDetailsMiniCard } from './s3-object-details-mini-card';

describe('S3ObjectDetailsMiniCard', () => {
  let component: S3ObjectDetailsMiniCard;
  let fixture: ComponentFixture<S3ObjectDetailsMiniCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [S3ObjectDetailsMiniCard],
    }).compileComponents();

    fixture = TestBed.createComponent(S3ObjectDetailsMiniCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
