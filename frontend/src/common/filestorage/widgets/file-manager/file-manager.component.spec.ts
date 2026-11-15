import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FileManagerComponent } from './file-manager.component';
import { S3ConfigService } from '../../s3config.service';

describe('FileManagerComponent', () => {
  let component: FileManagerComponent;
  let fixture: ComponentFixture<FileManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileManagerComponent],
      providers: [
        {
          provide: S3ConfigService,
          useValue: { getAll: () => of([]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FileManagerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
