import { TestBed } from '@angular/core/testing';
import { FieldState } from '@angular/forms/signals';
import { TuiDay } from '@taiga-ui/cdk/date-time';
import { User } from '../../model/user';
import { Role } from '../../model/user-role';
import { applyDtoToForm, applyFormValueToDto, createProfileForm } from './profile-edit.form';

const user: User = {
  id: '1',
  login: 'alice',
  roles: [Role.reader],
  full_name: 'Alice',
  birth_date: '1977-05-25',
  location: 'Moscow',
  avatar_url: 'https://example.com/avatar.png',
  about: 'Jedi knight',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const minimalUser: User = {
  id: '2',
  login: 'bob',
  roles: [Role.reader],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('profile-edit form', () => {
  let profileForm: ReturnType<typeof createProfileForm>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    profileForm = TestBed.runInInjectionContext(() => createProfileForm());
  });

  function errorKinds(field: FieldState<string>): string[] {
    return field.errors().map((error) => error.kind);
  }

  describe('applyDtoToForm', () => {
    it('fills the model from the user dto', () => {
      applyDtoToForm({ profileForm, dto: user });

      expect(profileForm().value()).toEqual({
        fullName: 'Alice',
        birthDate: new TuiDay(1977, 4, 25),
        location: 'Moscow',
        avatarUrl: 'https://example.com/avatar.png',
        about: 'Jedi knight',
      });
    });

    it('falls back to empty values for missing optional fields', () => {
      applyDtoToForm({ profileForm, dto: minimalUser });

      expect(profileForm().value()).toEqual({
        fullName: '',
        birthDate: null,
        location: '',
        avatarUrl: '',
        about: '',
      });
    });

    it('leaves the form pristine and untouched', () => {
      applyDtoToForm({ profileForm, dto: user });

      expect(profileForm().dirty()).toBe(false);
      expect(profileForm().touched()).toBe(false);
    });
  });

  describe('applyFormValueToDto', () => {
    it('maps the model back to the user dto', () => {
      applyDtoToForm({ profileForm, dto: user });

      const dto = applyFormValueToDto({
        profileFormValue: profileForm().value(),
        profileUpdateDto: {},
      });

      expect(dto).toEqual({
        full_name: 'Alice',
        birth_date: '1977-05-25',
        location: 'Moscow',
        avatar_url: 'https://example.com/avatar.png',
        about: 'Jedi knight',
      });
    });

    it('omits empty birth date and avatar url', () => {
      applyDtoToForm({ profileForm, dto: minimalUser });

      const dto = applyFormValueToDto({
        profileFormValue: profileForm().value(),
        profileUpdateDto: {},
      });

      expect(dto.birth_date).toBeUndefined();
      expect(dto.avatar_url).toBeUndefined();
    });

    it('takes all values from the form model', () => {
      applyDtoToForm({ profileForm, dto: user });

      const dto = applyFormValueToDto({
        profileFormValue: profileForm().value(),
        profileUpdateDto: { full_name: 'stale' },
      });

      expect(dto.full_name).toBe('Alice');
    });
  });

  describe('validators', () => {
    it('accepts empty optional fields', () => {
      expect(errorKinds(profileForm.fullName())).toEqual([]);
      expect(errorKinds(profileForm.location())).toEqual([]);
      expect(errorKinds(profileForm.avatarUrl())).toEqual([]);
      expect(errorKinds(profileForm.about())).toEqual([]);
    });

    it('limits full name to 256 characters', () => {
      profileForm.fullName().value.set('a'.repeat(257));

      expect(errorKinds(profileForm.fullName())).toContain('maxLength');
    });

    it('limits location to 256 characters', () => {
      profileForm.location().value.set('a'.repeat(257));

      expect(errorKinds(profileForm.location())).toContain('maxLength');
    });

    it('limits about to 4096 characters', () => {
      profileForm.about().value.set('a'.repeat(4097));

      expect(errorKinds(profileForm.about())).toContain('maxLength');
    });

    it('rejects whitespace-only text fields', () => {
      profileForm.fullName().value.set('   ');
      profileForm.location().value.set('\t');
      profileForm.about().value.set('\n');

      expect(errorKinds(profileForm.fullName())).toContain('notBlank');
      expect(errorKinds(profileForm.location())).toContain('notBlank');
      expect(errorKinds(profileForm.about())).toContain('notBlank');
    });

    it('rejects an invalid avatar url', () => {
      profileForm.avatarUrl().value.set('not a url');

      expect(errorKinds(profileForm.avatarUrl())).toContain('url');
    });

    it('accepts a valid avatar url', () => {
      profileForm.avatarUrl().value.set('https://example.com/avatar.png');

      expect(errorKinds(profileForm.avatarUrl())).toEqual([]);
    });
  });
});
