
const  validator = require("validator");
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


    let findProductbyTitle = await productModel.findOne({ title: title });
    if (findProductbyTitle)return res.status(409).send({ status: false, message: "title is already exist" });


    if(!title) return res.status(400).send({ status: false, message: "title is required" })
    if(!validateTitle.test(title.split(" ").join("")))return res.status(400).send({ status: false, message: "plz enter valid title" });

    if (!description)return res.status(400).send({ status: false, message: "description is mandatory" });
    if (!validateTitle.test(description.split(" ").join("")))return res.status(400).send({ status: false, message: "plz enter valid description" });


    if(!price) return res.status(400).send({ status: false, message: "price is mandatory" });
    
    if(!validator.isNumeric(price)) return res.status(409).send({ status: false, message: "Enter valid price" });

    if(!currencyId) return res.status(400).send({ status: false, message: "Currency is mandatory" });
  
    if(currencyId != "INR") return res.status(400).send({ status: false, message: "Invalid currency, plz enter [INR]" });


    if(!currencyFormat) return res.status(400).send({ status: false, message: "currencyFormat is mandatory,[₹]" });
    if(currencyFormat != "₹") return res.status(400).send({ status: false, message: "currencyFormat should be in,[₹]" });
 

    let productImage = req.files
    if(productImage.length===0) return res.status(400).send({status:false,message:"profileImaje is mandatory"})
    
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
    
    if(!availableSizes) return res.status(400).send({ status: false, message: `availableSizes is mandatory  ["S", "XS","M","X", "L","XXL", "XL"]`});

    if(!sizeArr.includes(availableSizes)) return res.status(400).send({ status: false, message: ` ${availableSizes} is not availbale, plz select size from this -> ["S", "XS","M","X", "L","XXL", "XL"]`});



    if(installments){
       
        if(!validator.isNumeric(installments)) return res.status(400).send({status:false, message: "Invalid Installment / installment must be greater than 0" });
    }



    let productDetails = {title,description,price,currencyId,currencyFormat,productImage:uploadedFileURL,availableSizes,installments}

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
   
      let {size,name,priceLessThan,priceGreaterThan, ...rest}= data
      if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: 'please enter valid filter, userId, category and subcategory' });
     

      let filter = {
        isDeleted:false
      }

      if(size ){
        filter.availableSizes=size
      }

      if(priceLessThan){
        filter.price = priceLessThan
      }
      
      // if(name){
      //   let findByTitle = await productModel.find()
      //   let filterTitle = findByTitle.filter((x)=>{
      //     return x.title.includes(name)
      //   })
        
      //   filter.title=filterTitle
      // }

      // console.log(filter)

    let findProduct = await productModel.find({price:{$gt:priceLessThan}})



      // let savedData = await productModel.find(data)
      return res.status(200).send({status:false,message:"success",data:findProduct})
  } catch (error) {
      res.status(500).send({status:false,message:error.message})
      console.log(error.message);
  }

}






module.exports = {createProduct,getProduct}