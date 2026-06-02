export interface Student {
  _id: string;
  name: string;
}

export interface Discipline {
  _id: string;
  name: string;
}

export interface Class {
  disciplines: any;
  professors?: never[];
  _id: string;
  name: string;
  students?: Student[];
  disciplineIds?: string[];
}

export interface Course {
  _id: string;
  name: string;
  classes?: Class[];
  disciplines?: Discipline[];
}

export interface University {
  _id: string;
  name: string;
  courses?: Course[];
}

export interface AcademicDataResponse {
  data: {
    universities: University[];
  };
}
