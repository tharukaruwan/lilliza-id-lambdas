const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand,  } = require("@aws-sdk/lib-dynamodb");

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

    const currentDate = new Date();
    // const currentMonth = currentDate.getMonth();
    // const currentDay = currentDate.getDay();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    const currentSecond = currentDate.getSeconds();
    // const currentMilliSecond = currentDate.getMilliseconds();

    let response = {};

    if (body.order.toString() == "true") {
      const paramsOrder = {
        TableName: TABLE_NAME,
        Key: {
          versionId: "1.0.0+O",
          regionId: "south_asia",
        },
      };
      const orderIdData = await ddbDocClient.send(new GetCommand(paramsOrder));
      if (!orderIdData) {
        return {
          statusCode: 404,
          body: JSON.stringify('order id not found'),
        };
      }
      const orderCount = parseInt(orderIdData.Item.count ? orderIdData.Item.count : 0) + 1;
      response.orderId = `V1SA${orderCount}-${currentHour}${currentMinute}${currentSecond}${body.user.toString().substring(0, 2).toUpperCase()}`;
      const orderIdDataUpdate = {
        ...orderIdData.Item,
        count: orderCount
      }; 
      const updateOrderParams = {
        TableName: TABLE_NAME,
        Item: orderIdDataUpdate,
      };  
      await ddbDocClient.send(new PutCommand(updateOrderParams));
    }

    if (body.suborder.toString() == "true") {
      const paramsSubOrder = {
        TableName: TABLE_NAME,
        Key: {
          versionId: "1.0.0+S",
          regionId: "south_asia",
        },
      };
      const subOrderIdData = await ddbDocClient.send(new GetCommand(paramsSubOrder));
      if (!subOrderIdData) {
        return {
          statusCode: 404,
          body: JSON.stringify('sub order id not found'),
        };
      }
      const subOrderCount = parseInt(subOrderIdData.Item.count ? subOrderIdData.Item.count : 0) + 1;
      response.subOrderId = `SV1SA${subOrderCount}-${currentHour}${currentMinute}${currentSecond}${body.user.toString().substring(0, 2).toUpperCase()}`;
      const subOrderIdDataUpdate = {
        ...subOrderIdData.Item,
        count: subOrderCount
      }; 
      const updateSubOrderParams = {
        TableName: TABLE_NAME,
        Item: subOrderIdDataUpdate,
      };  
      await ddbDocClient.send(new PutCommand(updateSubOrderParams));
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };

  } catch (err) {

    return {
      statusCode: 500,
      body: JSON.stringify(err.message),
    };

  }

};
