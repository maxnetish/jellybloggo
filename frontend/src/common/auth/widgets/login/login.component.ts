import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TuiCard, TuiForm, TuiHeader } from '@taiga-ui/layout';
import {
  TuiButton,
  TuiInputDirective,
  TuiTextfield,
  TuiTitle,
  TuiError,
  TuiIcon,
  TuiNotificationDirective,
} from '@taiga-ui/core';
import { TuiPlatform } from '@taiga-ui/cdk';
import { createLoginForm } from './login.form';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiPassword } from '@taiga-ui/kit';
import { AuthService } from '../../auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [
    TuiCard,
    TuiTitle,
    TuiButton,
    TuiPlatform,
    TuiForm,
    ReactiveFormsModule,
    TuiTextfield,
    TuiInputDirective,
    TuiError,
    TuiIcon,
    TuiPassword,
    TuiHeader,
    TuiNotificationDirective,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  protected readonly form = createLoginForm();
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);

  protected readonly warn = signal<string | null>(null);

  protected register() {
    this.form.markAllAsTouched();

    if (!this.form.valid) {
      return;
    }

    const { login, password } = this.form.value;

    if (!(login && password)) {
      throw new Error('Missed login or password');
    }
    this.authService
      .register({
        login,
        password,
      })
      .subscribe({
        next: (result) => {
          this.navigateAfter();
        },
        error: (err) => {
          this.warn.set(this.errorToMessage(err));
        },
      });
  }

  protected login() {
    this.form.markAllAsTouched();

    if (!this.form.valid) {
      return;
    }

    const { login, password } = this.form.value;

    if (!(login && password)) {
      throw new Error('Missed login or password');
    }

    this.authService
      .login({
        login,
        password,
      })
      .subscribe({
        next: () => {
          this.navigateAfter();
        },
        error: (err) => {
          console.log(err);
          if (err.status === 401) {
            this.warn.set('Invalid credentials');
          } else {
            this.warn.set(this.errorToMessage(err));
          }
        },
      });
  }

  private errorToMessage(err: any) {
    return err.error?.error || err.error?.code || err.message || err.name || 'Something went wrong';
  }

  private navigateAfter() {
    const afterLoginUrl = this.route.snapshot.queryParamMap.get('afterLogin');
    if (afterLoginUrl) {
      this.router.navigateByUrl(afterLoginUrl);
    }
  }
}
