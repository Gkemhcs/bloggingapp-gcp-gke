const express=require("express")
const app=express()
const mysql=require("mysql")
const fs=require("fs")
const {KeyManagementServiceClient}=require("@google-cloud/kms")
const client=new KeyManagementServiceClient()


const connection=mysql.createConnection({host:process.env.host,port:3306,user:process.env.user,password:process.env.password,database:process.env.database})

const KMS_KEY=client.cryptoKeyPath(process.env.project,process.env.location,process.env.keyRing,process.env.cryptoKey)

app.use(require("body-parser").urlencoded({extended:true}))
app.set("view engine","ejs")
app.get("/",async(req,res)=>{
    
connection.query("SELECT * FROM blogposts",async(err,output)=>{
        if(err){
            throw err }
     else{
      console.log(output)

      res.render("home",{output})
    
     }
        
    })
  
   

 
})
app.get("/create",(req,res)=>{
res.render("createblog")
})


app.post("/save",async (req,res)=>{
    const {author,title,category,content}=req.body 
    query="INSERT INTO blogposts(author,title,category,timestamp,fileid,dateString) VALUES (?,?,?,?,?,?)"
    const date=new Date()
    const months=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
    const dateString=`${date.getDate()} ${months[date.getMonth()]},${date.getFullYear()}`
    const fileid=author+"-"+date.getTime()
    const filename=`${fileid}.txt`
    connection.query(query,[author,title,category,date,fileid,dateString],async(err)=>{
        if(err) throw err 
        else{
           
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
async function decrypt(content,res){
   
    let decrypt=await client.decrypt({name:KMS_KEY,ciphertext:content,additionalAuthenticatedData:Buffer.from(obj.author)})
    let cont=decrypt[0].plaintext 
    res.render("post",{obj:obj,content:cont})
    
}
app.get("/post/:fileid",(req,res)=>{
    fileid=req.params.fileid 
    filename="/data/"+fileid+".txt"
    console.log(filename)
    connection.query("SELECT * FROM blogposts WHERE fileid= ? ",[fileid],(err,data)=>{
        if(err) throw err 
        else{ 
            obj=data[0]
            fs.readFile(filename,(err,content)=>{
                if(err) throw err 
                else{
               decrypt(content,res)
                 
                }
            })
        }
    }) 
})
app.get("/category/:type",(req,res)=>{
    category=req.params.type 
    connection.query("SELECT * FROM blogposts WHERE category=?",[category],(err,data)=>{
    res.render("home",{output:data})    
 
    })
})
app.get("/category/:id",(req,res)=>{
    res.send(req.params.id)
})
app.listen(8080,()=>{
    console.log("server started")
})