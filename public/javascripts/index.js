var quill;
var video;
var canvas;
var context;
var errorCallback = function(e) {
    console.log('Reeeejected', e);
  };
// Converts canvas to an image
function convertCanvasToImage(canvas) {
	var image = new Image();
    image.src = canvas.toDataURL("image/png");
    
	return image;
}
    // Not showing vendor prefixes.
    navigator.getUserMedia({video: true, audio: true}, function(localMediaStream) {
        var video = document.querySelector('video');
        video.src = window.URL.createObjectURL(localMediaStream);
    
        // Note: onloadedmetadata doesn't fire in Chrome when using it with getUserMedia.
        // See crbug.com/110938.
        video.onloadedmetadata = function(e) {
        // Ready to go. Do some stuff.
        };
    }, errorCallback);
    

$(document).ready(function(){
    $("#mainbody #info #progress canvas#doughnut.chart.chart-doughnut.ng-isolate-scope").css({ "width": "100px", "height": "100px"});

    $("#entry button").click(function(){
        $("#main").css({"display": "block"});
        $("#entry").css({"display": "none"});
    });

    quill= new Quill('#editor', {
        theme: 'snow'
    });

    $("#sections").click(function(){
        $("#options").css({"display":"none"});
        
        $("#sectionPick").css({"display":"block"});
        $("#data i").css({"display":"block"});
        
    });

    $("#data i").click(function(){
       
            $("#options").css({"display":"block"});
            $("#sectionPick").css({"display":"none"});
            $("#data i").css({"display":"none"}); 
            $("#results").css({"display":"none"});            

    });
    $("#subtopicbutton").click(function(){
        $("#data i").css({"display":"block"});
    });

    $('#dataimg div:last-child').click(function(){
        $('#dataimg div:last-child').css({"border-bottom":"2px solid white"});
        $('#dataimg div:first-child').css({"border-bottom":"2px solid #222222"});
        $('#images').css({"display":"block"});
        $('#data').css({"display":"none"});

    });
    $('#dataimg div:first-child').click(function(){
        $('#dataimg div:first-child').css({"border-bottom":"2px solid white"});
        $('#dataimg div:last-child').css({"border-bottom":"2px solid #222222"});
        $('#images').css({"display":"none"});
        $('#data').css({"display":"block"});
    });

    $("#subtopicbutton").click(function(){
        $("#options").css({"display":"none"});
        $("#results").css({"display":"block"});        
    });
    $("#sectionPick div").click(function(){
        $("#sectionPick").css({"display":"none"});
        $("#results").css({"display":"block"});        
    });

    video = document.querySelector('video');
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    
});




