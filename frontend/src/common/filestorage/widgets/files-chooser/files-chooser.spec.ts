import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilesChooser } from './files-chooser';

describe('FilesChooser', () => {
  let component: FilesChooser;
  let fixture: ComponentFixture<FilesChooser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilesChooser],
    }).compileComponents();

    fixture = TestBed.createComponent(FilesChooser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
