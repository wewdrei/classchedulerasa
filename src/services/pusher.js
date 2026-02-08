// Provide an optional real-time client. If VITE_ENABLE_REALTIME is not 'true',
// export a minimal no-op stub so the app can run without WebSocket attempts.
const enableRealtime = String(import.meta.env.VITE_ENABLE_REALTIME || '').toLowerCase() === 'true';

let echo;
if (enableRealtime) {
    // Lazy-import to avoid bundling when disabled
    const { default: Echo } = await import('laravel-echo');
    const Pusher = (await import('pusher-js')).default;
    window.Pusher = Pusher;
    const apiHost = import.meta.env.VITE_API_URL || '';
    echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
        forceTLS: true,
        authEndpoint: `${apiHost}/api/broadcasting/auth`,
        authHost: apiHost,
        enabledTransports: ['ws', 'wss'],
        auth: {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                Accept: 'application/json',
            },
        },
    });
} else {
    // Minimal stub that exposes the small subset of methods used in the app
    const makeChannel = () => ({
        listen: () => makeChannel(),
        notification: () => makeChannel(),
        stopListening: () => {},
    });
    echo = {
        options: { auth: { headers: {} } },
        private: () => makeChannel(),
        channel: () => makeChannel(),
    };
}

export default echo;
