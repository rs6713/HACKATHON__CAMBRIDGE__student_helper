var mainApplicationModuleName= 'cambridgehack';
var mainApp= angular.module(mainApplicationModuleName, ['ui.bootstrap', 'ngMaterial', 'ngMessages']);

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

mainApp.factory('getIntros', ['$http', function($http){
    return $http.get('/intros');
}]);
mainApp.factory('getConcs', ['$http', function($http){
    return $http.get('/concs');
}]);



mainApp.controller('mainController',['$scope', '$timeout', 'storePapers', 'getIntros', 'getConcs' , 'getTopics','$mdToast',function($scope, $timeout, storePapers, getIntros, getConcs,getTopics, $mdToast){
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
        getIntros.success(function(data){
            console.log("successfully got intros", data);
            $scope.results=data;
        }).error(function(data,status){
            console.log(data, status);
            $scope.results=[];
        });

    }
    $scope.getConc=function(){
        console.log("getting conclusions");
        getConcs.success(function(data){
            console.log("successfully got conclusions",data );
            $scope.results=data;
        }).error(function(data,status){
            console.log(data, status);
            $scope.results=[];
        });
    }


    var updateWordCount=function(){
        quill.getLength();
    }
    var updateTimeLeft= function(){
        var left=$scope.deadline-new Date().getTime();
        $scope.timeLeftHr = Math.floor((left % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        $scope.timeLeftMin = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
        $scope.timeLeftSec = Math.floor((left % (1000 * 60)) / 1000);
        $scope.$apply() ;   
    };
    $scope.loadMainPage=function(){

        quill.insertText(0, $scope.paperTopic, 'bold', true);
        $scope.deadline=new Date().getTime()+ $scope.hours*60*60*1000;
        window.setInterval(updateTimeLeft, 1000);
        window.setInterval(function(){$scope.wordCount=quill.getLength();}, 1000);

        storePapers.storeData($scope.paperTopic).success(function(data){
            //turn off loading circle, change page
            console.log("Papers successfully accessed");
        }).error(function(error, status){
            //go back to start with error message
            console.log(error);
        });

    };

}]);