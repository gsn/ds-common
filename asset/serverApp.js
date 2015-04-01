var express = require('express'),
    path = require('path'),
    request = require('request'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    fs = require('fs'),
    url = require('url');
    
var config = require('./config.json');
var indexFile = path.resolve(__dirname + '/Index.cshtml');
var servicePath = path.resolve("..");
var apps = {};
var appPath = __dirname.replace(servicePath, '').replace(/\\+/gi, '/');

function startServer(chainId) {
  var app = express();
  apps[chainId] = app;
  
  // Configuration
  app.set('views', servicePath + path.sep);
  app.engine('html', require('ejs').renderFile);
  app.use('/proxy', function (req, res) {
    var newUrl = config.GsnApiUrl + req.url.replace('/proxy', '');
    req.pipe(request({ uri: newUrl, method: req.method })).pipe(res);
  });

  app.use(methodOverride());
  app.use('/asset', express.static(servicePath + path.sep + 'asset'));
  app.get('/unsupported-browser.html', function (request, response) {
    response.render('unsupported-browser.html');
  });

  app.get('*', function (request, response) {
    var myPath = url.parse(request.url).pathname.toLowerCase();
    if (myPath.indexOf('.') > 0 && myPath.indexOf('.aspx') < 0) {
      if (!fs.existsSync(path)) {
        response.status(404).send(myPath + ' not found.');
        return;
      }
    }
    fs.readFile(indexFile, 'utf8', function (err, str) {
      str = str.replace('@Gsn.Digital.Web.MvcApplication.ProxyMasterUrl', config.GsnApiUrl)
      str = str.replace('@Gsn.Digital.Web.MvcApplication.AppVersion.Replace("_", ".")', '1.4.10');
      str = str.replace('@Gsn.Digital.Web.MvcApplication.AppVersion', new Date().getTime());
      str = str.replace('@this.ViewBag.Title', chainId);
      str = str.replace(/\@this.ViewBag.CdnUrl/gi, config.CdnUrl);
      str = str.replace(/\@this.ViewBag.ChainId/gi, chainId);
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.write(str);
      response.end();
    });  
    
  });

  
  // Start server
  var port = 3000 + parseInt(chainId);
  app.listen(port, function() {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });
}

// skip first two arguments
if (process.argv.length <= 2) {
  console.log('\n\nError: chain id(s) are required.\n');
  console.log('Example: \n node ' + path.basename(__filename) + ' chainId1 chainId2 chainId3 ...');
  console.log('\n');
}
else {
  process.argv.forEach(function (val, index, array) {
    // skip first two arguments
    if (index > 1)
    {  
      startServer(val);
    }
  });
}
