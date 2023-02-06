let productQuantity = body.quantity
        let productPrice = productSearch.price

      
        let items = [{ productId: productId, quantity: productQuantity }]
        
        let cartSearch = await cartModel.findOne({ userId : userId})
        if(cartSearch){
          
            let priceToAdd = productSearch.price * productQuantity
                        
            let updateCart = await cartModel.findOneAndUpdate({ userId: userId, "items.productId": productId }, { $inc: { "items.$.quantity": productQuantity, totalPrice: priceToAdd } }, { new: true }).select({ __v: 0, "items._id": 0 })  
     
            if(updateCart == null){
                updateCart = await cartModel.findOneAndUpdate({ userId: userId }, { $addToSet: { items: items }, $inc: { totalPrice: priceToAdd, totalItems: 1 } }, { new: true }).select({ __v: 0, "items._id": 0 })     
            }
            return res.send({ status: true, message: "Cart created successfully", data: updateCart })
  
        }else{ }