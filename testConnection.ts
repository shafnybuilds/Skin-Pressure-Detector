// testConnection.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function testConnection() {
  console.log("Testing DynamoDB connection...");
  console.log("Region:", process.env.NEXT_PUBLIC_AWS_REGION);
  console.log(
    "Access Key ID:",
    process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID?.slice(0, 5) + "..."
  );

  const command = new QueryCommand({
    TableName: "PressureSensorData", // Replace with your table name
    KeyConditionExpression: "deviceId = :deviceId",
    ExpressionAttributeValues: {
      ":deviceId": "ESP32_Skin_Pressure_Detector",
    },
    Limit: 1,
  });

  try {
    const response = await docClient.send(command);
    console.log("Connection successful!");
    console.log("Items retrieved:", response.Items);
    return response;
  } catch (err) {
    console.error("Connection error:", err);
    throw err;
  }
}

testConnection();
