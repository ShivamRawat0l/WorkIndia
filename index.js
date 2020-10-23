var mysql = require('mysql')
var express = require('express')
var result= require('dotenv').config()
var app= express()
var bodyParser = require('body-parser')
const bcrypt = require('bcrypt');
const crypto = require('crypto');

//MIDDLE WARE
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())



var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'workindia'
});

connection.connect(function(err){
	console.log('connected as id ' + connection.threadId);
})


function encrypt(text,key){
  var cipher = crypto.createCipher('aes-256-cbc',key)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text,key){
  var decipher = crypto.createDecipher('aes-256-cbc',key)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}


app.get('/',function(req,res){
	res.sendfile('./index.html');
})


app.post('/app/user',(req,res)=>{
	console.log(req.body)
	
	bcrypt.hash(req.body.password,10,function(err,hash){
		connection.query("insert into user (username,password) values (?)",[[req.body.username,hash]], function (err, rows, fields) {
  				if (err) {
  					throw err;
  					res.send("Error Occured");
  				}
				res.send("account created");
		})
	})	
})

app.post('/app/user/auth',(req,res)=>{
	console.log(req.body)
	connection.query("select password from user where username= ?",[req.body.username], function (err, rows, fields) {
  	if (err) {
  		throw err;
  		res.send("Error Occured");
  	}
  	console.log(rows)
  	if((rows.length)>0){
	bcrypt.compare(req.body.password, rows[0]['password'], function(err, result) {
    		if(result== true){
    			connection.query("select userId from user where username= ?",[req.body.username], function (err, rows, fields) {
  					res.json({'status':"success","userId":rows[0]['userId']})
  				})
    		}
    		else{
    			res.json({'status':'Wrong password'});
    		}
	});
	}
	else{
		res.json({'status':'No user found'});
	}
  	

})
	
})

app.get('/app/sites/list',(req,res)=>{
	connection.query("select username from user where userId= ?",[req.query.user],function(err,rows1,fields){
		connection.query("select note from notes where userId=?",[req.query.user],function(err,rows,fields){
				var notes = rows.map(data=>{
					return decrypt(data['note'],rows1[0]['username']);
				})
				res.json(notes);
		})
	})
})
app.post('/app/sites',(req,res)=>{
	connection.query("select username from user where userId= ?",[req.query.user],function(err,rows,fields){
		if(err)
			throw err;
		console.log(rows)
		var cryptedText= encrypt(req.body.note,rows[0]['username'])
		console.log(cryptedText)
			connection.query("insert into notes values (?)",[[req.query.user,cryptedText]],function(err,rows1,fields){
				if(err) 
					throw err;

				res.json({'status':'success'});
			})
		})
		
})

app.listen(3000);
