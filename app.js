var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var rp = require('request-promise');
var fs=require('fs');
var PDFParser=require("pdf2json");
var https = require('https');
var path = require('path'); 
//var index = require('./routes/index');


var app = express();
// view engine setup
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  res.render('layout', { title: 'Express' });
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



var papers=[];

var commandSearch={
  method:'GET',
  uri: 'https://westus.api.cognitive.microsoft.com/academic/v1.0/interpret',
  headers:{
    "Ocp-Apim-Subscription-Key" : "46abdd83f0924294ad2620655fe3bbb7"
  },
  qs:{
    query:"", count: 10, complete:0
  }
};
var paperNamesSearch={
  method:'GET',
  uri: 'https://westus.api.cognitive.microsoft.com/academic/v1.0/evaluate',
  headers:{
    "Ocp-Apim-Subscription-Key" : "46abdd83f0924294ad2620655fe3bbb7"
  },
  qs:{
    expr:"", 
    count: 3, 
    attributes:"Ti,Y,AA.AuN"//E
  }
};
var bingPaperSearch={
  method:'GET',
  uri: 'https://api.cognitive.microsoft.com/bing/v7.0/search',
  headers:{
    "Ocp-Apim-Subscription-Key" : "8d08226f7d9f4a23ac329be6c1085897"
  },
  qs:{
    q:"", 
    count: 10
  }
};

var faceApi={
  method:'POST',
  uri:'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/a95df3c0-6435-4aec-8435-394030f768db/image?iterationId=ac40aacc-9ec6-48f7-b717-faa4f8dfc8b8',
  headers:{
    "Prediction-Key": "e52d2e49eada4002b1f46a8ab890b564",
    "Content-Type": "application/octet-stream"
  },
  body: {
    data: ''
  }
};




var getDocument=function(plain){
  var document=[];
  plain=plain.replace(  /\r/g, "");

  var arr=plain.split(/\n|----------------/);
  
  //var arr= plain.split("----------------");
  var pg=1;
  var chap="";
  var section="";
  for(var a=0; a<arr.length;a++){
    
    if(arr[a].length<20 && arr[a].indexOf("Page")!=-1){
      var st=arr[a].indexOf("(");
      var end=arr[a].indexOf(")");
      console.log("page no", arr[a].slice(st+1,end));
      pg=parseInt(arr[a].slice(st+1,end));
      continue;
    }

    if( arr[a].length>5 && (chap=="" ||arr[a-1][arr[a-1].length-3]=="."  ||  (arr[a].length>0 &&arr[a][0].toUpperCase()==arr[a][0])  ) && (arr[a].length<40 || (arr[a].length+ arr[a+1].length)<70  )   ){
      console.log("set chapter title", arr[a]);
      //need to save prev chapter
      if( document[pg]==undefined){
        document[pg]=[];
      }
      
        document[pg][chap]=section;
        section="";
      

      if(chap.indexOf("References")!=-1 || chap.indexOf("references")!=-1 || chap.indexOf("Bibliography")!=-1 ){
        break;
      }
      chap=arr[a];
      //two line title
      if(arr[a+1].length<70){
        chap=chap+" "+ arr[a];
      }
      continue;
    }

    console.log("add section", arr[a]);
    section=section+" "+arr[a];
    
  }
  console.log(document);
  return document;
}





app.get('/introsGet', function(req, res) {
  console.log("intros!!!!!!!!!");
  
  var results=[];
  for(var i=0; i< papers.length; i++){
    var done=0;
    var paper=papers[i].data;
    
    for(var pg=0; pg<paper.length; pg++){
      var page=paper[pg];
      for (var key in page) {
        console.log(page[key]);
        if(page[key].length>200){
          results.push({title: papers[i].title, date: papers[i].date, data: page[key]});
          done=1;
          break;
        }
      }
      if(done){break;}

    }
  }
  res.send(results);
});

app.get('/concsGet', function(req, res) {
  console.log("getting concs");
  var results=[];
  for(var i=0; i< papers.length; i++){
    var done=0;
    var paper=papers[i].data;
    for(var pg=0; pg<paper.length; pg++){
      var page=paper[pg];
      var arr= page.keys();
      arr.reverse();
      for (var key in page) {
        if(page[key].length>200){
          results.push({title: papers[i].title, date: papers[i].date, data: page[key]});
          break;
        }
      }
      if(done){break;}
    }
  }
  res.send(results);
});

app.get('/search', function(req, res){
  var item=req.body.data;
  var results=[];
  console.log("Searching");
  for(var i=0; i<papers.length; i++){
    var paper=papers[i].data;
    for(var pg=0; pg< paper.length; pg++){
      for(var title in paper[pg]){
        if(title.indexOf(item)!=0){
          var section=paper[pg][title];
          if(paper.length>pg+1 && paper[pg+1][title]!=undefined){
            section+=paper[pg+1][title];
          }
          results.push({title: papers[i].title, date: papers[i].date, data: section});
        }
      }
    }
  }
  res.send(results);

});

app.use('/payingAttention', function(req, res){
  console.log("attempting to send face data");
  var img=req.body.data;
  faceApi.body.data=img;
  rp(faceApi).then(function(data){
    console.log("Got faceapi response, data", data);
  }).catch(function (err) {
    // Crawling failed or Cheerio choked...
    console.log("failed to get face api response", err);
    res.send(err);
  });  

});


app.use('/storePapers', function(req, res) {
//get first pdf found, download, parse it and store
var downloadPaper=function(title, year){
  bingPaperSearch.qs.q=title+" "+year;
  rp(bingPaperSearch)
  .then(function (data) {
      // Process html like you would with jQuery...
      data=JSON.parse(data);
      var links=data.webPages.value;
      var chosenLink;
      for(var w=0; w< links.length;w++){
        //pdf
        if(links[w].url.indexOf(".pdf")!=-1){
          chosenLink=links[w].url;
          break;
        }
      }

      if(chosenLink){
        var getPDF={
          uri: chosenLink,
          method: "GET"
        }

        var file= fs.createWriteStream(title+".pdf");
        file.on("open", function(){
          var stream=rp(getPDF).pipe(file);
          stream.on("finish", function(){
            file.end();

            console.log("Parsing pdf document", chosenLink);
            //Now we download and parse using parser
            let pdfParser = new PDFParser(this,1);
            pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
            pdfParser.on("pdfParser_dataReady", pdfData => {
                //console.log(pdfData);
                
                //console.log(pdfParser.getRawTextContent());
                //console.log(pdfData.formImage.Pages[0]);
                //console.log(JSON.stringify(getDocument(pdfParser.getRawTextContent())));

                var content={"title": title, "date": year, "data": getDocument(pdfParser.getRawTextContent())};
                papers.push(content);
                console.log("finished saving paper");
                //console.log("Raw content fetched,", JSON.stringify(pdfData.formImage.Pages[0]));//, pdfParser.getRawTextContent()
                //console.log("Raw content fetched,", JSON.stringify(pdfData.formImage.));
                //, JSON.stringify(pdfData.formImage.Pages[0])
            });
            pdfParser.loadPDF(title+".pdf");  

          });
        });

      }
  })
  .catch(function (err) {
      // Crawling failed or Cheerio choked...
      console.log("failed to get bing search of papers", err);
      res.send(err);
  });  
}

var getListPapers=function(){
  rp(paperNamesSearch)
  .then(function (data) {
      // Process html like you would with jQuery...
      data=JSON.parse(data);
      var papers2=data.entities;
      //for evert entry find, download its pdf and convert it
      for(var i=0; i< papers2.length; i++){
        downloadPaper(papers2[i].Ti, papers2[i].Y);
      }
      res.send("YAAASSSS");
  })
  .catch(function (err) {
      // Crawling failed or Cheerio choked...
      console.log("failed to get list of papers");
      res.send(err);
  });

};  
  var paperTitle=req.body.data;
  commandSearch.qs.query=paperTitle;

  console.log("Trying to fetch papers relating to ", paperTitle);

    rp(commandSearch)
      .then(function (data) {
          // Process html like you would with jQuery...
          data=JSON.parse(data);
          paperNamesSearch.qs.expr=data.interpretations[0].rules[0].output.value;
          console.log("Searching using term ",paperNamesSearch.qs.expr )
          getListPapers();
      })
      .catch(function (err) {
          // Crawling failed or Cheerio choked...
          console.log("failed to get papers search term");
          res.send(err);
      });
});





//app.use('/', index);






// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.render('error');
});


var options = {
  key: fs.readFileSync(path.resolve('keycert/key.pem')),
  cert: fs.readFileSync(path.resolve('keycert/cert.pem'))
};
/**
 * Get port from environment and store in Express.
 */

var port = '3000';
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = https.createServer(options, app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
