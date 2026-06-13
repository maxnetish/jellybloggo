import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileManagerPageComponent } from './file-manager-page.component';

describe('FileManagerPageComponent', () => {
  let component: FileManagerPageComponent;
  let fixture: ComponentFixture<FileManagerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileManagerPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileManagerPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
