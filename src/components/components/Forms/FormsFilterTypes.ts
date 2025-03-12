export type FilterType =
  | 'universities'
  | 'courses'
  | 'disciplines'
  | 'classes'
  | 'professors'
  | 'students-discipline'
  | 'students-course';

export interface FilterData {
  filterType: FilterType | '';
  universityId?: string;
  courseId?: string;
  disciplineId?: string;
  classId?: string;
}
