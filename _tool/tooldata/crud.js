const crud = [
    {
        "category": "Internal CRUD Test",
        "items": [
            {
                "label": "Ping the Tool Server",
                "route": "/pingme",
                "methods": "GET",
                "description": "Ping the tool server to check if it is running.",
                "sampleInput": "{}",
                "suggested": [],
                "expectedOutcome": "# Please set the root url to localhost:3200 first\n\n# You should see the word \"pong\" as a message \n\n{\n  \"message\": \"pong\"\n}",
                "availableFor": "public"
            },
            {
                "label": "Check Post",
                "route": "/pingpost",
                "methods": "POST",
                "description": "Send a POST request to check if it sending correctly",
                "sampleInput": "{\n   \"data\": \"test\",\n   \"message\": \"test\"\n}",
                "suggested": [
                    {
                        "name": "Customer Data",
                        "urlparams": "",
                        "content": "{\n    \"name\": \"Demo Customer\",\n    \"email\": \"CusRaRa@customer.com\",\n    \"phone1\": \"123456789\",\n    \"phone2\": \"987654321\",\n    \"city\": \"randomw1\",\n    \"state\": \"ultra state\",\n    \"zip\": \"12345\",\n    \"country\": \"mega country\",\n    \"icon\": \"test icon\",\n    \"gender\": \"female\",\n    \"delivery_notes\": \"Make sure that it is packed correctly\"\n}"
                    }
                ],
                "expectedOutcome": "# Please set the root url to localhost:3200 first\n\n# Note \nYou should see the mirror of your inputs",
                "availableFor": "public"
            },
            {
                "label": "Check Stream",
                "route": "/pingstream",
                "methods": "STREAM",
                "description": "Send a stream request to check if it sending correctly",
                "sampleInput": "{\n   \"data\": \"test\", \n   \"message\": \"test\"\n}",
                "suggested": [
                    {
                        "name": "I Wandered Lonely as a Cloud",
                        "urlparams": "?poem=I%20Wandered%20Lonely%20as%20a%20Cloud",
                        "content": "{}"
                    },
                    {
                        "name": "The Sun Has Long Been Set",
                        "urlparams": "?poem=The%20Sun%20Has%20Long%20Been%20Set",
                        "content": "{}"
                    }
                ],
                "expectedOutcome": "# Please set the root url to localhost:3200 first\n\n# Note \nYou should see the stream of words",
                "availableFor": "public"
            }
        ]
    }
]

module.exports = crud;