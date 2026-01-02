const crud = [
    {
        category: "Internal CRUD Test",
        items: [
            {
                label: "Ping the Tool Server",
                route: "/pingme",
                methods: "GET",
                description: "Ping the tool server to check if it is running.",
                sampleInput: '{}',
                suggested: [],
                expectedOutcome: '{\n  "message": "pong"\n}',
                availableFor: "public"
            },
            {
                label: "Check Post",
                route: "/pingpost",
                methods: "POST",
                description: "Ping the tool server to check if it is running.",
                sampleInput: '{}',
                suggested: [],
                expectedOutcome: '{\n  "message": "pong"\n}',
                availableFor: "public"
            },
        ]
    },
]

module.exports = crud;
