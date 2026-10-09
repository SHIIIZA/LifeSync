import { isValidStudyBlockDraft } from './validation';

describe('isValidStudyBlockDraft', () => {
  const validDraft = {
    course: 'Biology',
    time: 'Today, 4:00 PM',
    durationMin: 60,
    priority: 'soon' as const,
    date: '',
  };

  it('accepts a complete valid draft with no explicit date', () => {
    expect(isValidStudyBlockDraft(validDraft)).toBeTrue();
  });

  it('accepts a real ISO calendar date', () => {
    expect(isValidStudyBlockDraft({ ...validDraft, date: '2028-02-29' })).toBeTrue();
  });

  it('rejects blank course and time', () => {
    expect(isValidStudyBlockDraft({ ...validDraft, course: '  ' })).toBeFalse();
    expect(isValidStudyBlockDraft({ ...validDraft, time: ' ' })).toBeFalse();
  });

  it('rejects invalid durations', () => {
    expect(isValidStudyBlockDraft({ ...validDraft, durationMin: 0 })).toBeFalse();
    expect(isValidStudyBlockDraft({ ...validDraft, durationMin: 1441 })).toBeFalse();
    expect(isValidStudyBlockDraft({ ...validDraft, durationMin: 1.5 })).toBeFalse();
  });

  it('rejects malformed and impossible dates', () => {
    expect(isValidStudyBlockDraft({ ...validDraft, date: '2028-02-30' })).toBeFalse();
    expect(isValidStudyBlockDraft({ ...validDraft, date: '02/29/2028' })).toBeFalse();
  });
});
