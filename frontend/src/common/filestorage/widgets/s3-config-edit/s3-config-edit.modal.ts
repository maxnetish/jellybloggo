import { inject, Injectable, Injector } from '@angular/core';
import { S3ConfigEditInputs, S3ConfigEditOutputs, S3ConfigFormComponent } from './s3-config-edit.component';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { defaultIfEmpty } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class S3ConfigEditModal {
  private readonly tuiDialogService = inject(TuiDialogService);

  show({ injector, inputs }: { injector?: Injector; inputs: S3ConfigEditInputs }) {
    return this.tuiDialogService
      .open<S3ConfigEditOutputs>(new PolymorpheusComponent(S3ConfigFormComponent, injector), {
        data: { ...inputs },
        size: 'm',
      })
      .pipe(
        // becouse dialog completes without emit if esc or click outside modal.
        defaultIfEmpty({
          option: 'cancel',
        } as S3ConfigEditOutputs),
      );
  }
}
