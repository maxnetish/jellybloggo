import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileEditComponent } from './profile-edit.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiCardLarge, TuiForm, TuiHeader } from '@taiga-ui/layout';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiCalendar, TuiErrorComponent, TuiErrorDirective, TuiLabel, TuiTextfieldComponent, TuiTitle } from '@taiga-ui/core';
import { TuiInputDate, TuiInputDateDirective, TuiTextareaComponent } from '@taiga-ui/kit';

describe('ProfileEditComponent', () => {
  let component: ProfileEditComponent;
  let fixture: ComponentFixture<ProfileEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProfileEditComponent,
        ReactiveFormsModule,
        TuiCardLarge,
        TuiForm,
        TuiPlatform,
        TuiHeader,
        TuiTitle,
        TuiErrorComponent,
        TuiErrorDirective,
        TuiLabel,
        TuiTextfieldComponent,
        TuiTextareaComponent,
        TuiInputDateDirective,
        TuiCalendar,
        TuiInputDate,
      ],
      providers: [provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileEditComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
