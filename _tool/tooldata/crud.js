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
                description: "Send a POST request to check if it sending correctly",
                sampleInput: '{"data": "test", "message": "test"}',
                suggested: [{
                        name: "CusRaRa", content: "" +
                            `{
    "name": "Cus Ra Ramana",
    "email": "CusRaRa@customer.com",
    "phone1": "11111111111",
    "phone2": "11111111111",
    "address": "5000 malapitan, malakas, philippines",
    "city": "malapitan",
    "state": "malakas",
    "zip": "12345",
    "country": "philippines",
    "icon": "test icon",
    "gender": "female",
    "delivery_notes": "Make sure that it is packed correctly"
}`
                    },],
                expectedOutcome: '{\n  "message": "pong"\n}',
                availableFor: "public"
            },
            {
                label: "Check Stream",
                route: "/pingstream",
                methods: "STREAM",
                description: "Send a POST request to check if it sending correctly",
                sampleInput: '{"data": "test", "message": "test"}',
                suggested: [],
                expectedOutcome: '{\n  "message": "pong"\n}',
                availableFor: "public"
            },
        ]
    },
    {
        category: "Local Node Server",
        items: [
            {
                label: "Login",
                route: "/login",
                methods: "GET",
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
