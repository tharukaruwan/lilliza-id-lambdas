const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
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
    const waybill = JSON.parse(event.body).waybill;
    const waybillUpdateData = JSON.parse(event.body);

    if (!waybill) {
      return {
        statusCode: 400,
        body: JSON.stringify(`waybill is required`),
      };
    }

    const paramsNew = {
      TableName: TABLE_NAME,
      Key: {
        waybill: waybill
      },
    };

    const wayBillData = await ddbDocClient.send(new GetCommand(paramsNew));

    if (!wayBillData) {
      return {
        statusCode: 404,
        body: JSON.stringify('waybill not found'),
      };
    }

    let updateItem = {
      ...wayBillData.Item,
      ...waybillUpdateData,
      orderData: wayBillData.Item.orderData,
      pickupData: wayBillData.Item.pickupData
    };

    for (const key in updateItem) {
      if (updateItem[key] === null) {
        delete updateItem[key];
      }
    }
    
    const updateParams = {
      TableName: TABLE_NAME,
      Item: updateItem,
    };

    await ddbDocClient.send(new PutCommand(updateParams));

    return {
      statusCode: 200,
      body: JSON.stringify(updateItem),
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
