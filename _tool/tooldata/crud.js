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
                expectedOutcome: '# You should see the word "pong" as a messsage \n\n{\n  "message": "pong"\n}',
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
                expectedOutcome: '# Note \nYou should see the mirror of your inputs',
                availableFor: "public"
            },
            {
                label: "Check Stream",
                route: "/pingstream",
                methods: "STREAM",
                description: "Send a stream request to check if it sending correctly",
                sampleInput: '{"data": "test", "message": "test"}',
                suggested: [ 
                    { name: "I Wandered Lonely as a Cloud", content: "{}", urlparams: "?poem=I%20Wandered%20Lonely%20as%20a%20Cloud"},
                    { name: "The Sun Has Long Been Set",    content: "{}", urlparams: "?poem=The%20Sun%20Has%20Long%20Been%20Set"}
                ],
                expectedOutcome: '# Note \nYou should see the stream of words',
                availableFor: "public"
            },
        ]
    }
]

module.exports = crud;
