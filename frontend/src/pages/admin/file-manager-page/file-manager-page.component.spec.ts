import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FileManagerPageComponent } from './file-manager-page.component';
import { S3ConfigService } from '../../../common/filestorage/s3config.service';

describe('FileManagerPageComponent', () => {
  let component: FileManagerPageComponent;
  let fixture: ComponentFixture<FileManagerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileManagerPageComponent],
      providers: [
        {
          provide: S3ConfigService,
          useValue: { getAll: () => of([]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FileManagerPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
