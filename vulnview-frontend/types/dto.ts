export enum LicenseComplianceStatus {
    ALLOWED = 'ALLOWED',
    PROHIBITED = 'PROHIBITED',
    WARNING = 'WARNING',
    NO_POLICY = 'NO_POLICY'
}

export interface LicensePolicyRuleDto {
    id?: number;
    licenseSpdxId: string;
    allowed: boolean;
    notes?: string;
}

export interface LicensePolicyResponseDto {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    rules: LicensePolicyRuleDto[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateLicensePolicyDto {
    name: string;
    description?: string;
    rules: LicensePolicyRuleDto[];
}

export interface UpdateLicensePolicyDto {
    name?: string;
    description?: string;
    rules?: LicensePolicyRuleDto[];
}

export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
} 