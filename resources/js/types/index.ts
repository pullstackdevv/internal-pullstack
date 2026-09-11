export interface ModuleLink {
    key: string;
    label: string;
    href: string;
    icon: string;
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'staff';
}

export interface SharedProps {
    auth: {
        user: AuthUser;
        modules: ModuleLink[];
    };
    [key: string]: unknown;
}
