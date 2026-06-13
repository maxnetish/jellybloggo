import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { S3ConfigResponse } from '../../model/s3-config';

@Component({
  selector: 'app-s3-config-card',
  imports: [],
  templateUrl: './s3-config-card.component.html',
  styleUrl: './s3-config-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class S3ConfigCardComponent {
  readonly s3Config = input.required<S3ConfigResponse>();
}
