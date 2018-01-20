var quill;

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

    
});

