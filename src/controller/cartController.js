const cartModels = require("../models/cartModels")
const productModel = require("../models/productModel")
const userModel = require("../models/userModel")


const createCart = async(req,res)=>{
    let data = req.body
    let userId1 = req.params.userId
    console.log("data", data);
    let {items,userId} = data
    let [{productId,quantity}] = items
    // console.log("items", items)
    // console.log("productId", productId)

     userId = userId1
    let findUser = await userModel.findOne({_id:userId})
    // console.log("user",findUser)
    if(!findUser) return res.status(404).send({status:false,message:"user not found"})
    let findProduct = await productModel.findOne({_id:productId})
    if(!findProduct) return res.status(404).send({status:false,message:"product not found"})
    console.log(findProduct)
    // let productPrice = findProduct.price
    // console.log(productPrice)
    
    // let totalPrice = totalPrice+ productPrice 
    // console.log(totalPrice)
    let totalItems = items.length
    console.log(totalItems)

    let cartData = {userId, items,totalPrice:90,totalItems}
    let findCart = await cartModels.findOne({userId:userId})
    // console.log(findCart);
    if(!findCart){
        let createCart = await cartModels.create(cartData)
        console.log(createCart);
        return res.send(createCart)
    } else{
        
        findCart.items.push(items)
            // let createCart = await cartModels.create(cartData)
        return res.send(findCart)
    } 

}

module.exports = {createCart}