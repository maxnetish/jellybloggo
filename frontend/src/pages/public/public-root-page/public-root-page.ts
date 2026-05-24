import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AuthApiService } from '../../../common/auth/auth-api.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-public-root-page',
  imports: [JsonPipe],
  templateUrl: './public-root-page.html',
  styleUrl: './public-root-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicRootPage implements OnInit {
  private readonly authApiService = inject(AuthApiService);

  protected readonly currentUser = toSignal(this.authApiService.getCurrentUser(), {
    initialValue: null,
  });

  ngOnInit(): void {}
}
