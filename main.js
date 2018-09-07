var express = require('express')
var app = express()
// var request = require('request')

// var cheerio = require("cheerio")

var api = require("./routers/api")

app.use(express.static("static"))

app.get("/getXML", (req, res) =>{
  api["/getXML"](req,res)
})
app.get("/getMeiZiTu", (req, res) =>{
  api["/getMeiZiTu"](req,res)
})
app.get("/login/article", (req, res) =>{
  api["/login/article"](req,res)
})
app.get("/login/news", (req, res) =>{
  api["/login/news"](req,res)
})
app.get("/login/weather", (req, res) =>{
  api["/login/weather"](req,res)
})
app.get("/login/articledetail", (req, res) =>{
  api["/login/articledetail"](req,res)
})

let sort = 8888
app.listen(sort, (err) => {
  console.log("本地服务"+sort+"服务已启动")
})
