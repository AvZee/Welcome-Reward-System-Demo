const API_URL = import.meta.env.VITE_API_URL;

async function request(path: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}${path}`, options);

    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
    }

    return res.json();
}

export function completeOnboarding(userId: string) {
   return request(`/api/onboarding/complete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
   });
}

export function getRewardStatus(userId: string) {
    return request(`/api/rewards/status/${userId}`);
}

export function getRewardEvents(userId: string) {
    return request(`/api/rewards/events/${userId}`);
}

export function getNotifications(userId: string) {
    return request(`/api/notifications/${userId}`);
}

export function getDemoUsers() {
    return request("/api/demo/users");
}

export function resetDemoUser(userId: string) {
    return request(`/api/demo/reset/${userId}`, {
        method: "POST",
    });
}