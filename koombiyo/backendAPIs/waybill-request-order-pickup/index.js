const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const axios = require('axios');

const ddbClient = new DynamoDBClient({ region: process.env.DYNAMODB_REGION.toString() });
const marshallOptions = { convertEmptyValues: false, removeUndefinedValues: false, convertClassInstanceToMap: false };
const unmarshallOptions = { wrapNumbers: false };
const translateConfig = { marshallOptions, unmarshallOptions };

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME.toString();
const API_KEY = process.env.API_KEY.toString();
const KOOMBIYO_API_KEY = process.env.KOOMBIYO_API_KEY.toString();
const KOOMBIYO_ORDER_POST_API = process.env.KOOMBIYO_ORDER_POST_API.toString();
const KOOMBIYO_PICKUP_POST_API = process.env.KOOMBIYO_PICKUP_POST_API.toString();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

exports.handler = async (event) => {

  try {
    // message from SNS
    const body = JSON.parse(event.Records[0].Sns.Message);
    // const body = event;
    let errorExist = false;

    let orderRequest = false;
    let pickupRequest = false;

    if (body.api_key != API_KEY) {
      console.error("Not authorised");
      errorExist = true;
    }

    if (!body.orderWaybillid) {
      console.error("orderWaybillid is required");
      errorExist = true;
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        waybill: body.orderWaybillid
      },
    };

    const wayBillData = await ddbDocClient.send(new GetCommand(params));

    if (!wayBillData.Item.isAssigned) {
      console.error("waybillid not yet assigned");
      errorExist = true;
    }

    if (wayBillData.Item.isError) {
      console.error("Already erroe in the record. Contact administration");
      errorExist = true;
    }

    if (body.orderNo != wayBillData.Item.subOrderId) {
      console.error("orderNo conflict : ", body.orderNo , wayBillData.Item.subOrderId);
      errorExist = true;
    }
    
    if (errorExist) {
      const updateErrParams = {
        TableName: TABLE_NAME,
        Item: {
          ...wayBillData.Item,
          isError: true
        },
      };
      await ddbDocClient.send(new PutCommand(updateErrParams));
      return;
    }

    // body validation
    const requiredKeys = ['api_key', 'orderWaybillid', 'orderNo', 'receiverName', 'receiverStreet', 'receiverDistrict', 'receiverCity', 'receiverPhone', 'description', 'spclNote', 'getCod', 'vehicleType', 'pickup_remark', 'pickup_address', 'latitude', 'longitude', 'phone', 'qty'];
    const emptykeys = [];
    for (let key of requiredKeys) {
      if (!body.hasOwnProperty(key)) {
        emptykeys.push(key)
      }
    }

    if (emptykeys.length > 0) {
      const updateErrParams = {
        TableName: TABLE_NAME,
        Item: {
          ...wayBillData.Item,
          isError: true
        },
      };
      await ddbDocClient.send(new PutCommand(updateErrParams));
      return;
    }

    // koombiyo request order
    const orderData = {
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
      getCod: (wayBillData.Item.isCOD == true) ? body.getCod : 0
    };

    const koombiyoOrderRes = await axios.post(KOOMBIYO_ORDER_POST_API, orderData).then(res => res);

    if (koombiyoOrderRes.status == 200) {
      orderRequest = true;
    }
    
    // koombiyo request pickup
    const pickupData = {
      apikey: KOOMBIYO_API_KEY,
      vehicleType: body.vehicleType,
      pickup_remark: body.pickup_remark,
      pickup_address: body.pickup_address,
      latitude: body.latitude,
      longitude: body.longitude,								
      phone: body.phone,							
      qty: body.qty
    };

    const koombiyoPickupRes = await axios.post(KOOMBIYO_PICKUP_POST_API, pickupData).then(res => res);

    if (koombiyoPickupRes.status == 200) {
      pickupRequest = true;
    }

    // update lilliza system record
    delete orderData.apikey;
    delete pickupData.apikey;
    const updateOrderRequestParams = {
      TableName: TABLE_NAME,
      Item: {
        ...wayBillData.Item,
        isError: (!orderRequest || !pickupRequest) ? true : false,
        orderPlaced: orderRequest,
        pickUpRequested: pickupRequest,
        orderData: JSON.stringify(orderData),
        pickupData: JSON.stringify(pickupData)
      },
    };

    await ddbDocClient.send(new PutCommand(updateOrderRequestParams));
    return;

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify(err.message),
    };

  }

};
