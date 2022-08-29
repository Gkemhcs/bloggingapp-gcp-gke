const express=require("express")
const bodyParser=require("body-parser")
const ejs=require("ejs")
const app=express();
app.set("view engine","ejs")
app.listen(3000,()=>{
    console.log("server running on port 3000")
})