const cartModels = require("../models/cartModels")
const productModel = require("../models/productModel")
const userModel = require("../models/userModel")


const createCart = async(req,res)=>{
    let data = req.body
    let userId1 = req.params.userId
    
    let {items,userId,cartId,totalItems} = data
    
    let [{productId,quantity}] = items

    let checkProduct = await productModel.findOne({_id:productId,isDeleted:false})
    if(!checkProduct) return res.status(404).send({status:false,message:"no product found"})

    let checkUser = await userModel.findOne({_id:userId})
    if(!checkUser) return res.status(404).send({status:false,message:"no user found"})


    // checking if user has cart or not
    let checkuserHasCart = await cartModels.findOne({userId:userId})
   
 
    let cartData = {
        userId,items,totalItems,totalPrice:1
    }
 

    /// if no cart, then create cart /// [ checking bu userId]

    if(!checkuserHasCart) {
        let createCart = await cartModels.create(cartData)
        cartData.totalItems = checkuserHasCart.items.length
        return res.status(201).send({status:true,message:"Success cart",data:createCart})
    }


    // if user has cart then push product id to items
    
    if(checkuserHasCart) {

            cartId = checkuserHasCart._id.toString()
            console.log(cartId)
            // let updateCart = await cartModel.findOneAndUpdate({ userId: userId, "items.productId": productId }, { $inc: { "items.$.quantity": productQuantity, totalPrice: priceToAdd } }, { new: true }).select({ __v: 0, "items._id": 0 })
            let checkProductDublicate = await cartModels.findOne({"items.productId": productId })

            if (checkProductDublicate){
                let productAvailable = await cartModels.findOneAndUpdate({"items.productId": productId },{$inc:{'items.$.quantity':1}},{new:true})
                cartData.totalItems = checkuserHasCart.items.length
                console.log(totalItems);
                return res.status(201).send({status:true,message:"productAvailable",data:productAvailable}) 
            }

            if(!checkProductDublicate){
                let arr = checkuserHasCart.items.concat(items)  
                console.log(arr)
                cartData.items=arr
                // cartData.totalItems = checkuserHasCart.items.length
                cartData.totalItems = checkuserHasCart.items.length
                console.log(totalItems);
                let productAvailable = await cartModels.findOneAndUpdate({_id:cartId},cartData,{new:true})
                return res.status(201).send({status:true,message:"productAvailable",data:productAvailable})
            }
           


    }


    


}

module.exports = {createCart}