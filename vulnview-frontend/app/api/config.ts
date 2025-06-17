export const API_BASE_URL = 'http://localhost:8080/api/v1';

export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
};

export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        ...DEFAULT_HEADERS,
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

export const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'An error occurred');
    }
    return response.json();
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};