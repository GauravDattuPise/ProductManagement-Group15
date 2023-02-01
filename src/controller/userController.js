const  validator = require("validator");
const  JWT  = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const { uploadFile } = require("./aws");

let validateMobile = /^[6-9][0-9]{9}$/;

const createUser = async(req,res)=>{
    try {
    let data = req.body
    if (Object.keys(data).length === 0) return res.status(400).send({ message: "plz provide user's data" });

    let imageUrl = req.files
    if(!imageUrl) return res.status(400).send({status:false,message:"profileImaje is mandatory"})
    
    let urlType = imageUrl[0].originalname;
    if(!/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(urlType)) return res.status(400).send({status:false,message:"Plz provide valid image file"})
    
    let uploadedFileURL;
    if (imageUrl && imageUrl.length > 0) {
      uploadedFileURL = await uploadFile(imageUrl[0]);
    } else {
      return res.status(400).send({ msg: "No file found" });
    }


    let {fname,lname,email,phone,password,address} = data
    let newAddress = JSON.parse(address)
    let {shipping,billing} = newAddress



///------------------------- Validation------------------------------------------



if (!fname) return res.status(400).send({ status: false, message: "name is mendatory" });
if (!validator.isAlpha(fname.split(" ").join(""))) return res.status(400).send({ status: false, message: "plz enter valid name" });


if (!phone) return res.status(400).send({ status: false, message: "phone is mendatory" });
if (!validateMobile.test(phone)) return res.status(400).send({ status: false, message: "plz enter valid mobile number" });


if (!email)return res.status(400).send({ status: false, message: "email is mendatory" });
if (!validator.isEmail(email.trim()))return res.status(400).send({ status: false, message: "plz enter valid email" });


if (!password) return res.status(400).send({ status: false, message: "password is mendatory" });
if (password.length > 15 || password.length < 8)return res.status(400).send({
    status: false,
    mesage: "password must be greater than 8 char and less than 15 char",
  });

if (!validator.isStrongPassword(password)) return res.status(400).send({
    status: false,
    message:
      "plz enter valid password, must contain 1 Uppercase,1 Lowercase,1 special-character",
  });



if(!address || (Object.keys(address).length===0)) return res.status(400).send({status:false,message:"Address is required"})

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



//--------------------------------Duplicate email, phone --------------------------------------------



    let checkEmailExist = await userModel.findOne({email})
    if(checkEmailExist) return res.status(409).send({status:false,message:"This email already exist"})


    let checkPhoneExist = await userModel.findOne({phone})
    if(checkPhoneExist) return res.status(409).send({status:false,message:"This phone no. already exist"})


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
        
    if (!email)return res.status(400).send({ status: false, message: "email is mendatory" });
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
     let token = JWT.sign({ userId: userId }, "group2project-5", {expiresIn: 1440});
  

     res.status(200).send({status:true,message:"User login successfull", data:{userId:userId, token:token}})

   } catch (error) {

    res.status(500).send({status:false,message:error.mesage})

    console.log("error in loginUser", error.message)

   }
}








module.exports = {createUser,loginUser}