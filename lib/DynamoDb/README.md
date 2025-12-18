## Example: Accessing DynamoDB Table from Frontend using AWS SDK

Here is an example of how to query DynamoDB table using a Global Secondary Index (GSI) from a frontend application with the AWS SDK v3:

```js
// queryByCountry.js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

// Initialize the DynamoDB client
const client = new DynamoDBClient({ region: "eu-west-1" });

/**
 * Query DynamoDB table by country using the countryIndex GSI.
 * @param {string} tableName - The name of DynamoDB table.
 * @param {string} country - The country value to query for.
 * @returns {Promise<Array>} - Array of matching items.
 */
export async function queryByCountry(tableName, country) {
  const params = {
    TableName: tableName,
    IndexName: "countryIndex", // Must match the indexName in CDK
    KeyConditionExpression: "#country = :countryValue",
    ExpressionAttributeNames: {
      "#country": "country"
    },
    ExpressionAttributeValues: {
      ":countryValue": country
    }
  };

  const command = new QueryCommand(params);

  try {
    const data = await client.send(command);
    return data.Items;
  } catch (err) {
    console.error("Query failed:", err);
    throw err;
  }
}

// Example usage:
// (async () => {
//   const items = await queryByCountry("TableName", "Finland");
//   console.log(items);
// })();
```

