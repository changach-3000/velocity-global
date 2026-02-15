// CORS configuration hook
// This file enables CORS for your production domain

onAfterBootstrap((e) => {
    console.log('🌐 Configuring CORS settings...');
});

onBeforeServe((e) => {
    // Add CORS middleware
    e.router.use((c) => {
        // Allow requests from your production domain
        const allowedOrigins = [
            'https://velocitygloballeasing.com',
            'http://localhost:3000',
            'http://localhost:5173',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173'
        ];

        const origin = c.request().header.get('Origin');
        
        if (origin && allowedOrigins.includes(origin)) {
            c.response().header().set('Access-Control-Allow-Origin', origin);
        }

        // Allow credentials
        c.response().header().set('Access-Control-Allow-Credentials', 'true');
        
        // Allow common headers
        c.response().header().set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Allow common methods
        c.response().header().set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        
        // Handle preflight requests
        if (c.request().method === 'OPTIONS') {
            return c.noContent(204);
        }

        return c.next();
    });

    console.log('✅ CORS configured for:', allowedOrigins.join(', '));
});