import { ComponentFixture, TestBed } from '@angular/core/testing';
import { S3BucketBrowser } from './s3-bucket-browser';

describe('S3DirectoryBrowser', () => {
  let component: S3BucketBrowser;
  let fixture: ComponentFixture<S3BucketBrowser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [S3BucketBrowser],
    }).compileComponents();

    fixture = TestBed.createComponent(S3BucketBrowser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
