// lib/dynamo.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

// Create DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export const fetchAllData = async () => {
  try {
    console.log("Fetching data from DynamoDB...");

    const command = new ScanCommand({
      TableName: "PressureSensorData", // my table name in DynamoDB
    });

    const response = await docClient.send(command);
    console.log("DynamoDB Response:", JSON.stringify(response, null, 2));

    if (!response.Items || response.Items.length === 0) {
      throw new Error("No data found in DynamoDB");
    }

    // Return all items
    return response.Items;
  } catch (error: any) {
    console.error("DynamoDB Error:", error);
    throw new Error(`DynamoDB Error: ${error.message}`);
  }
};
