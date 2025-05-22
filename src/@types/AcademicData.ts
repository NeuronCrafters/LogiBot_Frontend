export interface Student {
  _id: string;
  name: string;
}

export interface Class {
  _id: string;
  name: string;
  students?: Student[];
}

export interface Course {
  _id: string;
  name: string;
  classes?: Class[];
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
