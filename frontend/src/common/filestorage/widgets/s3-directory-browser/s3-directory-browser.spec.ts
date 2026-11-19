import { ComponentFixture, TestBed } from '@angular/core/testing';
import { S3DirectoryBrowser } from './s3-directory-browser';

describe('S3DirectoryBrowser', () => {
  let component: S3DirectoryBrowser;
  let fixture: ComponentFixture<S3DirectoryBrowser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [S3DirectoryBrowser],
    }).compileComponents();

    fixture = TestBed.createComponent(S3DirectoryBrowser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
