import { StudyBlock } from '../models/lifesync.models';

export interface StudyBlockDraft {
  course: string;
  time: string;
  durationMin: number;
  priority: StudyBlock['priority'];
  date: string;
}

export function isValidStudyBlockDraft(block: StudyBlockDraft): boolean {
  const date = block.date.trim();
  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(year, month - 1, day);
  const validDate = !date || (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );

  return (
    block.course.trim().length >= 2 &&
    Boolean(block.time.trim()) &&
    Number.isInteger(block.durationMin) &&
    block.durationMin >= 1 &&
    block.durationMin <= 1440 &&
    ['urgent', 'soon', 'later'].includes(block.priority) &&
    validDate
  );
}
