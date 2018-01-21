var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/intros', function (req, res, next) {
  console.log("hello world");
  next();
});

module.exports = router;
