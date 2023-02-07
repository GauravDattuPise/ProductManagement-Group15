



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
        // if(Object.keys(data).length===0) return res.status(400).send({status:false,message:"pls send data"})
        let{cartId,...rest} = data
        if(Object.keys(rest).length >0) return res.status(400).send({status:false,message:"pls send valid fields"})
        // let userCheck = await userModel.findOne({_id:userId})
        let cartCheck = await cartModels.findOne({userId:userId}).select({__v:0,createdAt:0,updatedAt:0})
         console.log(cartCheck);
         let count = 0
        let totalQuantity = cartCheck.items.filter((x)=>{
            return count += x.quantity
        })
        console.log(count);
        
        // let final = await orderModel.create()
        

        let orderData = {
            userId:userId,
            items:cartCheck.items,
            totalQuantity : count,
            totalItems :cartCheck.totalItems,
            totalPrice : cartCheck.totalPrice,
            
        }

        console.log(orderData);

        let createOrder = await orderModel.create(orderData)

        return res.send(createOrder)

    } catch (error) {
        return res.status(500).send({status:false,message:error.message})
    }
}




module.exports={createOrder}