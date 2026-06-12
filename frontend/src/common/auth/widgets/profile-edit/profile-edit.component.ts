import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { applyDtoToForm, applyFormToDto, createProfileForm } from './profile-edit.form';
import { AuthService } from '../../auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiCardLarge, TuiForm, TuiHeader } from '@taiga-ui/layout';
import { TuiPlatform } from '@taiga-ui/cdk';
import {
  TuiCalendar,
  TuiErrorComponent,
  TuiErrorDirective,
  TuiLabel,
  TuiTextfieldComponent,
  TuiTitle,
} from '@taiga-ui/core';
import {
  TuiAvatar,
  TuiInputDate,
  TuiInputDateDirective,
  TuiTextareaComponent,
} from '@taiga-ui/kit';
import { BehaviorSubject, combineLatest, debounceTime, filter, map, startWith, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { LoadingStatus } from '../../../utils/loading-status';

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
    TuiAvatar,
    AsyncPipe,
  ],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditComponent {
  private readonly authService = inject(AuthService);
  protected readonly form = createProfileForm();

  private readonly loadingStatus$ = new BehaviorSubject<LoadingStatus>(LoadingStatus.INITIAL);

  protected readonly formStatus$ = combineLatest([
    this.form.valueChanges.pipe(
      startWith(this.form.value),
    ),
    this.loadingStatus$,
  ]).pipe(
    takeUntilDestroyed(),
    map(([, loadingStatus]) => {
      if (loadingStatus === LoadingStatus.LOADING) {
        return {
          icon: '@tui.pen-line',
          appearance: 'warning',
          rotating: true,
        };
      }
      if (loadingStatus === LoadingStatus.FAIL) {
        return {
          icon: '@tui.cloud-alert',
          appearance: 'negative',
          errorMessage: 'Not saved. Something went wrong.',
        };
      }
      if (this.form.dirty) {
        return {
          icon: '@tui.pen-line',
          appearance: 'warning',
        };
      }
      return {
        icon: '@tui.cloud-check',
        appearance: 'info',
      };
    }),
  );

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

    this.form.valueChanges
      .pipe(
        debounceTime(5000),
        filter(() => this.form.dirty),
        takeUntilDestroyed(),
        tap(() => {
          this.loadingStatus$.next(LoadingStatus.LOADING);
        }),
        switchMap((formValue) => {
          return this.authService.updateProfile(
            applyFormToDto({ form: this.form, profileUpdateDto: {} }),
          );
        }),
      )
      .subscribe({
        next: () => this.loadingStatus$.next(LoadingStatus.SUCCESS),
        error: () => this.loadingStatus$.next(LoadingStatus.FAIL),
      });
  }
}
