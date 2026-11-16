import { signal } from '@angular/core';
import { TuiDay } from '@taiga-ui/cdk/date-time';
import { debounce, FieldTree, form, maxLength, validate } from '@angular/forms/signals';
import { User } from '../../model/user';
import { ProfileUpdate } from '../../model/profile-update';
import { notBlankValidator } from '../../../utils/validators/not-blank';
import { urlValidator } from '../../../utils/validators/url';

interface ProfileModel {
  fullName: string;
  birthDate: TuiDay | null;
  location: string;
  avatarUrl: string;
  about: string;
}

export type ProfileForm = ReturnType<typeof createProfileForm>;

/** Parse backend ISO date string into TuiDay. */
function parseDate(raw: string | null | undefined): TuiDay | null {
  if (!raw) return null;
  const [y, m, d] = raw.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new TuiDay(y, m - 1, d);
}

/** Format TuiDay to backend ISO date string. */
function formatDate(td: TuiDay | null): string | null {
  if (!td) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${td.year}-${pad(td.month + 1)}-${pad(td.day)}`;
}

export function createProfileForm() {
  const model = signal<ProfileModel>({
    fullName: '',
    birthDate: null,
    location: '',
    avatarUrl: '',
    about: '',
  });

  return form(model, (schemaPath) => {
    debounce(schemaPath, 5000);

    maxLength(schemaPath.fullName, 256, { message: 'Maximum 256 characters' });
    validate(schemaPath.fullName, notBlankValidator);

    maxLength(schemaPath.location, 256, { message: 'Maximum 256 characters' });
    validate(schemaPath.location, notBlankValidator);

    maxLength(schemaPath.avatarUrl, 500, { message: 'Maximum 500 characters' });
    validate(schemaPath.avatarUrl, urlValidator);

    maxLength(schemaPath.about, 4096, { message: 'Maximum 4096 characters' });
    validate(schemaPath.about, notBlankValidator);
  });
}

/**
 * Залить дто в форму.
 * После вызова форма в pristine/touched=false — считается "сохранённым" состоянием.
 */
export function applyDtoToForm({ profileForm, dto }: { profileForm: ProfileForm; dto: User }) {
  profileForm().reset({
    fullName: dto.full_name || '',
    birthDate: parseDate(dto.birth_date),
    location: dto.location || '',
    avatarUrl: dto.avatar_url || '',
    about: dto.about || '',
  });
  return profileForm;
}

/** Собрать ProfileUpdate только для dirty-полей. */
export function applyFormValueToDto({
  profileFormValue,
  profileUpdateDto,
}: {
  profileFormValue: ReturnType<ReturnType<ProfileForm>['value']>;
  profileUpdateDto: ProfileUpdate;
}): ProfileUpdate {
  return {
    ...profileUpdateDto,
    full_name: profileFormValue.fullName || '',
    birth_date: formatDate(profileFormValue.birthDate) || undefined,
    location: profileFormValue.location || '',
    avatar_url: profileFormValue.avatarUrl || undefined,
    about: profileFormValue.about || '',
  };
}
