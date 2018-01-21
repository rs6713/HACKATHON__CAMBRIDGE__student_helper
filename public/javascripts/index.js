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




