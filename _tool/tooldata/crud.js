const crud = [
    {
        category: "Authentication",
        items: [
            {
                label: "logout",
                route: "/api/auth/logout",
                methods: "GET",
                description: "Invalidates the user's session token.",
                sampleInput: '{}',
                suggested: [],
                expectedOutcome: '{\n  "message": "Logout successful"\n}',
                availableFor: "public"
            },
            {
                label: "logout",
                route: "/api/auth/logout",
                methods: "POST",
                description: "Invalidates the user's session token.",
                sampleInput: '{}',
                suggested: [
                    { name: "Admin",   content:   '{\n  "email": "admin@admin.com",\n  "password": "Admin123"\n}' },
                    { name: "CusRaRa", content: '{\n  "email": "CusRaRa@customer.com",\n  "password": "CusRaRa526"\n}' },
                    { name: "CusTaGe", content: '{\n  "email": "CusTaGe@customer.com",\n  "password": "CusTaGe789"\n}' }
                ],
                expectedOutcome: '{\n  "message": "Logout successful"\n}',
                availableFor: "public"
            },
        ]
    },

     {
        category: "Another one for test",
        items: [
            {
                label: "logout",
                route: "/api/auth/logout",
                methods: "DELETE",
                description: "Invalidates the user's session token.",
                sampleInput: '{}',
                suggested: [],
                expectedOutcome: '{\n  "message": "Logout successful"\n}',
                availableFor: "private"
            },
        ]
    },
]

module.exports = crud;
