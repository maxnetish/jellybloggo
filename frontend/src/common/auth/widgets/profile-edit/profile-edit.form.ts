import { FormControl, FormGroup } from '@angular/forms';
import { User } from '../../model/user';
import { ProfileUpdate } from '../../model/profile-update';

export type ProfileForm = ReturnType<typeof createProfileForm>;

export function createProfileForm() {
  return new FormGroup({
    fullName: new FormControl<string | null>(null),
    birthDate: new FormControl<string | null>(null),
    location: new FormControl<string | null>(null),
    avatarUrl: new FormControl<string | null>(null),
    about: new FormControl<string | null>(null),
  });
}

/**
 * Залить дто в форму
 */
export function applyDtoToForm({ form, dto }: { form: ProfileForm; dto: User }) {
  form.patchValue({
    fullName: dto.full_name || null,
    birthDate: dto.birth_date || null,
    location: dto.location || null,
    avatarUrl: dto.avatar_url || null,
    about: dto.about || null,
  });
  return form;
}

export function applyFormToDto({
  form,
  profileUpdateDto,
}: {
  form: ProfileForm;
  profileUpdateDto: ProfileUpdate;
}): ProfileUpdate {
  const formValue = form.value;

  return {
    ...profileUpdateDto,
    full_name: formValue.fullName || undefined,
    birth_date: formValue.birthDate || undefined,
    location: formValue.location || undefined,
    avatar_url: formValue.avatarUrl || undefined,
    about: formValue.about || undefined,
  };
}
