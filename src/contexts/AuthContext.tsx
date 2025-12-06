import { createContext } from "react";

export interface User {
    _id: string;
    name: string;
    email: string;
    role: string[] | string;
    school: string;
    schoolId: string[] | string;
    schoolName: string[] | string;
    course?: string;
    courses?: string[];
    courseId?: string[] | string;
    courseName?: string[] | string;
    class?: string[] | string;
    classes?: (string | { _id: string; id?: string })[];
    className?: string[] | string;
    disciplines?: string | string[];
    disciplineId?: string | string[];
    discipline?: string | string[];
    classId?: string[] | string;
}

export interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string, recaptchaToken: string) => Promise<void>;
    logout: () => Promise<void>;
    getUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);
