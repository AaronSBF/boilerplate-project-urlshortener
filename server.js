require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const dns = require("dns");
const { response } = require('express');

mongoose.connect(process.env.MONG_URI, {userNewUrlParser: true, userUnifiedTopology:true});

const Schema = mongoose.Schema;

const urlSchema = new Schema({ 

original_url: String,
short_url: Number 

});

let url_dns = mongoose.model("url_dns", urlSchema);


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let resObj ={}
app.post("api/shorturl", app.use(bodyParser.urlencoded({extended: false}) , (req, res)=>{ 

let inputUrl =req.body["url"]

let urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)
if(!inputUrl.match(urlRegex)){
  response.json({error: 'Invalid URL'})
  return
}

resObj['orignal_url'] = inputUrl

let intputShort = 1;

url_dns.findOne({})
  .sort({short: 'desc'})
  .exec((error, result)=> { 

    if(!error && result != undefined){ 
      inputUrl =result.short +1
    }

    if(!error){ 
      url_dns.findOneAndUpdate({original: inputUrl},
        {original: inputUrl, short: inputUrl},
        {new: true, upsert: true},
        (error, saveUrl)=>{ 

          if(!error){
           resObj["short_url"] = saveUrl.short
           res.json(resObj) 
          }

        })
    }




  })


  
}) )

app.get('/api/shorturl/:input', function(request, response){ 
  let input = request.params.input

  url_dns.findOne({short: input}, (error, result)=>{ 
    if(!error&&result != undefined){ 
      response.redirect(result.original)
    }else{ 
      response.json('URL not found')
    }
  })


})




app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
