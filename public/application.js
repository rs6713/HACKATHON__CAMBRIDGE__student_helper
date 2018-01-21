var faceAbsent=0;
var faceThreshold=3;
var faceTime=10000;

var mainApplicationModuleName= 'cambridgehack';
var mainApp= angular.module(mainApplicationModuleName, ['ui.bootstrap', 'ngMaterial', 'ngMessages', 'chart.js']);

//a parametized get event
//Factory function to get latitude, longitude using address
mainApp.factory('getPapers', ['$http',  function($http){
    var papers={};
    papers.getPapers=function(urlTopic){
       return $http.get(topic);  
    }
    return papers;
}]);

//get topisc
mainApp.factory('getTopics', ['$http',  function($http){
    var papers={};
    papers.getTopics=function(url){
       return $http.get('/search',{data:url});  
    }
    return papers;
}]);

//Factory function post to tell server to store paper results
mainApp.factory('storePapers', ['$http',  function($http){
    var papers={};
    papers.storeData=function(topic){
        return $http.post('/storePapers',{data:topic});         
    }
    return papers;
}]);

var makeblob = function (dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = decodeURIComponent(parts[1]);
        return new Blob([raw], { type: contentType });
    }
    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}

//Factory function post to tell server to store paper results
mainApp.factory('payingAttention', ['$http',  function($http){
    var papers={};
    papers.getState=function(img){
        console.log(img);
        
        var req = {
            method: 'POST',
            url: 'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/a95df3c0-6435-4aec-8435-394030f768db/image?iterationId=ac40aacc-9ec6-48f7-b717-faa4f8dfc8b8',
            headers:{
                "Prediction-Key": "e52d2e49eada4002b1f46a8ab890b564",
                "Content-Type": "application/octet-stream"
            },
            data: makeblob(img),
            processData: false
        };
        return $http(req);        
    }
    return papers;
}]);



mainApp.factory('getIntros', ['$http', function($http){
    var paper={};
    paper.get=function(){
        return $http.get('/introsGet');
    };
    return paper;
}]);
mainApp.factory('getConcs', ['$http', function($http){
    var paper={};
    paper.get=function(){
        return $http.get('/concsGet');
    };
    return paper;
    
}]);



mainApp.controller('mainController',['$scope', '$timeout', 'storePapers', 'getIntros', 'getConcs' , 'getTopics','payingAttention','$mdToast',function($scope, $timeout, storePapers, getIntros, getConcs,getTopics, payingAttention, $mdToast){
    var self=this;
    $scope.paperTopic="";
    $scope.wordTotal=0;
    $scope.wordCount=0;
    $scope.hours=0;
    
    $scope.timeLeftHr=0;
    $scope.timeLeftMin=0;
    $scope.timeLeftSec=0;

    $scope.results=[];
    $scope.subtopic="";
    $scope.extreme=false;

    $scope.wordLabels = ["Chars Down", "Chars To Go"];
    $scope.wordTracking=[];

    $scope.getSubtop=function(){
        getTopics.getTopics($scope.subtopic).success(function(data){
            $scope.results=data;
        }).error(function(data, status){
            console.log(data, status);
            $scope.results=[];
        });
    }
    $scope.getInt=function(){
        console.log("getting introductions");
        getIntros.get().success(function(data){
            console.log("successfully got intros", data);
            $scope.results=data;
        }).error(function(data,status){
            console.log(data, status);
            $scope.results=[];
        });
    }
    $scope.getConc=function(){
        console.log("getting conclusions");
        getConcs.get().success(function(data){
            console.log("successfully got conclusions",data );
            $scope.results=data;
        }).error(function(data,status){
            console.log(data, status);
            $scope.results=[];
        });
    }

    

    

    var faceCheck= function(){
        context.drawImage(video,0,0, 160, 120);
        var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        //console.log("image is: ", image);
        payingAttention.getState(image).success(function(data){
            //turn off loading circle, change page

            console.log("Face successfully evaluated", data.Predictions);
            if( (data.Predictions[0].Tag=="on" && data.Predictions[0].Probability< data.Predictions[1].Probability) ||
                (data.Predictions[1].Tag=="on" && data.Predictions[1].Probability< data.Predictions[0].Probability) ){
                    faceAbsent+=1;
            }else{
                faceAbsent=0;
            }
            //Away for 30secs
            if(faceAbsent>= faceThreshold){
                alert("GET BACK TO WORK");
            }

        }).error(function(error, status){
            //go back to start with error message
            console.log(error);
            console.log("unsuccesfful face analysis");
        });       
    };


    var updateWordCount=function(){
        $scope.wordTracking[0]=quill.getLength()-1;
        $scope.wordTracking[1]=$scope.wordTotal-$scope.wordTracking[0];
        
    }
    var updateTimeLeft= function(){
        var left=$scope.deadline-new Date().getTime();
        $scope.timeLeftHr = Math.floor((left % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        $scope.timeLeftMin = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
        $scope.timeLeftSec = Math.floor((left % (1000 * 60)) / 1000);
        $scope.$apply() ;   
    };
    $scope.loadMainPage=function(){
        console.log("storing papers");
        quill.insertText(0, $scope.paperTopic, 'bold', true);
        $scope.deadline=new Date().getTime()+ $scope.hours*60*60*1000;
        window.setInterval(updateTimeLeft, 1000);
        window.setInterval(updateWordCount, 1000);

        storePapers.storeData($scope.paperTopic).success(function(data){
            //turn off loading circle, change page
            console.log("Papers successfully accessed");
        }).error(function(error, status){
            //go back to start with error message
            console.log(error);
            console.log("unsuccesfful");
        });

    };
    var faceChecker;
    $scope.$watch('[extreme]', function(newValues, oldValues, $scope) {
        var ex=newValues[0];
        if(ex){
            faceChecker= window.setInterval( faceCheck, faceTime);
        }else{
            clearInterval(faceChecker);
        }
    });
}]);