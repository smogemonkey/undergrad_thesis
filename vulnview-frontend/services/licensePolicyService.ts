import { apiClient } from '@/lib/apiClient';
import { LicensePolicyResponseDto, CreateLicensePolicyDto, UpdateLicensePolicyDto, Page } from '@/types/dto';
import { AxiosResponse } from 'axios';

class LicensePolicyService {
    private readonly baseUrl = '/api/v1/license-policies';

    async getAllPolicies(page = 0, size = 10): Promise<Page<LicensePolicyResponseDto>> {
        const response: AxiosResponse<Page<LicensePolicyResponseDto>> = await apiClient.get(`${this.baseUrl}?page=${page}&size=${size}`);
        return response.data;
    }

    async getPolicyById(id: number): Promise<LicensePolicyResponseDto> {
        const response: AxiosResponse<LicensePolicyResponseDto> = await apiClient.get(`${this.baseUrl}/${id}`);
        return response.data;
    }

    async createPolicy(policy: CreateLicensePolicyDto): Promise<LicensePolicyResponseDto> {
        const response: AxiosResponse<LicensePolicyResponseDto> = await apiClient.post(this.baseUrl, policy);
        return response.data;
    }

    async updatePolicy(id: number, policy: UpdateLicensePolicyDto): Promise<LicensePolicyResponseDto> {
        const response: AxiosResponse<LicensePolicyResponseDto> = await apiClient.put(`${this.baseUrl}/${id}`, policy);
        return response.data;
    }

    async deletePolicy(id: number): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
    }

    async setActivePolicy(id: number): Promise<void> {
        await apiClient.post(`${this.baseUrl}/${id}/activate`);
    }
}

export const licensePolicyService = new LicensePolicyService(); 