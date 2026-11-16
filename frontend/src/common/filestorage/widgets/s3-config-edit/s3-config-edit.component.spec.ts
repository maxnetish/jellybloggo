import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { S3ConfigFormComponent } from './s3-config-edit.component';

describe('S3ConfigFormComponent', () => {
  let component: S3ConfigFormComponent;
  let fixture: ComponentFixture<S3ConfigFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [S3ConfigFormComponent],
      providers: [provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(S3ConfigFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
