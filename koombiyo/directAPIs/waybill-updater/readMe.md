* TRIGER : ROUT HTTP API GATEWAY
* API METHOD : PUT
* API ROUT : https://api.lilliza.com/id/waybill-details

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
	"waybill": "waybillID",        // Partition key <= dont change
	"subOrderId": "subOrderId",
	"isAssigned": false,
	"isReturn": false,
	"isCOD": false,
	"isError": false,
	"orderPlaced": false,
	"pickUpRequested": false
}

SAMPLE HEADER FOR API REQUEST (ACCESS TOKEN)
============================================

Authorization : Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2NrZW50eXBlIjoicmVmcmVzaFRvY2tlbiIsInVzZXJ0eXBlIjoidXNlciIsIm5pY2tuYW1lIjoieGV0b2tpNzg2MSIsImVtYWlsIjoieGV0b2tpNzg2MUBlZGluZWwuY29tIiwicm9sZSI6ImZlbWFsZSIsImFjdGl2ZSI6dHJ1ZSwiZGlkIjoiZGlkIiwidGlkIjoibHhmLTFjYS05ZTl1IiwiaWF0IjoxNjcxOTg1NTY0LCJleHAiOjE3MDM1NDMxNjR9.vIUT8lL6PYWFShztNnOkeBLSzmEKPbdgZn94Rh9qtZI

SAMPLE ENV DATA
===============

DYNAMODB_REGION = ap-southeast-1
DYNAMODB_TABLE_NAME = lilliza-koombiyo-waybill
PRIVATEKEY_ACCESSTOCKEN = jwt-access-key
