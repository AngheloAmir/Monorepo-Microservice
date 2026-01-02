import {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
  DeleteTableCommand
} from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";

/* ================================
   DYNAMODB CLIENT (LocalStack)
================================ */

export const dynamo = new DynamoDBClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test"
  }
});

export const ddb = DynamoDBDocumentClient.from(dynamo);

/* ================================
   TABLE OPERATIONS
================================ */

// Create table
export async function createTable(tableName: string) {
  await dynamo.send(new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ],
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  }));

  console.log("Table created:", tableName);
}

// List tables
export async function listTables() {
  const res = await dynamo.send(new ListTablesCommand({}));
  return res.TableNames || [];
}

// Delete table
export async function deleteTable(tableName: string) {
  await dynamo.send(new DeleteTableCommand({ TableName: tableName }));
  console.log("Table deleted:", tableName);
}

/* ================================
   ITEM (ROW) OPERATIONS
================================ */

// Create / Insert
export async function putItem(table: string, item: any) {
  await ddb.send(new PutCommand({
    TableName: table,
    Item: item
  }));
}

// Read by primary key
export async function getItem(table: string, id: string) {
  const res = await ddb.send(new GetCommand({
    TableName: table,
    Key: { id }
  }));

  return res.Item;
}

// List all rows
export async function scanTable(table: string) {
  const res = await ddb.send(new ScanCommand({
    TableName: table
  }));

  return res.Items || [];
}

// Update row
export async function updateItem(
  table: string,
  id: string,
  updates: Record<string, any>
) {
  const keys = Object.keys(updates);

  const UpdateExpression =
    "SET " + keys.map(k => `#${k} = :${k}`).join(", ");

  const ExpressionAttributeNames = Object.fromEntries(
    keys.map(k => [`#${k}`, k])
  );

  const ExpressionAttributeValues = Object.fromEntries(
    keys.map(k => [`:${k}`, updates[k]])
  );

  await ddb.send(new UpdateCommand({
    TableName: table,
    Key: { id },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }));
}

// Delete row
export async function deleteItem(table: string, id: string) {
  await ddb.send(new DeleteCommand({
    TableName: table,
    Key: { id }
  }));
}

/* ================================
   FULL TEST RUN
================================ */

async function test() {
  const table = "Users";

  await createTable(table);

  console.log(await listTables());

  await putItem(table, {
    id: "1",
    name: "Anghelo",
    role: "admin"
  });

  console.log(await getItem(table, "1"));

  await updateItem(table, "1", {
    role: "developer",
    age: 25
  });

  console.log(await scanTable(table));

  await deleteItem(table, "1");

  console.log(await scanTable(table));
}

if (require.main === module) {
  test().catch(console.error);
}

