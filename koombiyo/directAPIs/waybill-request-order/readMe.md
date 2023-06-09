* TRIGER : ROUT HTTP API GATEWAY
* API METHOD : POST
* API ROUT : https://api.lilliza.com/id/waybill-request-order

DYNAMODB TABLE STRUCTURE
========================
{
	waybill: string,        // partition key, koombiyo waybill id
	subOrderId: string,		// sub order id
	isAssigned: bool,       // is lilliza sub order assigned for waybill
	isReturn: bool,			// is it return or first time order delivery
	isCOD: bool,			// is cashon delivery
	isError: bool,			// if error occured when calling koombiyo order or pickup apis
	orderPlaced: bool,		// is koombiyo order placed
	pickUpRequested: bool,	// is koombiyo pickup requested
	orderData: string,		// order place koombiyo api body
	pickupData: string		// order pickup koombiyo api body
}

SAMPLE BODY
===========
{
	"orderWaybillid": "orderWaybillid",        
	"orderNo": "orderNo",					// sub order id
	"receiverName": "receiverName",
	"receiverStreet": "receiver addess",
	"receiverDistrict": "receiverDistrict",	// ask from koombiyo api doc for any mapping
	"receiverCity": "receiverCity",			// ask from koombiyo api doc for any mapping
	"receiverPhone": "receiverPhone",		// ask from koombiyo api doc for any validation
	"description": "description",
	"spclNote": "spclNote",
	"getCod": "getCod"						// cod amount
}

SAMPLE HEADER FOR API REQUEST (ACCESS TOKEN)
============================================

Authorization : Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2NrZW50eXBlIjoicmVmcmVzaFRvY2tlbiIsInVzZXJ0eXBlIjoidXNlciIsIm5pY2tuYW1lIjoieGV0b2tpNzg2MSIsImVtYWlsIjoieGV0b2tpNzg2MUBlZGluZWwuY29tIiwicm9sZSI6ImZlbWFsZSIsImFjdGl2ZSI6dHJ1ZSwiZGlkIjoiZGlkIiwidGlkIjoibHhmLTFjYS05ZTl1IiwiaWF0IjoxNjcxOTg1NTY0LCJleHAiOjE3MDM1NDMxNjR9.vIUT8lL6PYWFShztNnOkeBLSzmEKPbdgZn94Rh9qtZI

SAMPLE ENV DATA
===============

DYNAMODB_REGION = ap-southeast-1
DYNAMODB_TABLE_NAME = lilliza-koombiyo-waybill
PRIVATEKEY_ACCESSTOCKEN = jwt-access-key
KOOMBIYO_API_KEY = apikeyhere
KOOMBIYO_ORDER_POST_API = https://application.koombiyodelivery.lk/api/Addorders/users