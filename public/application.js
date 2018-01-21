var faceAbsent=0;
var faceThreshold=1;
var faceTime=3000;
var emotTime=4000;
var dangerThreshold=1;
var dangerTime=3000;

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

       return  $http({
            url: '/search', 
            method: "GET",
            params: {data: url}
        }); 
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


mainApp.factory('getImages', ['$http',  function($http){
    var papers={};
    papers.getImgList=function(urlTopic){
        console.log("image search param",urlTopic);
        return  $http({
            url: '/getImages', 
            method: "GET",
            params: {data: urlTopic}
         }); 
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
        //console.log(img);
        
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



mainApp.factory('getEmots', ['$http', function($http){
    var papers={};
    papers.getState=function(img){
        //console.log(img);
        
        var req = {
            method: 'POST',
            url: 'https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize',
             headers:{
                "Ocp-Apim-Subscription-Key": "56b17fa6212e4099ba3e1411c16023e8",
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



mainApp.controller('mainController',['$scope', '$timeout', 'storePapers', 'getIntros', 'getConcs' , 'getTopics','payingAttention', 'getImages','getEmots' ,'$mdToast' , "$mdDialog",function($scope, $timeout, storePapers, getIntros, getConcs,getTopics, payingAttention, getImages, getEmots, $mdToast, $mdDialog){
    var self=this;
    $scope.paperTopic="";
    $scope.wordTotal=0;
    $scope.wordCount=0;
    $scope.hours=0;
    $scope.projectFinish=[0,0,0];
    
    $scope.timeLeftHr=0;
    $scope.timeLeftMin=0;
    $scope.timeLeftSec=0;

    $scope.results=[];
    $scope.subtopic="";
    $scope.extreme=false;
    $scope.images=[];

    $scope.wordLabels = ["Chars Down", "Chars To Go"];
    $scope.wordColors= [ "#3E66B2", "#B3D2FF"]
    $scope.wordTracking=[];

    $scope.emotions=[[],[],[],[],[],[],[],[],[]];
    $scope.emotX=[];
    $scope.emotAvail=["anger","contempt","disgust","fear", "happiness", "neutral","sadness","surprise", "wordCount"];

    $scope.analyzeOptions = {legend: {display: true}};

    $scope.trackStatus=true;
    var trackStatusFunct=function(){

        
        
        var d=new Date().getTime();

        var hrs=$scope.hours*60*60*1000;

        $scope.projectFinish[0]= Math.floor(((d-($scope.deadline-hrs)) * ($scope.wordTotal/$scope.wordTracking[0])% (1000 * 60 * 60 * 24))/(60*60*1000));
        $scope.projectFinish[1]= Math.floor(((d-($scope.deadline-hrs)) * ($scope.wordTotal/$scope.wordTracking[0])% (1000 * 60 * 60 ))/(60*1000));
        $scope.projectFinish[2]= Math.floor(((d-($scope.deadline-hrs)) * ($scope.wordTotal/$scope.wordTracking[0])% (1000 * 60 ))/(1000));

        return (($scope.wordTracking[0]/$scope.wordTotal) >= ((hrs-($scope.deadline-d)) / hrs) );
        
    }
    


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

    
    var emotionCheck=function(){
        context.drawImage(video,0,0, 160, 120);
        var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        //var image = canvas.toDataURL("image/png");

        getEmots.getState(image).success(function(data){
            console.log("Emotion successfully recieved", data);
            if(data.length>0){
                var emotions=data[0].scores;
                var top=0;
                var temp="";
                for(var key in emotions){
                    if(emotions[key]>top){
                        top=emotions[key];
                        temp=key;
                    }
                }
                console.log("Emotion is", temp);

                for(var i=0; i< $scope.emotAvail.length-1; i++){
                    if(temp==$scope.emotAvail[i]){
                        $scope.emotions[i].push(1);
                    }else{
                        $scope.emotions[i].push(0);
                    }
                }
                $scope.emotions[$scope.emotions.length-1].push((quill.getLength()-1)/$scope.wordTotal);
                //graph x axis
                if($scope.emotX.length==0){
                    $scope.emotX.push(1);
                }else{
                    $scope.emotX.push($scope.emotX[$scope.emotX.length-1]+1);
                }
            }
            //$scope.emotions.push(temp);

        }).error(function(err, status){
            //go back to start with error message
            console.log(err);
            console.log("unsuccesfful face analysis");
        });
    }

    var callAlert=function(alertType,str){
        
            // Appending dialog to document.body to cover sidenav in docs app
            // Modal dialogs should fully cover application
            // to prevent interaction outside of dialog
            $mdDialog.show(
              $mdDialog.alert()
                .parent(angular.element(document.querySelector('body')))
                .clickOutsideToClose(true)
                .title(alertType)
                .textContent(str)
                .ariaLabel('Alert Dialog Demo')
                .ok('Got it!')
                
            );
        
    }
    

    var faceCheck= function(){
        context.drawImage(video,0,0, 160, 120);
        var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        //console.log("image is: ", image);
        payingAttention.getState(image).success(function(data){
            //turn off loading circle, change page

            console.log("Face successfully evaluated", data.Predictions);
            if( (data.Predictions[0].Tag=="on" && (data.Predictions[0].Probability< data.Predictions[1].Probability || data.Predictions[0].Probability<0.2)) ||
                (data.Predictions[1].Tag=="on" && ((data.Predictions[1].Probability< data.Predictions[0].Probability) || data.Predictions[1].Probability<0.2)) ){
                    faceAbsent+=1;
                    console.log("Not paying attention");
            }else{
                faceAbsent=0;
                console.log("Paying attention");
            }
            //Away for 30secs
            if(faceAbsent>= faceThreshold){
                
                callAlert("Attention Alert", "You're not focused! Get back to work!");
               
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
        window.setInterval(function(){$scope.trackStatus=trackStatusFunct()},1000);

        storePapers.storeData($scope.paperTopic).success(function(data){
            //turn off loading circle, change page
            console.log("Papers successfully accessed");

            getImages.getImgList($scope.paperTopic).success(function(data){
                //turn off loading circle, change page
                console.log("Images successfull received", data);
                var imgs=data.value;
                for(var i=0; i<imgs.length; i++){
                    $scope.images.push(imgs[i].contentUrl);
                }
            }).error(function(error, status){
                //go back to start with error message
                console.log(error);
                console.log("unsuccesfful");
            });

        }).error(function(error, status){
            //go back to start with error message
            console.log(error);
            console.log("unsuccesfful");
        });



    };
    var faceChecker, emotChecker;
    var safetyChecker;



    var safetyCheck=function(){
        var danger=["anger","contempt","disgust","fear","sadness"];
        var total=0;
        var individ="";
        var individVal=0;
        for(var e=0; e<danger.length; e++){
            var hist= $scope.emotions[$scope.emotAvail.indexOf(danger[e])];
            var temp=0;
            for(var i=hist.length-dangerThreshold-1; i< hist.length-1; i++){
                total+=hist[i];
                temp+=hist[i];
            } 
            if(temp>individVal){
                individVal=temp;
                individ=danger[e];
            }
        }
        if(total>=dangerThreshold){
            //$("#mainbody").css({"filter":"blur(5px)"});
            //$("#analytics").css({"filter":"blur(5px)"});
            var str="You seem to be experiencing quite a bit of "+ individ+ " studies show this is counter productive. Maybe take a break?" ;
            callAlert("Emotion Alert", str );
        }
    }

    $scope.$watch('[safety]', function(newValues, oldValues, $scope) {

        var safe=newValues[0];
        if(safe){
            safetyChecker=window.setInterval(safetyCheck, dangerTime);
        }else{
            clearInterval(safetyChecker);
        }


    });

    $scope.$watch('[extreme]', function(newValues, oldValues, $scope) {
        var ex=newValues[0];

        if(ex){
            emotChecker=window.setInterval(emotionCheck, emotTime);
            faceChecker= window.setInterval( faceCheck, faceTime);
        }else{
            clearInterval(faceChecker);
            clearInterval(emotChecker);
        }


    });
}]);