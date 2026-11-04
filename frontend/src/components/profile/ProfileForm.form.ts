import { useForm, UseFormReturnType } from '@mantine/form';
import { User } from '@/lib/api/user';
import { updateProfile } from '@/lib/api/auth';

export interface ProfileFormValues {
  full_name: string;
  birth_date: string | null; // YYYY-MM-DD format from DateInput
  location: string;
  about: string;
}

export function useProfileForm() {
  return useForm<ProfileFormValues>({
    initialValues: {
      full_name: '',
      birth_date: null,
      location: '',
      about: '',
    },
  });
}

export function applyDtoToProfileForm({form, dto}: { form: UseFormReturnType<ProfileFormValues>; dto?: User | null }) {
  form.setValues({
    full_name: dto?.full_name || '',
    birth_date: dto?.birth_date || null,
    location: dto?.location || '',
    about: dto?.about || '',
  });
  return form;
}

export function profileFormToUpdateDto({formValue}: {formValue: ProfileFormValues}): Parameters<typeof updateProfile>[number] {
  return {
    full_name: formValue.full_name || undefined,
    birth_date: formValue.birth_date || undefined,
    location: formValue.location || undefined,
    about: formValue.about || undefined,
  };
}