const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const jwt = require('jsonwebtoken');

const ddbClient = new DynamoDBClient({ region: process.env.DYNAMODB_REGION.toString() });
const marshallOptions = { convertEmptyValues: false, removeUndefinedValues: false, convertClassInstanceToMap: false };
const unmarshallOptions = { wrapNumbers: false };
const translateConfig = { marshallOptions, unmarshallOptions };

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME.toString();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

exports.handler = async (event) => {

  try {

    let token = event.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.PRIVATEKEY_ACCESSTOCKEN);

    if (!decoded.role) {
      return {
        statusCode: 500,
        body: JSON.stringify(`tocken role error`),
      };
    }

    if (!((decoded.role == "superAdmin") || (decoded.role == "admin"))) {
      return {
        statusCode: 401,
        body: JSON.stringify(`not authorised`),
      };
    }
    const filter = JSON.parse(event.body).filter; // new, pending, done, error1, error2
    if (!filter) {
      return {
        statusCode: 400,
        body: JSON.stringify(`filter is required`),
      };
    }

    // all the final record items
    const finalItems = [];

    async function scanItems(scanCommand) {
      const scanResponse = await ddbDocClient.send(scanCommand);
      const scannedItems = scanResponse.Items;
      finalItems.push(...scannedItems);
    
      if (scanResponse.LastEvaluatedKey) {
        scanCommand.ExclusiveStartKey = scanResponse.LastEvaluatedKey;
        await scanItems(scanCommand); // Recursive call for pagination
      }
    }

    if (filter == "new") {
      const scanCommand = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#isAssigned = :status",
        ExpressionAttributeNames: {
          "#isAssigned": "isAssigned",
        },
        ExpressionAttributeValues: {
          ":status": false,
        },
      });
      await scanItems(scanCommand);
      // const scanResponse = await ddbDocClient.send(scanCommand);
      // const items = scanResponse.Items;
    }

    if (filter == "pending") {
      const scanCommand = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#isAssigned = :value1 AND #orderPlaced = :value2 AND #pickUpRequested = :value3",
        ExpressionAttributeNames: {
          "#isAssigned": "isAssigned",
          "#orderPlaced": "orderPlaced",
          "#pickUpRequested": "pickUpRequested",
        },
        ExpressionAttributeValues: {
          ":value1": true ,
          ":value2": false,
          ":value3": false,
        },
      });
      await scanItems(scanCommand);
      // const scanResponse = await ddbDocClient.send(scanCommand);
      // const items = scanResponse.Items;
    }

    if (filter == "done") {
      const scanCommand = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#isAssigned = :value1 AND #orderPlaced = :value2 AND #pickUpRequested = :value3",
        ExpressionAttributeNames: {
          "#isAssigned": "isAssigned",
          "#orderPlaced": "orderPlaced",
          "#pickUpRequested": "pickUpRequested",
        },
        ExpressionAttributeValues: {
          ":value1": true ,
          ":value2": true,
          ":value3": true,
        },
      });
      await scanItems(scanCommand);
      // const scanResponse = await ddbDocClient.send(scanCommand);
      // const items = scanResponse.Items;
    }

    if (filter == "error") {
      const scanCommand = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#isAssigned = :value1 AND #isError = :value2",
        ExpressionAttributeNames: {
          "#isAssigned": "isAssigned",
          "#isError": "isError",
        },
        ExpressionAttributeValues: {
          ":value1": true ,
          ":value2": true,
        }
      });
      await scanItems(scanCommand);
      // const scanResponse = await ddbDocClient.send(scanCommand);
      // const items = scanResponse.Items;
    }

    if (filter == "error1") {
      const scanCommand = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#isAssigned = :value1 AND #orderPlaced = :value2 AND #pickUpRequested = :value3",
        ExpressionAttributeNames: {
          "#isAssigned": "isAssigned",
          "#orderPlaced": "orderPlaced",
          "#pickUpRequested": "pickUpRequested",
        },
        ExpressionAttributeValues: {
          ":value1": true ,
          ":value2": false,
          ":value3": true,
        }
      });
      await scanItems(scanCommand);
      // const scanResponse = await ddbDocClient.send(scanCommand);
      // const items = scanResponse.Items;
    }

    if (filter == "error2") {
      const scanCommand = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#isAssigned = :value1 AND #orderPlaced = :value2 AND #pickUpRequested = :value3",
        ExpressionAttributeNames: {
          "#isAssigned": "isAssigned",
          "#orderPlaced": "orderPlaced",
          "#pickUpRequested": "pickUpRequested",
        },
        ExpressionAttributeValues: {
          ":value1": true ,
          ":value2": true,
          ":value3": false,
        }
      });
      await scanItems(scanCommand);
      // const scanResponse = await ddbDocClient.send(scanCommand);
      // const items = scanResponse.Items;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(finalItems)
    };


  } catch (err) {

    if(err.message == 'jwt expired') {
      return {
        statusCode: 401,
        body: 'TE',
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify(err.message),
      };
    }

  }

};
