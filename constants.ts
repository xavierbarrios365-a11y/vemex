
// API Configuration — reads from environment variables (.env file)
// Never commit your .env file to git!
export const API_URL = import.meta.env.VITE_API_URL || "https://script.google.com/macros/s/AKfycbzNbU2-ihFncBK3KRIghOBxRuLYs239zBMIOIUG7uT0PAKS7cG8396lYfNZmBM5oIg/exec";
export const API_TOKEN = import.meta.env.VITE_API_TOKEN || "";

// Helper: build GET URL with token
export function apiGet(action: string): string {
    const params = new URLSearchParams({ action });
    if (API_TOKEN) params.set('token', API_TOKEN);
    return `${API_URL}?${params.toString()}`;
}

// Helper: build POST body with token
export function apiPostBody(action: string, data: any): string {
    return JSON.stringify({ action, data, token: API_TOKEN });
}
