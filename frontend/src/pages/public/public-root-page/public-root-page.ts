import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../common/auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { AsyncPipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-public-root-page',
  imports: [JsonPipe, AsyncPipe],
  templateUrl: './public-root-page.html',
  styleUrl: './public-root-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicRootPage implements OnInit {
  protected readonly autService = inject(AuthService);

  ngOnInit(): void {}
}
