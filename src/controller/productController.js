
const { default: mongoose } = require("mongoose");
const  validator = require("validator");
const { default: isBoolean } = require("validator/lib/isboolean");
const productModel = require("../models/productModel");
const { uploadFile } = require("./aws");


let validateTitle = /^[^0-9][a-z , A-Z0-9_ ? @ ! $ % & * : ]+$/;



const createProduct = async(req,res)=>{
    try {
        let data = req.body
    if (Object.keys(data).length === 0)
    return res
      .status(400)
      .send({ status: false, message: "plz provide valid details" });

    let {title,description,price,currencyId,currencyFormat,availableSizes,installments} = data

      // let sizeArr1 = [...availableSizes]
      console.log(availableSizes)
      // console.log(sizeArr1)
      if(!title) return res.status(400).send({ status: false, message: "title is required" })
      if(!validateTitle.test(title.split(" ").join("")))return res.status(400).send({ status: false, message: "plz enter valid title" });

    let findProductbyTitle = await productModel.findOne({ title: title });
    if (findProductbyTitle)return res.status(409).send({ status: false, message: "title is already exist" });



    if (!description)return res.status(400).send({ status: false, message: "description is mandatory" });
    if (!validateTitle.test(description.split(" ").join("")))return res.status(400).send({ status: false, message: "plz enter valid description" });


    if(!price) return res.status(400).send({ status: false, message: "price is mandatory" });
    
    if(!validator.isNumeric(price)) return res.status(409).send({ status: false, message: "Enter valid price" });

    if(!currencyId) return res.status(400).send({ status: false, message: "Currency is mandatory" });
  
    if(currencyId != "INR") return res.status(400).send({ status: false, message: "Invalid currency, plz enter [INR]" });


    if(!currencyFormat) return res.status(400).send({ status: false, message: "currencyFormat is mandatory,[₹]" });
    if(currencyFormat != "₹") return res.status(400).send({ status: false, message: "currencyFormat should be in,[₹]" });
 

    let productImage = req.files
    if(productImage.length===0) return res.status(400).send({status:false,message:"productImage is mandatory"})
    
    let urlType = productImage[0].originalname;
    if(!/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(urlType)) return res.status(400).send({status:false,message:"Plz provide valid image file"})
    
    let uploadedFileURL;
    if (productImage.length > 0) {
      uploadedFileURL = await uploadFile(productImage[0]);
    } 

    if(!uploadedFileURL) return res.status(400).send({status:false, message: "No file found" });

    if(data.style){
        if(!validator.isAlpha(data.style)) return res.status(400).send({status:false,message:"Invalid style details, style be in alphabates"})
    }
    
    let sizeArr = ["S","XS","M","X", "L","XXL", "XL"]
    

    if(availableSizes.length < 1) return res.status(400).send({ status: false, message: `availableSizes is mandatory  ["S", "XS","M","X", "L","XXL", "XL"]`});
    console.log(availableSizes.length);
    availableSizes = availableSizes.split(",").map((x)=>x.trim().toUpperCase())
    let duplicateSize = availableSizes.filter((item, index) => availableSizes.indexOf(item) !== index)
    console.log(duplicateSize);
    for(let i=0;i<duplicateSize.length;i++){
      if(!sizeArr.includes(duplicateSize[i]))return res.status(400).send({ status: false, message: ` ${duplicateSize} is not availbale, plz select size from this -> ["S", "XS","M","X", "L","XXL", "XL"]`});
    }



    if(installments){
       
        if(!validator.isNumeric(installments)) return res.status(400).send({status:false, message: "Invalid Installment / installment must be greater than 0" });
    }

  

    let productDetails = {title,description,price,currencyId,currencyFormat,productImage:uploadedFileURL,availableSizes:duplicateSize,installments}

    let createProduct = await productModel.create(productDetails)

    res.status(201).send({status:true, message:"Success", data:createProduct})

    } catch (error) {

        res.status(500).send({status:false,message:error.message})
        console.log("error in createProduct", error.message)
    }



}



const getProduct = async function(req,res){
  try {
      let data = req.query
      if(Object.keys(data).length===0) {
        let findProduct = await productModel.find({isDeleted:false})
        if(findProduct.length===0) return res.status(404).send({status:false,message:"products not found"})
        return res.status(200).send({status:true,message:"Success",data:findProduct})
      }
   
      let {size,name,priceLessThan,priceGreaterThan,priceSort, ...rest}= data
      if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: 'please enter valid filter, [ size, name, priceLessThan, priceGreaterThan, priceSort]' });
  

      let filter = {
        isDeleted:false
      }

      if(size){
        let sizeArr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
        size = size.trim().toUpperCase()
        if(!sizeArr.includes(size)) return res.status(400).send({ status: false, message: ` ${size} is not availbale, plz select size from this -> ["S", "XS","M","X", "L","XXL", "XL"]`});
        filter.availableSizes=size
      }


      if(name){
        name = name.trim()
        if(!validator.isAlpha(name.split(" ").join(""))) return res.status(400).send({status:false,message:"type of name must be string"})
        // let findByTitle = await productModel.find()
        // var filterTitle = findByTitle.filter((x)=>{
        //   return x.title.includes(name)
        // })
        
        filter.title= {$regex: name }
      }

      if(priceLessThan && priceGreaterThan){

        priceLessThan = priceLessThan.trim()
        priceGreaterThan = priceGreaterThan.trim()

        if(!validator.isNumeric(priceLessThan) || !validator.isNumeric(priceGreaterThan)) return res.status(400).send({status:false,message:"sorting price [priceLessThan, priceLessThan] type must be number"})
        filter.price = {$gte : priceGreaterThan, $lte:priceLessThan}

      } else if(priceLessThan){

        priceLessThan = priceLessThan.trim()
        if(!validator.isNumeric(priceLessThan)) return res.status(400).send({status:false,message:" priceLessThan type must be number"})
        filter.price = {$lte:priceLessThan}

      }else if(priceGreaterThan){

        priceGreaterThan = priceGreaterThan.trim()
        if(!validator.isNumeric(priceGreaterThan) ) return res.status(400).send({status:false,message:"priceLessThan type must be number"})
        filter.price = {$gte:priceGreaterThan}

      }
      
      if(priceSort){
        priceSort = priceSort.trim()
        if (priceSort != 1 && priceSort != - 1)  return res.status(400).send({status:false,message:"priceSort must be 1 or -1"})
      } 

      // if(!priceSort) priceSort = 1
      
      let findProduct = await productModel.find(filter).sort({price:priceSort})

      if(findProduct.length===0) return res.status(404).send({status:false,message:"Product not found"})
      
      // if(filterTitle){
      //   return res.send({data:filterTitle})

      // }else{
      //  return res.send({data:findProduct})
      // }
   
      return res.status(200).send({status:true,message:"Success", data:findProduct})
  } catch (error) {
      res.status(500).send({status:false,message:error.message})
      console.log(error.message);
  }

}




const getProductByID = async function(req,res){
  try {
      let productId = req.params.productId

      if(!mongoose.isValidObjectId(productId)) return res.status(400).send({status:false,message:"product id invaild"})

      let checkProduct = await productModel.findOne({_id:productId,isDeleted:false})

      if(!checkProduct) return res.status(404).send({status:false,message:"product not found"})

      return res.status(200).send({status:true,message:"Success",data:checkProduct})

  } catch (error) {

      res.status(500).send({status:false,message:error.message})

      console.log("error in getProductById",error.mesage);
  }

}


const updateProduct = async function(req,res){
  try {
      let productId = req.params.productId
  
     
      if(!mongoose.isValidObjectId(productId)) return res.status(400).send({status:false,message:"product id invaild"})

      

      let data = req.body
      let productImage = req.files
    
     
   
 

      if(productImage){
        if(productImage.length>0){

          if(productImage[0].fieldname != "productImage"){
            return res.send({status:false,message:"invalid image key, use [ productImage ] as key"})
        }
        }
        
      }
    
      
      if(Object.keys(data).length === 0 && typeof productImage == "undefined" ) {
        

        return res.status(400).send({status:false,message:"Pls send some data to update"})

      }
      
      let {title,description,price,isFreeShipping,style,availableSizes,installments,...rest} = data

      if(Object.keys(rest).length > 0) return res.status(400).send({staus:false,message:"pls provide valid fields"})

      if(title){
         title = title.replace(/\s+/g, ' ').trim()
         if(!validateTitle.test(title)) return res.status(400).send({staus:false,message:"Given title is invalid"})
          checkTitle = await productModel.findOne({title:title,isDeleted:false})
          if(checkTitle) return res.status(400).send({staus:false,message:"This title already exist ,pls provide another title"})
      }

      if(description){ 
         description = description.replace(/\s+/g, ' ').trim()
         if(!validateTitle.test(description)) return res.status(400).send({staus:false,message:"Given description is invalid"})
      }

    
      if(price){ 
        price = price.replace(/\s+/g, '').trim()
      
         if(!validator.isNumeric(price)) return res.status(400).send({staus:false,message:"Given price is invalid, price should be number"})
      }

      if(isFreeShipping){
      
        isFreeShipping = isFreeShipping.trim().toLowerCase()
       
        if(!validator.isBoolean(isFreeShipping))  return res.status(400).send({status:false,message:"isFreeShipping value must be true or false"})

      } 

      

      let uploadedFileURL;
      if(productImage.length>0) {
        // if(productImage.length===0) return res.status(400).send({status:false,message:"profileImaje is mandatory"})
        let urlType = productImage[0].originalname;
        if(!/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(urlType)) return res.status(400).send({status:false,message:"Plz provide valid image file"})
        if (productImage.length > 0) {
          uploadedFileURL = await uploadFile(productImage[0]);
        } 

        if(!uploadedFileURL) return res.status(400).send({status:false, message: "No file found" });
      }


      if(style){
        style = style.replace(/\s+/g, ' ').trim()
        if(!validateTitle.test(style)) return res.status(400).send({status:false,message:"Invalid style details, style be in alphabates"})

    }


    
    if(availableSizes){
      let sizeArr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
      availableSizes = availableSizes.split(",").map((x)=>x.trim().toUpperCase())
      for(let i=0;i<availableSizes.length;i++){
        if(!sizeArr.includes(availableSizes[i]))return res.status(400).send({ status: false, message: ` ${availableSizes} is not availbale, plz select size from this -> ["S", "XS","M","X", "L","XXL", "XL"]`});
      }
      // if(!sizeArr.includes(availableSizes)) return res.status(400).send({ status: false, message: ` ${availableSizes} is not availbale, plz select size from this -> ["S", "XS","M","X", "L","XXL", "XL"]`});
      console.log(availableSizes)
    }



    if(installments){
      installments = installments.replace(/\s+/g, ' ').trim()
        if(!validator.isNumeric(installments)) return res.status(400).send({status:false, message: "Invalid Installment / installment must be greater than 0" });
    }

 
      let updateProductData ={title,description,price,isFreeShipping,productImage:uploadedFileURL,style,availableSizes,installments}


   let updatedData = await productModel.findOneAndUpdate({_id:productId,isDeleted:false},updateProductData,{new:true})
      if(!updatedData)  return res.status(404).send({staus:false,message:"No Product Found"})
      return res.status(200).send({status:true,message:"Success",data:updatedData})


  } catch (error) {
      res.status(500).send({status:false,message:error.message})
      console.log(error.mesage);
  }
}



const deleteProduct = async function(req,res){
  let data = req.params.productId

  if(!mongoose.isValidObjectId(data)) return res.status(400).send({status:false,message:"product id invaild"})

  let checkProduct = await productModel.findOneAndUpdate({_id:data,isDeleted:false},{$set:{isDeleted:true,deletedAt:Date.now()}},{new:true})

  if(!checkProduct) return res.status(404).send({status:false,message:"product not found or already deleted"})

  return res.status(200).send({status:true,message:"Success",data:checkProduct})
}


module.exports = {createProduct,getProduct, getProductByID,updateProduct,deleteProduct }