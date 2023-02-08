



// ### POST /users/:userId/orders
// - Create an order for the user
// - Make sure the userId in params and in JWT token match.
// - Make sure the user exist
// - Get cart details in the request body

//get cart details from userID.
//

const cartModels = require("../models/cartModels")
const orderModel = require("../models/orderModel")
const userModel = require("../models/userModel")

const createOrder = async function(req,res){
    try {
        let data = req.body
        let userId = req.params.userId
        if(Object.keys(data).length===0) return res.status(400).send({status:false,message:"pls send cartId"})
        let{cartId,...rest} = data
        if(Object.keys(rest).length>0) return res.status(400).send({status:false,message:"pls send valid fields"})
      
        let cartCheck = await cartModels.findOne({_id:cartId,userId:userId}).select({__v:0,createdAt:0,updatedAt:0})
        if(!cartCheck) return res.status(404).send({status:false,message:"Cart Not found"})
         let count = 0
        let totalQuantity = cartCheck.items.filter((x)=>{
            return count += x.quantity
        })
     
        let orderData = {
            userId:userId,
            items:cartCheck.items,
            totalQuantity : count,
            totalItems :cartCheck.totalItems,
            totalPrice : cartCheck.totalPrice
        }

        let createOrder = await orderModel.create(orderData)

        return res.status(200).send({status:true,message:"Success",data:createOrder})

    } catch (error) {
        console.log("error in create order",error.message)
        return res.status(500).send({status:false,message:error.message})
    }
}


const updateOrder = async(req,res)=>{
    let data = req.body
    let userId = req.params.userId
    let {orderId,status,...rest} = data

    if(!orderId) return res.status(400).send({status:false,message:"provide orderId for update order"})
    if(!status) return res.status(400).send({status:false,message:"provide status for update order, [ completed cancled]"})
    let checkOrder = await orderModel.findOne({_id:orderId,userId:userId})
    if(!checkOrder) return res.status(404).send({status:false,message:"Order not found"})
  
    if(status == "pending" ) return res.status(400).send({status:false,message:"order status is default pending, you cannot set maually to 'pending', Use [ completed, cancled] "})
    if(!["completed", "cancled"].includes(status)) return res.status(400).send({status:false,message:"send valid status, [ completed, cancled]"})
    let checkCancel = checkOrder.cancellable
    let updateDoc = {

    }
    if(checkOrder.status == "cancled" ) return res.status(400).send({status:false,message:"Given order already cancelled"})
    if(checkOrder.status == "completed" ) return res.status(400).send({status:false,message:"Given order has been completed, You cannot cancel this order"})
   
    if(checkCancel == true){
        if(checkOrder.status == "pending") {
            checkOrder.status = status
            checkOrder.cancellable = false
        }

    } else if (checkCancel == false && status=="completed"){
        if(checkOrder.status == "pending") {
            checkOrder.status = status
           
        }

    }else{
        return res.status(400).send({status:false,message:"You can not update status of this order"})

    }

    let updateOrder = await orderModel.findOneAndUpdate({_id:orderId,isDeleted:false},{$set:{status:status,cancellable:false}},{new:true})

    return res.status(200).send({status:true,message:"Success", data:updateOrder})

}







module.exports={createOrder,updateOrder}