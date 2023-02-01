
const express = require("express")
const { createUser, loginUser } = require("../controller/userController")
const route = express.Router()
// const { registerUser,loginUser } = require("../Controller/userController")
// const { createBook,getBooks,getBookById,updateBookById,deleteBookById } = require("../Controller/bookController.js")
// const { verifyToken,verifyTokenAndAuthorization} = require("../Middleware/middleware")
// const { createReview,reviewUpdate,reviewDelete } = require("../Controller/reviewController")




route.post("/register", createUser)
route.post("/login", loginUser)









route.all("/*",(req,res)=>{
    console.log("Plz enter valid route");
    res.status(400).send({msg:"invalid route"})
})



module.exports = route
