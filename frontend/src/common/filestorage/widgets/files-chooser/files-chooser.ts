import { Component, input, output } from '@angular/core';
import { tuiFilesAccepted, TuiInputFiles, TuiInputFilesDirective } from '@taiga-ui/kit';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { distinct, map, mergeMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Component to choose file(s)
 */
@Component({
  imports: [
    TuiInputFiles,
    TuiInputFilesDirective,
    ReactiveFormsModule,
  ],
  selector: 'app-files-chooser',
  templateUrl: './files-chooser.html',
})
export class FilesChooser {

  readonly accepted = input<string>('');
  readonly maxFileSize = input<number>(5 * 1024 * 1024 * 1024);
  readonly multiple = input(false);

  /**
   * Выбран файл (эмитим всегда по одному, даже для режима multiple)
   */
  readonly fileChosen = output<File>();

  protected readonly inputControl = new FormControl<File[]>([]);

  private readonly acceptedNewcome$ = this.inputControl.valueChanges.pipe(
    // Отбираем файлы, проходящие валидацию
    map(() => tuiFilesAccepted(this.inputControl)),
    // Массив - в поток эмитов
    mergeMap(accepted => accepted),
    // Эмитим дальше только такие эмиты, которых еще не было (сравнение по ссылке ===)
    // чтобы в fileChosen попали файлы, которые пользак прямо сейчас выбрал, а не раньше.
    // Альтернатива - как то резетить value после эмита, но это некрасиво.
    distinct(accepted => accepted),
  );

  constructor() {
    this.acceptedNewcome$.pipe(
      takeUntilDestroyed(),
    ).subscribe({
      next: (newcome) => {
        this.fileChosen.emit(newcome);
      }
    });
  }

}
