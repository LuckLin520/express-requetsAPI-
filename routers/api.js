var request = require('request')
var cheerio = require("cheerio")
var fs = require("fs")
var path = require('path')
// var CircularJSON = require('circular-json')


function dateFtt(date,fmt) { //author: meizz   yyyy.MM.dd hh:mm
	var date=new Date(date);
	var o = {   
	    "M+" : date.getMonth()+1,                 //月份   
	    "d+" : date.getDate(),                    //日   
	    "h+" : date.getHours(),                   //小时   
	    "m+" : date.getMinutes(),                 //分   
	    "s+" : date.getSeconds(),                 //秒   
	    "q+" : Math.floor((date.getMonth()+3)/3), //季度   
	    "S"  : date.getMilliseconds()             //毫秒   
	  };   
	  if(/(y+)/.test(fmt))   
	    fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));   
	  for(var k in o)   
	    if(new RegExp("("+ k +")").test(fmt))   
	  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));   
	  return fmt;   
}


module.exports = {
	//获取rss的xml
	"/getXML": (req, res) => {
		request('https://blog.csdn.net/qwe502763576/rss/list', (err, response, body) => {
	    fs.writeFile("static/static_files/rss/rss.xml", body, {}, (err) => {
	    	console.log(err)
	    })
	    res.send(body)
	  })
	},
	//爬去页面图片写入数据库文件
	"/getMeiZiTu": (req, res) => {
		var page = req.query.page
	  	console.log(req.query.page)
	  	request('http://www.mzitu.com/tag/youhuo/page/'+page+'/', (err, response, body) => {
	  		 var $ = cheerio.load(body)
	  		 var imgdom = $("#pins li img")
	  		 var imgs = []
	  		 //将每个图片信息包装成对象放进数组
	  		 var P = new Promise((resolve,reject) => {
	  		 	imgdom.each((i,v) => {
		  		 	request('http://www.mzitu.com/' + $(v).parent().attr("href").slice(-6), (err2, response2, body2) => {
		  		 		$ = cheerio.load(body2)
		  		 		var ele = $(".main-image a img");
			  		 	var img = {
			  		 		src: ele.attr('src'),
			  		 		alt: ele.attr("alt"),
			  		 		// width: ele.css("width"),
			  		 		// height: ele.css("height"),
			  		 		time: $(v).parents("li").find(".time").text(),
			  		 		// view:  $(v).parents("li").find(".view").text()
			  		 	}
			  		 	imgs.push(img)
			  		 	if(imgdom.length - 1 === i){
			  		 		resolve()
			  		 	}
			  		 })
		  		 })
	  		 })

	  		 P.then(() => {
	  		 	readSQL()
	  		 })
	  		 //读取数据库导出的json文件
	  		 function readSQL() {
	  		 	fs.readFile(path.resolve(__dirname, '..') + '/static/static_files/mysqldata/wp_posts.xml', {encoding: 'utf8'}, function (err, data) {
				    if(err) {
				     console.error(err);
				     return;
				    }
				    var temp = data.slice(0, -34)
				    var last = '\n</database>\n</pma_xml_export>'
				    imgs.forEach(v => {
				    	temp += writeSQL(v)
				    })
				    var xml = temp + last
				    fs.writeFile("./static/static_files/output/wp_posts.xml", xml, {}, (err) => {
				    	console.log(err)
				    })
			    	res.send({code:0, data: xml})
				});
	  		 }
			//将获取到的图片数据包装成数据库的格式并push到json文件中
	  		 var id = 1
	  		 function writeSQL(img) {
	  		 	ID = id
	  		 	id++
		  		 return `\n\t\t<table name="wp_posts">
				            <column name="ID">${ID}</column>
				            <column name="post_author">1</column>
				            <column name="post_date">${dateFtt(new Date(), 'yyyy.MM.dd hh:mm')}</column>
				            <column name="post_date_gmt">${img.time}</column>
				            <column name="post_content">&lt;img class=&quot;alignnone size-medium&quot; src=&quot;${img.src}&quot; /&gt;</column>
				            <column name="post_title">${img.alt}</column>
				            <column name="post_excerpt"></column>
				            <column name="post_status">publish</column>
				            <column name="comment_status">open</column>
				            <column name="ping_status">open</column>
				            <column name="post_password"></column>
				            <column name="post_name">${encodeURIComponent(img.alt)}</column>
				            <column name="to_ping"></column>
				            <column name="pinged"></column>
				            <column name="post_modified">0000-00-00 00:00:00</column>
				            <column name="post_modified_gmt">0000-00-00 00:00:00</column>
				            <column name="post_content_filtered"></column>
				            <column name="post_parent">0</column>
				            <column name="guid">${'http://www.lucklin.top/?p='+ID}</column>
				            <column name="menu_order">0</column>
				            <column name="post_type">post</column>
				            <column name="post_mime_type"></column>
				            <column name="comment_count">0</column>
				        </table>`
	  		}
	  	})
	},
	//获取文章列表
	"/login/article": (req, res) =>{
	  var page = req.query.page
	  console.log(req.query.page)
	  request('https://blog.csdn.net/qwe502763576/article/list/'+page, (err, response, body) => {
	    // console.log(err);
	    // console.log(response && response.statusCode);
	    // console.log(body);
	    // fs.writeFile("static/static_files/html/list"+page+".xml", body, {}, (err) => {
	    // 	console.log(err)
	    // })
	    request('http://www.meizitu.com/a/cute.html', (err2, response2, body2) => {
	      var $ = cheerio.load(body)
	      var data = [];
	      var titdom = $(".article-list h4 a")
	      var desdom = $("p.content")
	      var timedom = $(".info-box span.date")
	      var readdom = $(".info-box .read-num")
	      var commentdom = $(".info-box .read-num")
	      $ = cheerio.load(body2)
	      var imgdom = $(".wp-list li img")
	      titdom.each((i, v) => {
	        data[i] = {
	          tit: $(v).text(),
	          url: $(v).attr("href"),
	          des: desdom.eq(i).text(),
	          time: timedom.eq(i).text(),
	          read: i > 0 ? readdom.eq(i*2).text() : readdom.eq(i).text(),
	          commentdom: i > 0 ? readdom.eq(i*2+1).text() : readdom.eq(i+1).text(),
	          img: imgdom.eq(i).attr("src")
	        }
	      })
	      res.json({code: 0, data})
	    })
	  }) 
	},
	//获取文章内容
	"/login/articledetail": (req, res) => {
		var url = req.query.url
	  	console.log(req.query.url)
		request(url, (err, response, body) => {
			var $ = cheerio.load(body)
			var css = ""
			$("link[rel='stylesheet']").each((i, v) => {
				css += `<link rel="stylesheet" href=${$("link")[i].attribs.href}/>`
			})
			res.json({code:0, data: $(".blog-content-box").html(), css})
		})
	},
	//获取新闻头条
	"/login/news": (req, res) => {
		request("https://www.toutiao.com/api/pc/focus/", (err, response, body) => {
		    res.send({code: 0, data: JSON.parse(body).data.pc_feed_focus, baseUrl: "https://www.toutiao.com/api/pc/focus/"})
		})
	},
	//获取天气
	"/login/weather": (req, res) => {
		var city = req.query.city
	  	console.log(req.query.city)
		request("https://www.toutiao.com/stream/widget/local_weather/data/?city="+city, (err, response, body) => {
			res.send({code: 0, data: JSON.parse(body).data.weather})
		})
	}
}
