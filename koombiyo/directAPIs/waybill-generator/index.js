const { DynamoDBClient, BatchWriteItemCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
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

    const newWayBilllist = JSON.parse(event.body);
    if (!newWayBilllist) {
      return {
        statusCode: 400,
        body: JSON.stringify(`no way bill list found`),
      };
    }

    const putRequests = newWayBilllist.map(item => ({
      PutRequest: {
        Item: {
          waybill: { S: item.waybill },
          subOrderId: { S: '' },
          isAssigned: { BOOL: false },
          // isReturn: { BOOL: false },
          // isCOD: { BOOL: false },
          isError: { BOOL: false },
          orderPlaced: { BOOL: false },
          pickUpRequested: { BOOL: false },
          orderData: { S: JSON.stringify({}) },
          pickupData: { S: JSON.stringify({}) },
        },
      },
    }));
    
    const batchWriteCommand = new BatchWriteItemCommand({
      RequestItems: {
        [TABLE_NAME]: putRequests,
      },
    });
    
    await ddbDocClient.send(batchWriteCommand);

    return {
      statusCode: 200,
      body: JSON.stringify("sucess")
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
