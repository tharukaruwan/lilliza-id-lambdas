const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const jwt = require('jsonwebtoken');
const axios = require('axios');

const ddbClient = new DynamoDBClient({ region: process.env.DYNAMODB_REGION.toString() });
const marshallOptions = { convertEmptyValues: false, removeUndefinedValues: false, convertClassInstanceToMap: false };
const unmarshallOptions = { wrapNumbers: false };
const translateConfig = { marshallOptions, unmarshallOptions };

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME.toString();
const KOOMBIYO_API_KEY = process.env.KOOMBIYO_API_KEY.toString();
const KOOMBIYO_ORDER_POST_API = process.env.KOOMBIYO_ORDER_POST_API.toString();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

exports.handler = async (event) => {

  try {
    const body = JSON.parse(event.body);
    const token = event.headers.authorization?.split(' ')[1];
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

    // body validation
    const requiredKeys = ['orderWaybillid', 'orderNo', 'receiverName', 'receiverStreet', 'receiverDistrict', 'receiverCity', 'receiverPhone', 'description', 'spclNote', 'getCod'];
    const emptykeys = [];
    for (let key of requiredKeys) {
      if (!body.hasOwnProperty(key)) {
        emptykeys.push(key)
      }
    }

    if (emptykeys.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify(`${emptykeys} required`),
      };
    }

    // check if orderWaybillid and orderNo record exist
    const params = {
      TableName: TABLE_NAME,
      Key: {
        waybill: body.orderWaybillid
      },
    };

    const wayBillRecord = await ddbDocClient.send(new GetCommand(params));
    if (!wayBillRecord) {
      return {
        statusCode: 404,
        body: JSON.stringify('waybill not found'),
      };
    }

    if ((wayBillData.Item.subOrderId != body.orderNo) || (wayBillData.Item.isAssigned != true)) {
      return {
        statusCode: 409,
        body: JSON.stringify("order has to be assign first to request pickup"),
      };
    }

    if (wayBillData.Item.orderPlaced == true) {
      return {
        statusCode: 409,
        body: JSON.stringify('already order Placed'),
      };
    }

    // koombiyo order request
    const postData = {
      apikey: KOOMBIYO_API_KEY,
      orderWaybillid: body.orderWaybillid,
      orderNo: body.orderNo,
      receiverName: body.receiverName,
      receiverStreet: body.receiverStreet,
      receiverDistrict: body.receiverDistrict,								
      receiverCity: body.receiverCity,							
      receiverPhone: body.receiverPhone,
      description: body.description,
      spclNote: body.spclNote,
      getCod: wayBillData.Item.isCOD ? body.getCod : 0
    };
    
    const koombiyoRes = await axios.post(KOOMBIYO_ORDER_POST_API, postData).then(res => res);

    if (koombiyoRes.statusCode != 200) {
      return {
        statusCode: 500,
        body: JSON.stringify(`koombiyo system failour`),
      };
    }

    // if sucess update record as order requested
    const updateOrderRequestParams = {
      TableName: TABLE_NAME,
      Item: {
        ...wayBillRecord.Item,
        orderPlaced: true,
        orderData: JSON.stringify(postData)
      },
    };

    const updatedrecord = await ddbDocClient.send(new PutCommand(updateOrderRequestParams));
    if (!updatedrecord) {
      return {
        statusCode: 207,
        body: JSON.stringify('koombiyo order placed but could not update lilliza system'),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ...wayBillRecord.Item, orderPlaced: true, orderData: postData }),
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
