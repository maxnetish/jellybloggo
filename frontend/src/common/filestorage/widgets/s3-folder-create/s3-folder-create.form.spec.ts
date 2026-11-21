import { TestBed } from '@angular/core/testing';
import { createFolderForm, collectExistingNames } from './s3-folder-create.form';

describe('createFolderForm', () => {
  let form: ReturnType<typeof createFolderForm>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    form = TestBed.runInInjectionContext(() => createFolderForm(new Set()));
  });

  function errorKinds() {
    return form
      .name()
      .errors()
      .map((error) => error.kind);
  }

  it('starts with an empty name', () => {
    expect(form().value()).toEqual({ name: '' });
  });

  it('rejects an empty name', () => {
    expect(errorKinds()).toContain('required');
  });

  it('rejects a whitespace-only name', () => {
    form.name().value.set('   ');

    expect(errorKinds()).toContain('notBlank');
  });

  it('accepts a valid name', () => {
    form.name().value.set('my-folder');

    expect(errorKinds()).toEqual([]);
    expect(form().valid()).toBe(true);
  });

  it('accepts a 64-character name', () => {
    form.name().value.set('a'.repeat(64));

    expect(errorKinds()).not.toContain('maxLength');
    expect(form().valid()).toBe(true);
  });

  it('rejects a 65-character name', () => {
    form.name().value.set('a'.repeat(65));

    expect(errorKinds()).toContain('maxLength');
  });

  it('rejects a name containing /', () => {
    form.name().value.set('my/nested/folder');

    expect(errorKinds()).toContain('noSlash');
  });

  it('rejects a duplicate name', () => {
    const duplicateForm = TestBed.runInInjectionContext(() =>
      createFolderForm(new Set(['existing-folder'])),
    );
    duplicateForm.name().value.set('existing-folder');

    expect(
      duplicateForm
        .name()
        .errors()
        .map((error) => error.kind),
    ).toContain('duplicate');
  });

  it('rejects a duplicate name with surrounding whitespace', () => {
    const duplicateForm = TestBed.runInInjectionContext(() =>
      createFolderForm(new Set(['existing'])),
    );
    duplicateForm.name().value.set('  existing  ');

    expect(
      duplicateForm
        .name()
        .errors()
        .map((error) => error.kind),
    ).toContain('duplicate');
  });

  it('allows a name that differs only in case', () => {
    const caseForm = TestBed.runInInjectionContext(() => createFolderForm(new Set(['MyFolder'])));
    caseForm.name().value.set('myfolder');

    expect(
      caseForm
        .name()
        .errors()
        .map((error) => error.kind),
    ).not.toContain('duplicate');
  });
});

describe('collectExistingNames', () => {
  it('collects last segments of directory prefixes', () => {
    const names = collectExistingNames(
      [{ prefix: 'photos/vacation/' }, { prefix: 'photos/2025/' }],
      [],
    );

    expect([...names]).toEqual(['vacation', '2025']);
  });

  it('collects last segments of file keys', () => {
    const names = collectExistingNames(
      [],
      [{ key: 'photos/image.jpg' }, { key: 'notes/readme.txt' }],
    );

    expect([...names]).toEqual(['image.jpg', 'readme.txt']);
  });

  it('combines directories and files', () => {
    const names = collectExistingNames([{ prefix: 'folder/' }], [{ key: 'document.txt' }]);

    expect([...names]).toEqual(['folder', 'document.txt']);
  });
});
