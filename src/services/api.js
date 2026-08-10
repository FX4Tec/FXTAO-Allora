import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const assistedTenant = localStorage.getItem('assistedTenant');
    if (assistedTenant) {
        try {
            const tenant = JSON.parse(assistedTenant);
            if (tenant?.slug) {
                config.headers['X-FX4-Tenant-Slug'] = tenant.slug;
            }
        } catch (error) {
            localStorage.removeItem('assistedTenant');
        }
    }

    return config;
});

export default api;
