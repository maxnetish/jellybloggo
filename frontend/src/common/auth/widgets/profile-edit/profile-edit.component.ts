import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { applyDtoToForm, applyFormValueToDto, createProfileForm } from './profile-edit.form';
import { AuthService } from '../../auth.service';
import { FormField, FormRoot, submit } from '@angular/forms/signals';
import { TuiCardLarge, TuiForm, TuiHeader } from '@taiga-ui/layout';
import { TuiPlatform } from '@taiga-ui/cdk';
import {
  TuiAppearance,
  TuiCalendar,
  TuiError,
  TuiLabel,
  TuiTextfield,
  TuiTitle,
} from '@taiga-ui/core';
import {
  TuiAvatar,
  TuiInputDate,
  TuiTextarea,
} from '@taiga-ui/kit';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile-edit',
  imports: [
    TuiCardLarge,
    TuiForm,
    TuiPlatform,
    TuiHeader,
    TuiTitle,
    TuiError,
    TuiLabel,
    TuiTextfield,
    TuiTextarea,
    TuiCalendar,
    TuiInputDate,
    TuiAvatar,
    TuiAppearance,
    FormField,
    FormRoot,
  ],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditComponent {
  private readonly authService = inject(AuthService);
  protected readonly form = createProfileForm();

  protected readonly formStatusIcon = computed(() => {
    const dirty = this.form().dirty();
    const formBackendErrors = (this.form().errors() || []).find((entry) => entry.kind === 'serverError');
    if (dirty) {
      return '@tui.pen-line';
    }
    if (formBackendErrors) {
      return '@tui.cloud-alert';
    }
    return '@tui.cloud-check';
  });

  protected readonly formStatusAppearance = computed(() => {
    const dirty = this.form().dirty();
    const formBackendErrors = (this.form().errors() || []).find((entry) => entry.kind === 'serverError');
    if (dirty) {
      return 'warning';
    }
    if (formBackendErrors) {
      return 'negative';
    }
    return 'info';
  });

  protected readonly formStatusErrorMessage = computed(() => {
    const formBackendErrors = (this.form().errors() || []).find((entry) => entry.kind === 'serverError');
    if (formBackendErrors) {
      return formBackendErrors.message || formBackendErrors.kind;
    }
    return null;
  })

  constructor() {
    // const loading$ = new BehaviorSubject<LoadingStatus>(LoadingStatus.INITIAL);

    // Fill form from current user
    this.authService.currentUser$.pipe(
      takeUntilDestroyed(),
    ).subscribe({
      next: (currentUser) => {
        if (currentUser) {
          applyDtoToForm({profileForm: this.form, dto: currentUser});
        }
      },
    });

    effect(async () => {
      const formValue = this.form().value();

      const dirty = untracked(() => {
        return this.form().dirty();
      })

      if (dirty) {
        const profileUpdateDto = applyFormValueToDto({profileFormValue: formValue, profileUpdateDto: {}});
        const success = await submit(this.form, async () => {
          try {
            const response = await firstValueFrom(this.authService.updateProfile(profileUpdateDto));
            this.form().reset();
            return;
          } catch (err) {
            return {kind: 'serverError', message: 'Failed to save'};
          }
        });
      }
    });

  }
}
