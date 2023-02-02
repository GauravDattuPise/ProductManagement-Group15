
const express = require("express")
const { createProduct,getProduct } = require("../controller/productController")
const { createUser, loginUser,getUser,updateUser } = require("../controller/userController")

const route = express.Router()
// const { registerUser,loginUser } = require("../Controller/userController")
// const { createBook,getBooks,getBookById,updateBookById,deleteBookById } = require("../Controller/bookController.js")
const { verifyToken,verifyTokenAndAuthorization} = require("../Middleware/auth.js")
// const { createReview,reviewUpdate,reviewDelete } = require("../Controller/reviewController")




route.post("/register", createUser)
route.post("/login", loginUser)
route.get("/user/:userId/profile", verifyToken, getUser)
route.put("/user/:userId/profile", verifyTokenAndAuthorization, updateUser)
route.post("/products",createProduct)
route.get("/products",getProduct)
// route.get("/products/:productId",getProductById)








route.all("/*",(req,res)=>{
    console.log("Plz enter valid route");
    res.status(400).send({msg:"invalid route"})
})



module.exports = route
