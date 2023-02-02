const  validator = require("validator");
const  JWT  = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const { uploadFile } = require("./aws");
const { default: mongoose } = require("mongoose");
const { findOne } = require("../models/userModel");

let validateMobile = /^[6-9][0-9]{9}$/;

const createUser = async(req,res)=>{
    try {
    let data = req.body
    if (Object.keys(data).length === 0) return res.status(400).send({ message: "plz provide user's data" });
    
    

    let {fname,lname,email,phone,password,address} = data
   



///------------------------- Validation------------------------------------------



if (!fname) return res.status(400).send({ status: false, message: "first name is mandatory" });
if (!validator.isAlpha(fname)) return res.status(400).send({ status: false, message: "plz enter valid first name,  includes only alphabates" });

if (!lname) return res.status(400).send({ status: false, message: "last name is mandatory" });
if (!validator.isAlpha(lname)) return res.status(400).send({ status: false, message: "plz enter valid last name,  includes only alphabates" });


if (!email)return res.status(400).send({ status: false, message: "email is mandatory" });
if (!validator.isEmail(email.trim()))return res.status(400).send({ status: false, message: "plz enter valid email" });
let checkEmailExist = await userModel.findOne({email})
if(checkEmailExist) return res.status(409).send({status:false,message:"This email already exist"})

if (!phone) return res.status(400).send({ status: false, message: "phone is mandatory" });
if (!validateMobile.test(phone)) return res.status(400).send({ status: false, message: "plz enter valid Indian mobile number" });
let checkPhoneExist = await userModel.findOne({phone})
if(checkPhoneExist) return res.status(409).send({status:false,message:"This phone no. already exist"})

if (!password) return res.status(400).send({ status: false, message: "password is mandatory" });
if (password.length > 15 || password.length < 8)return res.status(400).send({
    status: false,
    mesage: "password must be greater than 8 char and less than 15 char",
  });

if (!validator.isStrongPassword(password)) return res.status(400).send({
    status: false,
    message:
      "plz enter strong password, must contain 1 Uppercase,1 Lowercase,1 special-character",
  });


  
  
  
  if(!address || (Object.keys(address).length===0)) return res.status(400).send({status:false,message:"Address is required"})
  let newAddress = JSON.parse(address)
  let {shipping,billing} = newAddress

if(!shipping || (Object.keys(shipping).length===0)) return res.status(400).send({status:false,message:"Shipping address is required"})
if(!shipping.street || !shipping.city || !shipping.pincode) return res.status(400).send({status:false,message:"Shipping address is incomplete"})
if(!validator.isAlphanumeric(shipping.street.split(" ").join(""))) return res.status(400).send({status:false,message:"Invalid street"})
if(!validator.isAlpha(shipping.city.split(" ").join(""))) return res.status(400).send({status:false,message:"Invalid city name"})
if (!/^[^0][0-9]{2}[0-9]{3}$/.test(shipping.pincode))  return res.status(400).send({status: false,message: "Pincode should be a valid pincode number."});



if(!billing || (Object.keys(billing).length===0)) return res.status(400).send({status:false,message:"Billing address is required"})

if(!billing.street || !billing.city || !billing.pincode) return res.status(400).send({status:false,message:"Billing address is incomplete"})
if(!validator.isAlphanumeric(billing.street.split(" ").join(""))) return res.status(400).send({status:false,message:"Invalid street"})
if(!validator.isAlpha(billing.city.split(" ").join(""))) return res.status(400).send({status:false,message:"Invalid city name"})
if (!/^[^0][0-9]{2}[0-9]{3}$/.test(billing.pincode))  return res.status(400).send({status: false,message: "Pincode should be a valid pincode number."});




let imageUrl = req.files
    if(imageUrl.length===0) return res.status(400).send({status:false,message:"profileImaje is mandatory"})
    
    let urlType = imageUrl[0].originalname;
    if(!/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(urlType)) return res.status(400).send({status:false,message:"Plz provide valid image file"})
    
    let uploadedFileURL;
    if (imageUrl.length > 0) {
      uploadedFileURL = await uploadFile(imageUrl[0]);
    } 

    if(!uploadedFileURL) return res.status(400).send({ msg: "No file found" });
   

//--------------------------------Duplicate email, phone --------------------------------------------


    let bcryptPass = await bcrypt.hash(password, 10)
 
    let userData = {fname,lname,email,phone,password:bcryptPass,address:newAddress,profileImage:uploadedFileURL}

    let createUser = await userModel.create(userData)

    res.status(201).send({status:true,message:"User created successfully", data:createUser})

    } catch (error) {
        console.log("error in createUser", error.message);

        res.status(500).send({status:false,message:error.message})
    }

}




const loginUser = async (req,res)=>{
   try {
    let data = req.body

    if (Object.keys(data).length === 0) return res.status(400).send({ message: "plz provide user's data" });
    let {email,password} = data
        
    if (!email)return res.status(400).send({ status: false, message: "email is mandatory" });
    if (!validator.isEmail(email.trim()))return res.status(400).send({ status: false, message: "plz enter valid email" });

    let findUser = await userModel.findOne({email})
    if(!findUser) return res.status(404).send({status:false, message:"User not found"})

     if (!password) return res.status(400).send({ status: false, message: "password is mandatory" });
     if (password.length > 15 || password.length < 8)return res.status(400).send({
     status: false,
     mesage: "password must be greater than 8 char and less than 15 char",
     });

   
     
     let userPassword = findUser.password
     let originalPassword = await bcrypt.compare(password, userPassword)
     if(!originalPassword) return res.status(400).send({status:false, message:"Incorrect password, plz provide valid password"})


     let userId = findUser._id
     let token = JWT.sign({ userId: userId }, "group2project-5", {expiresIn: 8600});
  

     res.status(200).send({status:true,message:"User login successfull", data:{userId:userId, token:token}})

   } catch (error) {

    res.status(500).send({status:false,message:error.mesage})

    console.log("error in loginUser", error.message)

   }
}




const getUser = async (req, res) => {
    try {
      let userId = req.params.userId;

      if(!userId) return res.status(400).send({ status: false, message: "You can not access your profile without valid userId" });

      if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is not vaild" });
      
      if (userId != req.tokenDetails.userId) return res.status(401).send({ status: false, message: "This userId is not authenticate" });
      
      let getUser = await userModel.findOne({ _id: userId });
        console.log(getUser);
      return res.status(200).send({ status: true, message: "User profile details", data: getUser });

    } catch (err) {

      return res.status(500).send({ status: false, message: err.message });

    }
  };


const updateUser = async(req,res)=>{
    try {
        let data = req.body
    let userId = req.params.userId
    if (Object.keys(data).length === 0) return res.status(400).send({ message: "plz provide user's data" });
    
    

    let {fname,lname,email,phone,password,address,...rest} = data

    // if(rest) return res.send("hii")
    if (Object.keys(rest).length > 0) return res.status(400).send({ status: false,message:"pls use valid fields like[fname,lname,email,phone,password,address] to update user details"})
   



///------------------------- Validation------------------------------------------



if (fname ||(fname=="")) {

    if (!validator.isAlpha(fname) ) return res.status(400).send({ status: false, message: "plz enter valid first name,  includes only alphabates" });
}

if (lname ||(lname=="")){

    if (!validator.isAlpha(lname)) return res.status(400).send({ status: false, message: "plz enter valid last name,  includes only alphabates" });
}


if (email ||(email=="")){

    if (!validator.isEmail(email.trim()))return res.status(400).send({ status: false, message: "plz enter valid email" });
    let checkEmailExist = await userModel.findOne({email})
    if(checkEmailExist) return res.status(409).send({status:false,message:"This email already exist, enter another email"})
}

if (phone ||(phone=="")){

    if (!validateMobile.test(phone)) return res.status(400).send({ status: false, message: "plz enter valid Indian mobile number" });
    let checkPhoneExist = await userModel.findOne({phone})
    if(checkPhoneExist) return res.status(409).send({status:false,message:"This phone no. already exist, enter new number"})
}

if (password ||(password=="")) {

    if (password.length > 15 || password.length < 8)return res.status(400).send({
        status: false,
        mesage: "password must be greater than 8 char and less than 15 char",
      });

      if (!validator.isStrongPassword(password)) return res.status(400).send({
          status: false,
          message:
            "plz enter strong password, must contain 1 Uppercase,1 Lowercase,1 special-character",
        });

        var bcryptPass = await bcrypt.hash(password, 10)
}


let getUserData = await userModel.findOne({_id:userId}).select({address:1})


let userNewAddress = getUserData.address

  
if(address ){
    
    var newAddress = JSON.parse(address)
   
    console.log(newAddress);
    if((Object.keys(newAddress).length===0)) return res.status(400).send({status:false,message:"Address is required"})
      let {shipping,billing,...rest} = newAddress
      if (Object.keys(rest).length > 0) return res.status(400).send({ status: false,message:"pls use valid fields[shipping,billing]in address"})

    



    if(shipping){
        if( (Object.keys(shipping).length===0)) return res.status(400).send({status:false,message:"Shipping address is required"})

        let {street,city,pincode,...rest} = shipping
        if (Object.keys(rest).length > 0) return res.status(400).send({ status: false,message:"pls use valid fields[street,city,pincode] in shipping"})
   


        if(shipping.street){

            if(!/^[^0-9][a-z , A-Z0-9_ ? @ ! $ % & * : ]+$/.test(shipping.street.split(" ").join(""))) return res.status(400).send({status:false,message:"Invalid street"})
            userNewAddress.shipping.street= shipping.street
        }
        if(shipping.city){

            if(!validator.isAlpha(shipping.city.split(" ").join(""))) return res.status(400).send({status:false,message:"Invalid city name"})
            userNewAddress.shipping.city= shipping.city
        }
        if(shipping.pincode){

            if (!/^[^0][0-9]{2}[0-9]{3}$/.test(shipping.pincode))  return res.status(400).send({status: false,message: "Pincode should be a valid pincode number."});
            userNewAddress.shipping.pincode= shipping.pincode
        }
        
    }

    // let validateTitle = /^[^0-9][a-z , A-Z0-9_ ? @ ! $ % & * : ]+$/;

    if(billing){
        if( (Object.keys(billing).length===0)) return res.status(400).send({status:false,message:"Billing address is required"})
        let {street,city,pincode,...rest} = billing
        if (Object.keys(rest).length > 0) return res.status(400).send({ status: false,message:"pls use valid fields[street,city,pincode] in billing"})
   

        if(billing.street){

            if(!/^[^0-9][a-z , A-Z0-9_ ? @ ! $ % & * : ]+$/.test(billing.street.split(" ").join(""))) return res.status(400).send({status:false,message:"Invalid street"})
            userNewAddress.billing.street= billing.street
        }
        if(billing.city){

            if(!validator.isAlpha(billing.city.split(" ").join(""))) return res.status(400).send({status:false,message:"Invalid city name"})
            userNewAddress.billing.city= billing.city
        }
        if(billing.pincode){

            if (!/^[^0][0-9]{2}[0-9]{3}$/.test(billing.pincode))  return res.status(400).send({status: false,message: "Pincode should be a valid pincode number."});
            userNewAddress.billing.pincode= billing.pincode
        }
        
    }



    
  }



let imageUrl = req.files
if(imageUrl.length>0){
   
    
    let urlType = imageUrl[0].originalname;
    if(!/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(urlType)) return res.status(400).send({status:false,message:"Plz provide valid image file"})
    var uploadedFileURL;
    if (imageUrl.length > 0) {
      uploadedFileURL = await uploadFile(imageUrl[0]);
    } 
    
    if(!uploadedFileURL) return res.status(400).send({ msg: "No file found" });
}

// if(imageUrl.length===0) return res.status(400).send({status:false,message:"profile Imaje is mandatory"})
    
   

//--------------------------------Duplicate email, phone --------------------------------------------

   
 
 
    let userUpdateData = {fname,lname,email,phone,password:bcryptPass,address:userNewAddress,profileImage:uploadedFileURL}
    
   
    let updateUser = await userModel.findOneAndUpdate({_id:userId},userUpdateData,{new:true})
  

    res.status(200).send({status:true, message:"User profile updated",data:updateUser})

    } catch (error) {
        console.log("error in updateUser",error.message)
        res.status(500).send({status:false,message:error.message})
    }
}



module.exports = {createUser,loginUser,getUser,updateUser}