const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const ddbClient = new DynamoDBClient({ region: process.env.DYNAMODB_REGION.toString() });
const marshallOptions = { convertEmptyValues: false, removeUndefinedValues: false, convertClassInstanceToMap: false };
const unmarshallOptions = { wrapNumbers: false };
const translateConfig = { marshallOptions, unmarshallOptions };

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME.toString();
const API_KEY = process.env.API_KEY.toString();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

exports.handler = async (event) => {

  try {

    const body = JSON.parse(event.body);

    if (body.api_key.toString() != API_KEY) {
      return {
        statusCode: 401,
        body: JSON.stringify(`Not authorised`),
      };
    }

    if (!body.subOrderId) {
      return {
        statusCode: 400,
        body: JSON.stringify(`subOrderId is required`),
      };
    }

    if (!(body.isReturn == true || body.isReturn == false)) {
      return {
        statusCode: 400,
        body: `isReturn is required`,
      };
    }

    if (!(body.isCOD == true || body.isCOD == false)) {
      return {
        statusCode: 400,
        body: `isCOD is required`,
      };
    }

    // fetch record not yet assigned
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME, 
      FilterExpression: 'isAssigned = :value',
      ExpressionAttributeValues: {
        ':value': { BOOL: false },
      }
    });


    const scanResponse = await ddbDocClient.send(scanCommand);
      
    // Check if any unassigned records were found
    if (scanResponse.Items.length < 1) {
      return {
        statusCode: 404,
        body: JSON.stringify(`No unassigned records found`),
      };
    }

    // assigned record to given suborder
    const updateParams = {
      TableName: TABLE_NAME,
      Item: {
        waybill: scanResponse.Items[0].waybill.S,
        subOrderId: body.subOrderId,
        isReturn: body.isReturn,
        isCOD: body.isCOD,
        isAssigned: true,
        isError: false,
        orderPlaced: false,
        pickUpRequested: false,
        orderData: JSON.stringify({}),
        pickupData: JSON.stringify({}) 
      },
    };

    const wayBillUpdateData = await ddbDocClient.send(new PutCommand(updateParams));
    if (!wayBillUpdateData) {
      return {
        statusCode: 500,
        body: JSON.stringify(`waybill update error`),
      };
    }

    // return waybill Id
    return {
      statusCode: 200,
      body: JSON.stringify({ subOrderId: body.subOrderId, waybill: scanResponse.Items[0].waybill.S }),
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
