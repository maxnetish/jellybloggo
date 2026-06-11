import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { applyDtoToForm, createProfileForm } from './profile-edit.form';
import { AuthService } from '../../auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiCardLarge, TuiForm, TuiHeader } from '@taiga-ui/layout';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiCalendar, TuiErrorComponent, TuiErrorDirective, TuiInputDirective, TuiLabel, TuiTextfieldComponent, TuiTitle } from '@taiga-ui/core';
import { TuiInputDate, TuiInputDateDirective, TuiTextareaComponent } from '@taiga-ui/kit';

@Component({
  selector: 'app-profile-edit',
  imports: [
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
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditComponent {
  private readonly authService = inject(AuthService);
  protected readonly form = createProfileForm();

  constructor() {
    // Fill in form model
    this.authService.currentUser$.subscribe({
      next: (currentUser) => {
        if (currentUser) {
          applyDtoToForm({
            form: this.form,
            dto: currentUser,
          });
        }
      },
    });
  }
}
