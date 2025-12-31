/**
 * @typedef {Object} APITest
 * @property {string} category
 * @property {APITestItem[]} items
 */

/**
 * @typedef {Object} APITestItem
 * @property {string} label
 * @property {string} route
 * @property {string[]} methods
 * @property {string} description
 * @property {string} sampleInput
 * @property {Object[]} suggested
 * @property {string} expectedOutcome
 * @property {boolean} isProtected
 * @property {boolean} isPublic
 * 
 * @example
 *  {
        category: "Authentication",
        items: [
            {
                label: "login",
                route: "/api/auth/login",
                methods: ["POST"],
                description: "Authenticates a user with email and password. Returns session and token.",
                sampleInput: '{\n  "email": "test@test.com",\n  "password": "test"\n}',
                suggested: [
                    { name: "Admin", content:   '{\n  "email": "admin@admin.com",\n  "password": "Admin123"\n}' },
                    { name: "CusRaRa", content: '{\n  "email": "CusRaRa@customer.com",\n  "password": "CusRaRa526"\n}' },
                    { name: "CusTaGe", content: '{\n  "email": "CusTaGe@customer.com",\n  "password": "CusTaGe789"\n}' }
                ],
                expectedOutcome: 'NOTE: a password between 6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter. \n\n {\n  "message": "user logged in successfully",\n   "code": "LOGIN_SUCCESS"\n}',
                isProtected: false,
                isPublic: false
            },
        ]
    },
 */
const apiTests = [
    {
        category: "Authentication",
        items: [
            {
                label: "login",
                route: "/api/auth/login",
                methods: ["POST"],
                description: "Authenticates a user with email and password. Returns session and token.",
                sampleInput: '{\n  "email": "test@test.com",\n  "password": "test"\n}',
                suggested: [
                    { name: "Admin", content:   '{\n  "email": "admin@admin.com",\n  "password": "Admin123"\n}' },
                    { name: "CusRaRa", content: '{\n  "email": "cusRaRa@customer.com",\n  "password": "CusRaRa526"\n}' },
                    { name: "CusTaGe", content: '{\n  "email": "cusTaGe@customer.com",\n  "password": "CusTaGe789"\n}' },
                    { name: "Chef", content:    '{\n  "email": "chef@chef.com",\n  "password": "Chef123"\n}' },
                    { name: "Delivery", content: '{\n  "email": "delivery@delivery.com",\n  "password": "Delivery123"\n}' }
                ],
                expectedOutcome: 'NOTE: a password between 6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter. \n\n {\n  "message": "user logged in successfully",\n   "code": "LOGIN_SUCCESS"\n}',
                isProtected: false,
                isPublic: false
            },
            {
                label: "logout",
                route: "/api/auth/logout",
                methods: ["POST"],
                description: "Invalidates the user's session token.",
                sampleInput: '{}',
                suggested: [],
                expectedOutcome: '{\n  "message": "Logout successful"\n}',
                isProtected: false,
                isPublic: false
            },
            {
                label: "register",
                route: "/api/auth/register",
                methods: ["POST"],
                description: "Register a new user with email and password.",
                sampleInput: '{\n  "email": "test@test.com",\n  "password": "test"\n}',
                suggested: [
                    { name: "Admin", content:   '{\n  "email": "admin@admin.com",\n  "password": "Admin123"\n}' },
                    { name: "CusRaRa", content: '{\n  "email": "CusRaRa@customer.com",\n  "password": "CusRaRa526"\n}' },
                    { name: "CusTaGe", content: '{\n  "email": "CusTaGe@customer.com",\n  "password": "CusTaGe789"\n}' },
                    { name: "Chef", content:    '{\n  "email": "chef@chef.com",\n  "password": "Chef123"\n}' },
                    { name: "Delivery", content: '{\n  "email": "delivery@delivery.com",\n  "password": "Delivery123"\n}' }
                ],
                expectedOutcome: 'NOTE: a password between 6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter. \n\n {\n  "message": "user created successfully",\n   "newUser": true\n}',
                isProtected: false,
                isPublic: false
            }
        ]
    },

    //======================================================================================
    {
        category: "User",
        items: [
            {
                label: 'getting-started',
                route: '/api/user/gettingstarted',
                methods: ["POST"],
                description: "Setting the user information after registration. NOTE: This will use the current cookie token",
                sampleInput: "" +
                    `{
    "name": "test",
    "email": "test@test.com",
    "phone1": "1234567890",
    "phone2": "1234567890",
    "address": "test address",
    "city": "test city",
    "state": "test state",
    "zip": "test zip",
    "country": "test country",
    "icon": "test icon",
    "gender": "test gender",
    "delivery_notes": "test delivery notes"
}
`,
                suggested: [
                    {
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
                    },
                    {
                        name: "CusTaGe", content: "" +
                            `{
    "name": "Cus Ta Gero",
    "email": "CusTaGe@customer.com",
    "phone1": "22222",
    "phone2": "222222",
    "address": "800 kalan, kalayaan, philippines",
    "city": "kalan",
    "state": "kalayaan",
    "zip": "12345",
    "country": "philippines",
    "icon": "test icon",
    "gender": "male",
    "delivery_notes": "Ayos basta mainit pa"
}`
                    },
                ],
                expectedOutcome: '{\n  "message": "User information updated successfully"\n}',
                isProtected: false,
                isPublic: false
            },
        ]
    },

    //======================================================================================
    {
        category: "Products and Inventory",
        items: [
            {
                label: "get all products",
                route: "/api/products/getall",
                methods: ["GET"],
                description: "Return all products. No authentication required.",
                sampleInput: '{}',
                suggested: [],
                expectedOutcome: 'URL Params: search, category\n\n{\n  "message": "Products fetched successfully"\n  "data": [ ... ]\n}',
                isProtected: false,
                isPublic: true
            },
                        {
                label: "get all categories",
                route: "/api/products/getcategory",
                methods: ["GET"],
                description: "Return all categories. No authentication required.",
                sampleInput: '{}',
                suggested: [],
                expectedOutcome: '{\n  "message": "Categories fetched successfully"\n  "data": [ ... ]\n}',
                isProtected: false,
                isPublic: true
            },
            {
                label: "product",
                route: "/api/products/product",
                methods: ["POST"],
                description: "Note: This is a protected route, only admin can use this route. Add, Modify or Delete a product. Request available: add, modify, delete",
                sampleInput: "{}",
                suggested: [
                    {
                        name: "Get All",
                        content: '{}'
                    },
                    {
                        name: "Add Burger",
                        content: '' +
`{
    "name": "Burger",
    "price": 20,
    "discount": 0,
    "description": "The best burger in world",
    "image": "default",
    "price_per_unit": 16,
    "est_cook_time": 10,
    "category": "burger",
    "ingredient_ids": [1, 2],
    "tags": ["patty", "buns"]
}`
                },
                 {
                    name: "Add Foot Long",
                    content: '' +
`{
    "name": "Foot Long",
    "price": 30,
    "discount": 0,
    "description": "Hotdog in a long bun",
    "image": "default",
    "price_per_unit": 26,
    "est_cook_time": 10,
    "category": "burger",
    "ingredient_ids": [1, 2],
    "tags": ["hotdog", "buns"]
}`
                 },
                 {
                    name: "Modify",
                    content: '' +
`{
    "modify": "FootLong",
    "name": "XFoot",
    "price": 30,
    "discount": 0,
    "description": "Hotdog in a long bun",
    "image": "default",
    "price_per_unit": 26,
    "est_cook_time": 10,
    "category": "burger",
    "ingredient_ids": [1, 2],
    "tags": ["hotdog", "buns"]
}`
                 },
                 {
                    name: "Delete",
                    content: '' +
`{
    "delete": "Foot Long"
}`
                 }
            ],
                expectedOutcome: 'Depdending on the request. Note the "modify" and "delete" attributes will set the API actions{\n   message: .... successfull message ... \n }',
                isProtected: true,
                isPublic: false
            },
            {
                label: "category",
                route: "/api/products/category",
                methods: ["POST"],
                description: "Note: This is a protected route, only admin can use this route. Add or modify a category. Request available: insert, modify, delete",
                sampleInput: '{}',
                suggested: [
                    { name: "get all", content: '{}' },
                    { name: "insert",     content: '{\n   "request": "insert",\n   "category": "test category"\n}' },
                    { name: "modify",     content: '{\n   "request": "modify",\n   "category": "test category",\n   "newname": "test category is modified"\n}' },
                    { name: "delete",     content: '{\n   "request": "delete",\n   "category": "test category"\n}' },
                ],
                expectedOutcome: 'Depdending on the request\n\n{\n  "message": "Category added successfully"\n}',
                isProtected: true,
                isPublic: false
            },
                        {
                label: "inventory",
                route: "/api/products/inventory",
                methods: ["POST"],
                description: "Note: This is a protected route, only admin can use this route. Return all inventory.",
                sampleInput: '{}',
                suggested: [{
                    name: "get all",
                    content: '{}'
                }, {
                    name: "search",
                    content: '{\n   "search": "bgr"\n}'
                }, 
                {
                        name: "Add Buns",
                        content: `{
    "name": "Buns",
    "cost_per_unit": 10,
    "available_quantity": 100
}`
                    },
                    {
                        name: "Add Patty",
                        content: `{
    "name": "Patty",
    "cost_per_unit": 25,
    "available_quantity": 50
}`,

    
                    },
                    {
                        name: "Add test",
                        content: `{
    "name": "Test",
    "cost_per_unit": 9999,
    "available_quantity": 9999
}`,
                    },
                {
                    name: "Delete",
                    content: '{\n   "delete": "Test"\n}'
                }, {
                    name: "Modify",
                    content: `{
    "modify": "Test",
    "name": "Test Modified",
    "cost_per_unit": 0,
    "available_quantity": 0
}`
                }],
                expectedOutcome: 'Depdending on the request\n\n{\n  "message": "Inventory fetched successfully"\n  "data": [ ... ]\n}',
                isProtected: true,
                isPublic: false
            },
        ]
    },

    //======================================================================================
    {
        category: "Order and Delivery",
        items: [
            // {
            //     label: "get all orders",
            //     route: "/api/orders/getall",
            //     methods: ["GET"],
            //     description: "??",
            //     sampleInput: '{}',
            //     suggested: [],
            //     expectedOutcome: '[ ... the JSON representation of the Token from supabase ... ]'
            // }
        ]
    },

    //======================================================================================
    {
        category: "Employee",
        items: [
            {
                label: "get employee data",
                route: "/api/employee/get",
                methods: ["GET"],
                description: "Get my employee data. This uses RLS policy so make sure to login first the employee account.",
                sampleInput: '{}',
                suggested: [],
                expectedOutcome: 'Note: This use RLS policy so make sure to login first the employee account.\n\n[ { ...the employee information in the database... } ]',
                isProtected: false,
                isPublic: false
            },
            {
                label: "on board an employee",
                route: "/api/employee/onboard",
                methods: ["POST"],
                description: "On board an employee",
                sampleInput: "" +
                    `{
    "passkey": "adminallow",
    "role": "employee",
    "admin_notes": "test",
    "first_name": "test",
    "last_name": "test",
    "middle_name": "test",
    "gender": "unknown",
    "phone_number": "123456789",
    "address": "test",
    "city": "test",
    "state": "test",
    "zip_code": "test",
    "country": "test",
    "emergency_contacts": "[12345789, 98765432]"
}`,
                suggested: [
                    {
                    name: "OnBoard Admin",
                    content: "" +
                        `{
    "passkey": "adminallow",
    "role": "admin",
    "admin_notes": "This is the the admin account",
    "first_name": "Admin",
    "last_name": "Admin",
    "middle_name": ".",
    "gender": "ultimate",
    "phone_number": "123456789",
    "address": "unknown",
    "city": "unknown",
    "state": "unknown",
    "zip_code": "unknown",
    "country": "unknown",
    "emergency_contacts": "[]"
}`
                },
                { 
                    name: "OnBoard Chef",
                    content: "" +
                        `{
    "passkey": "adminallow",
    "role": "chef",
    "admin_notes": "This is the the chef account",
    "first_name": "Chef",
    "last_name": "Chef",
    "middle_name": ".",
    "gender": "ultimate",
    "phone_number": "123456789",
    "address": "unknown",
    "city": "unknown",
    "state": "unknown",
    "zip_code": "unknown",
    "country": "unknown",
    "emergency_contacts": "[]"
}`
                },
                {
                    name: "OnBoard Delivery",
                    content: "" +
                        `{
    "passkey": "adminallow",
    "role": "rider",
    "admin_notes": "This is the the delivery account",
    "first_name": "Delivery",
    "last_name": "Delivery",
    "middle_name": ".",
    "gender": "ultimate",
    "phone_number": "123456789",
    "address": "unknown",
    "city": "unknown",
    "state": "unknown",
    "zip_code": "unknown",
    "country": "unknown",
    "emergency_contacts": "[]"
}`
                }

            ],
                expectedOutcome: 'NOTE: Please sign in first the account that will be onboarding \nWARNING: This route modify the database without any restrictions. \nThe Passkey must not be disclosed to anyone. \n\n{\n    "message": "Employee created successfully", \n    "data": null \n}',
                isProtected: false,
                isPublic: false
            }
        ]
    },

    //======================================================================================
    {
        category: "Workday",
        items: [
            // {
            //     label: "add work",
            //     route: "/api/workday/add",
            //     methods: ["POST"],
            //     description: "Add work to the workday",
            //     sampleInput: '{}',
            //     suggested: [],
            //     expectedOutcome: '[ ... the JSON representation of the Token from supabase ... ]'
            // },

        ]
    },

    //======================================================================================
    {
        category: "Tools",
        items: [
            {
                label: "cookie token decode",
                route: "/api/tools/decode",
                methods: ["POST"],
                description: "Decodes the current cookie token. Dont change the code and pass to use this tool. MUST NOT BE USED IN THE FRONTEND!",
                sampleInput: '{\n   "code": "En8aZ5y1Al7a",\n   "pass": "9cm4hHMetlb8"\n}',
                suggested: [],
                expectedOutcome: '{ ... the JSON representation of the Token from supabase ... }',
                isProtected: false,
                isPublic: false
            },
            {
                label: "list all users",
                route: "/api/tools/listallusers",
                methods: ["POST"],
                description: "Lists all users",
                sampleInput: '{\n   "code": "En8aZ5y1Al7a",\n   "pass": "9cm4hHMetlb8"\n}',
                suggested: [
                    {
                        name: "Search CusRaRa",
                        content: '{\n   "code": "En8aZ5y1Al7a",\n   "pass": "9cm4hHMetlb8",\n   "email": "CusRaRa@customer.com"\n}'
                    },
                    {
                        name: "Search CusTaGe",
                        content: '{\n   "code": "En8aZ5y1Al7a",\n   "pass": "9cm4hHMetlb8",\n   "email": "CusTaGe@customer.com"\n}'
                    }
                ],
                expectedOutcome: '[ all of the users info if email is not specified ]',
                isProtected: false,
                isPublic: false
            },
            {
                label: "list all employees",
                route: "/api/tools/listemployee",
                methods: ["POST"],
                description: "Lists all employees",
                sampleInput: '{\n   "code": "En8aZ5y1Al7a",\n   "pass": "9cm4hHMetlb8"\n}',
                suggested: [],
                expectedOutcome: '[ ... ]',
                isProtected: false,
                isPublic: false
            }
        ]
    },

    //======================================================================================



];