import { createContext } from "react";

export interface User {
    _id: string;
    name: string;
    email: string;
    role: string[] | string;
    school: string;
    course?: string;
    courses?: string[];
    class?: string[] | string;
    schoolId: string[] | string;
    schoolName: string[] | string;
    courseId?: string[] | string;
    courseName?: string[] | string;
    classId?: string[] | string;
    className?: string[] | string;
}

export interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    getUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);
