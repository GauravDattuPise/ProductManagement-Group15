const cartModels = require("../models/cartModels")
const productModel = require("../models/productModel")
const userModel = require("../models/userModel")


const createCart = async(req,res)=>{
    let data = req.body
    let userId1 = req.params.userId
    
    let {items,userId,cartId,totalItems} = data
    
    let [{productId,quantity}] = items

    userId = userId1

    let checkProduct = await productModel.findOne({_id:productId,isDeleted:false})
    if(!checkProduct) return res.status(404).send({status:false,message:"no product found"})
    console.log(checkProduct)

    let checkUser = await userModel.findOne({_id:userId})
    if(!checkUser) return res.status(404).send({status:false,message:"no user found"})

    let price = checkProduct.price

    // checking if user has cart or not
    let checkuserHasCart = await cartModels.findOne({userId:userId})
   
   
    let cartData = {
        userId,items,totalItems:1,totalPrice:price
    }
 

    /// if no cart, then create cart /// [ checking bu userId]

    if(!checkuserHasCart) {
        let createCart = await cartModels.create(cartData)
        cartData.totalPrice = price
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

                console.log(productAvailable)
                console.log(price)
              console.log(  productAvailable.totalPrice + price)

                cartData.totalPrice = price + productAvailable.totalPrice
                productAvailable.totalPrice =  cartData.totalPrice 
                return res.status(201).send({status:true,message:"productAvailable",data:productAvailable}) 
            }

            if(!checkProductDublicate){
                let arr = checkuserHasCart.items.concat(items)  
             
                cartData.items=arr
                cartData.totalItems = arr.length
                cartData.totalPrice  = price +  cartData.totalPrice
                let productAvailable = await cartModels.findOneAndUpdate({_id:cartId},cartData,{new:true})
             
                return res.status(201).send({status:true,message:"productAvailable",data:productAvailable})
            }
           


    }


    


}

module.exports = {createCart}