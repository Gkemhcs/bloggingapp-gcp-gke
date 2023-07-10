const express=require("express")
const app=express()
const mysql=require("mysql")
const fs=require("fs")
const {KeyManagementServiceClient}=require("@google-cloud/kms")
const client=new KeyManagementServiceClient()


const connection=mysql.createConnection({port:3306,user:process.env.user,password:process.env.password,database:process.env.database})



app.use(require("body-parser").urlencoded({extended:true}))
app.set("view engine","ejs")
app.get("/",async(req,res)=>{
     
    res.render("home")

})
app.get("/create",(req,res)=>{
res.render("createblog")
})

app.post("/save",async (req,res)=>{
    const {author,title,category,content}=req.body 
    query="INSERT INTO blog_info(author,title,category,timestamp,fileid,dateString) VALUES (?,?,?,?,?,?)"
    const date=new Date()
    const months=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
    const dateString=`${date.getDate()} ${months[date.getMonth()]},${date.getFullYear()}`
    const fileid=author+"-"+date.getTime()
    const filename=`${fileid}.txt`
    connection.query(query,[author,title,category,date,fileid,dateString],async(err)=>{
        if(err) throw err 
        else{
            const KMS_KEY=client.cryptoKeyPath(process.env.project,process.env.location,process.env.keyRing,process.env.cryptoKey)
         const result= await client.encrypt({name:KMS_KEY,plaintext:Buffer.from(content),additionalAuthenticatedData:Buffer.from(author)})     
        fs.writeFile(`/data/${filename}`,result[0].ciphertext,(err)=>{
            if(err){
                console.log(err)
                res.send("error while writing to file")
            }
            else{
                res.render("success")
            }
        })
        }
    })

   
})
app.get("/category/:id",(req,res)=>{
    res.send(req.params.id)
})
app.listen(8080,()=>{
    console.log("server started")
})