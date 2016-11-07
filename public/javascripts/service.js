
var myApp = angular.module('ScrumApp',['ui.router','ngAnimate','ngMaterial','ngMdIcons']);

myApp.config(function($stateProvider,$urlRouterProvider){
   $stateProvider.state('register',{
       url:'/register',
       templateUrl:'_register.ejs',
       controller:'UserController'
   }).state('searchUser',{
       url:'/searchUser',
       templateUrl:'_searchUser.ejs',
       controller:'UserController'
   }).state('createTask',{
       url:'/createTask',
       templateUrl:'_createTask_new.ejs',
       controller:'NewTaskController'
   }).state('createDependency',{
       url:'/createDependency',
       templateUrl:'_create_dependency.ejs',
       controller:'DependencyController'
   }).state('calendar',{
       url:'/calendar',
       //templateUrl:'_task_calendar.ejs',
       //controller:'CalendarController'
   }).state('taskSuccess',{
       url:'/taskSuccess',
       templateUrl:'_task_success.ejs',
       controller:'NewTaskController'
   }).state('searchTask',{
       url:'/searchTask',
       templateUrl:'_searchTask.ejs',
       controller:'TaskController'
   }).state('createAssignment',{
       url:'/createAssignment',
       templateUrl:'_createAssignment.ejs',
       controller:'AssignmentController'
   }).state('searchAssignment',{
       url:'/searchAssignment',
       templateUrl:'_searchAssignment.ejs',
       controller:'AssignmentController'
   });
});


myApp.controller('UserController',function($scope,UserService){
    $scope.user = {};
    $scope.register = function(){
        console.log($scope.user);
      UserService.post($scope.user).success(function(data){
          $scope.message = data.message;
          $scope.user = {};
      });
    };
    $scope.searchUser = function(){
      if($scope.search.prop !== 'all'){
          $scope.user[$scope.search.prop] = $scope.search.value;
      }
      UserService.get($scope.user).success(function(data){
          $scope.list = false;
          $scope.users = data;
          $scope.user = {};
      });
    };
    $scope.edit = function(user){
      user.display = false;
    };
    $scope.update = function(user){
        console.log('eeee');
        user.display = true;
        UserService.put(user).success(function (data) {
            console.log(data);
        });
    }
});

myApp.controller('TaskController',function($scope,$rootScope,$mdDialog,TaskService){
    $scope.task = {};
    $scope.searchTask = function(){
        if($scope.search){
            TaskService.searchobj_task = $scope.search;
        }else{
            $scope.search = TaskService.searchobj_task;
        }
        if($scope.search.prop !== 'all'){
            $scope.task[$scope.search.prop] = $scope.search.value;
        }
        TaskService.get($scope.task).success(function(data){
            data.forEach(function(ele){
                ele.subtask = [];
                data.forEach(function(ele2){
                    if(ele2.parent_id === ele.id){
                        ele.subtask.push(ele2);
                    };
                });
            });
            $scope.list = false;
            $scope.tasks = data;
            $scope.task = {};
        }).error(function(error){
            console.log(error);
        });
    };
    $rootScope.$on('search-again!', function(){
        console.log("hello");
        $scope.searchTask();
    });

    $scope.update = function($event,obj){
            if ($event.target.nodeName !== 'IMG') {
                obj.enabled = obj.enabled ? false : true;
                $scope.tasks.forEach(function(ele){
                    if(obj.id !== ele.id){
                        ele.enabled=false;
                    }
                });
            };
        console.log(obj);
    };
    $scope.updateall = function(){
        TaskService.put($scope.tasks).success(function (data) {
            $("dialog").prop("open", true);
            $scope.message = data;
            console.log(data);
        });
    };
    $scope.closedialog = function(){
        $("dialog").prop("open", false);
    };

    $scope.delete = function(obj){
        makesure();
        TaskService.deleteobj_task=obj;
    };
    function makesure(ev){
        $mdDialog.show({
            controller:'TaskController',
            templateUrl: 'dialog2.tmpl.html',
            parent: angular.element(document.querySelector('#popupContainer')),
            //targetEvent: ev,
            clickOutsideToClose:false
        });
    }
    function showProcess(ev) {
        $mdDialog.show({
            controller:'TaskController',
            templateUrl: 'dialog1.tmpl.html',
            parent: angular.element(document.querySelector('#popupContainer')),
            //targetEvent: ev,
            clickOutsideToClose:true,
        });
    };
    function deleteSuccessful(ev){
        $mdDialog.show({
            controller:'TaskController',
            templateUrl: 'dialog3.tmpl.html',
            parent: angular.element(document.querySelector('#popupContainer')),
            //targetEvent: ev,
            clickOutsideToClose:true,
        });
    };
    $scope.doit = function(){
        console.log(TaskService.deleteobj_task);
        $mdDialog.cancel();
        showProcess();
        TaskService.delete(TaskService.deleteobj_task).success(function(response){
            console.log(response);
            deleteSuccessful();
            $rootScope.$emit('search-again!');
            //$scope.searchTask();
        });
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
});


myApp.controller('NewTaskController',function($scope,TaskService,$state,$compile){
    if(!TaskService.subTasks){
        $state.go('createTask');
    }

    function createElement(parent,element,classname,attribute){
        element.addClass(classname).attr(attribute);
        parent.append($(element));
    }

    var count = 1;
    $scope.addSubTask = function(){
        if($('input.sub-task').length<5) {
            var attr = {type: 'text', name:'sub-task'+count,placeholder: 'sub-task' + count};
            createElement($('#subTask'), $('<div>'), '', {id: 'sub' + count});
            createElement($('#sub' + count), $('<input>'), 'sub-task', attr);
            //var angulardate = angular.element("<md-datepicker ng-model='myDate' md-placeholder='Enter date'></md-datepicker>");
            //$compile(angulardate)($scope);
            //$('#sub' + count).append(angulardate);
            createElement($('#sub' + count), $('<input>'), 'startDate',{type:'text',placeholder:'start date',onfocus:'this.type = "date"',onblur:'this.type = "text"'});
            var newDirective = angular.element("<duration-inputbox></duration-inputbox>");
            $compile(newDirective)($scope);
            $('#sub' + count).append(newDirective);
            createElement($('#sub' + count), $('<img>'), 'delete', {src: './images/delete.png'});
            count++;
            $('img.delete').on('click',function(){
                $(this).parent().get(0).remove();
            });
        }else{
            alert('at most 5 sub-tasks');
        }
    };

    $scope.save = function(){
        var subTasks = [];
        $('input[name^="sub-task"]').each(function(){
            var obj = {};
            if(typeof $(this).val() !== 'undefined' && $(this).val() !== ""){
                obj.subTask = $(this).val();
                $(this).next().val() === "" ? obj.start_date = null : obj.start_date = $(this).next().val();
                $(this).next().next().children().attr("value_template") === ""? obj.duration = null : obj.duration = $(this).next().next().children().attr("value_template");
                subTasks.push(obj);
            }
        });
        if(subTasks.length>0){
            $scope.task.subTasks = subTasks;
        }
        console.log($scope.task);
        TaskService.post($scope.task).then(function(response){
            if(Array.isArray(response.data)){
                TaskService.subTasks = response.data.reverse();
                $state.go('createDependency');
            } else{
                $scope.message = response.data.message;
            }
        })

    };

    $scope.createNew = function(){
        $state.go('createTask');
    }
});

myApp.controller('DependencyController',function($scope,TaskService,$state){
    if(TaskService.subTasks){
        $scope.subTasks = TaskService.subTasks;
    }else{
        $state.go('createTask');
    }

    TaskService.findSubTasks().then(function(response){
        $scope.allSubTasks = response.data;
        console.log($scope.allSubTasks);
    });

    $scope.addDependency = function(){
        console.log($scope.subTasks);
        TaskService.addDependency($scope.subTasks).then(function(response){
            console.log(response.data);
            $state.go('taskSuccess')
        })
    }
});

myApp.controller('CalendarController',function($scope,TaskService){
    var available =[],noDependency=[],lastDateArray = [],dateArray,month,mostDay;
    TaskService.findAvailable().then(function(response){
        available = response.data;
        noDependency = available.filter(function(ele){
            return ele.dependency === null && ele.start_date !== null;
        });
        console.log(noDependency);
        noDependency.forEach(function(ele,index){
            if(index===0){
                var div = createElement($('#timeline'),$('<div>'),'timebar',{title:ele.description},{width:ele.duration * 60,
                    left:days(ele.start_date,noDependency[0].start_date) * 60,top:10},ele.description);
            }else{
                var div = createElement($('#timeline'),$('<div>'),'timebar',{title:ele.description},{width:ele.duration * 60,
                    left:days(ele.start_date,noDependency[0].start_date) * 60,top:parseInt($('.timebar').last().css('top')) +  30},ele.description);
            }

            div.on('click',function(){
                $('p.speech').appendTo(div).css({display:'block',left:20,top:-70}).html("");
                $('p.speech').append("<ul><li>CreatedBy: "+ele.createdBy+"</li><li>Duration: "+ele.duration+" days</li></ul>");
            });

            var descendant = available.filter(function(ind){
                return ind.dependency === ele.id;
            });
            if(descendant.length>0){
                createTimeline(descendant,ele,noDependency[0],div,available);
            }
        });
        $(document).on('click',function(e){
            if(!$(e.target).hasClass('timebar')){
                $('p.speech').hide();
            }
        });


        // =========================== draw calendar start ==================================
        //first date in timeline
        dateArray = noDependency[0].start_date.substr(0,10).split('-');
        //get current month
        getMonth(parseInt(dateArray[1]));
        $('.timebar').each(function(index,element){
            lastDateArray.push(parseInt($(this).css('left')) + parseInt($(this).css('width')));
        });
        var lastDate = Math.max.apply(null,lastDateArray);
        // set current month
        $('<div>').text(month).css({width:(Math.min(lastDate/60 + parseInt(dateArray[2]) - 1,mostDay) - parseInt(dateArray[2]) + 1)* 60,height:'100%',float:'left',borderRight:'1px solid #ccc',textAlign:'center'}).appendTo($('#month'));
        // set date
        for(var i =dateArray[2];i <= Math.min(lastDate/60 + parseInt(dateArray[2]) - 1,mostDay) ;i++){
            $('<div>').text(i).css({width:60,height:'100%',float:'left',borderRight:'1px solid #ccc',textAlign:'center'}).appendTo($('#day'));
        }
        // if there are multiple months
        if(lastDate/60 + parseInt(dateArray[2]) - 1 > mostDay){
            var lastMostDay = mostDay;
            getMonth(parseInt(dateArray[1])+1);
            $('<div>').text(month).css({width:(lastDate/60 + parseInt(dateArray[2]) - 1 - lastMostDay) * 60,height:'100%',float:'left',borderRight:'1px solid #ccc',textAlign:'center'}).appendTo($('#month'));
            for(var i = 1; i <= lastDate/60 + parseInt(dateArray[2]) - 1 - lastMostDay;i++){
                $('<div>').text(i).css({width:60,height:'100%',float:'left',borderRight:'1px solid #ccc',textAlign:'center'}).appendTo($('#day'));
            }
        }
        $('#timeline').css({width:lastDate,height:700,backgroundColor:'white'});
        $('#date').css('width',lastDate);
        for(var i = 1;i<= lastDate/60 * (available.length+10);i++){
            $('<div>').css({width:60,height:30,float:'left',borderRight:'1px solid #eee',borderBottom:'1px solid #eee'}).appendTo($('#timeline'));
        }
        // =========================== draw calendar end ==================================
    });

    function getMonth(result){
        switch(result){
            case 1:
                month = 'January';
                mostDay = 31;
                break;
            case 2:
                month = 'February';
                mostDay = 30;
                break;
            case 3:
                month = 'March';
                mostDay = 31;
                break;
            case 4:
                month = 'April';
                mostDay = 30;
                break;
            case 5:
                month = 'May';
                mostDay = 31;
                break;
            case 6:
                month = 'June';
                mostDay = 30;
                break;
            case 7:
                month = 'July';
                mostDay = 31;
                break;
            case 8:
                month = 'August';
                mostDay = 31;
                break;
            case 9:
                month = 'September';
                mostDay = 30;
                break;
            case 10:
                month = 'October';
                mostDay = 31;
                break;
            case 11:
                month = 'November';
                mostDay = 30;
                break;
            case 12:
                month = 'December';
                mostDay = 31;
        }

    }


    function createTimeline(array,dependency,baseTask,parentDiv,available){
        array.forEach(function(e){
            var div;
            if(e.start_date && days(e.start_date,dependency.start_date) > dependency.duration){
                div = createElement($('#timeline'),$('<div>'),'timebar',{title: e.description},{width: e.duration*60,
                    left:days(e.start_date,baseTask.start_date) * 60,top:parseInt($('.timebar').last().css('top')) + 30},e.description);
            }else{
                div = createElement($('#timeline'),$('<div>'),'timebar',{itle: e.description},{width: e.duration*60,
                    left:parseInt(parentDiv.css('width'))+parseInt(parentDiv.css('left')),top:parseInt($('.timebar').last().css('top')) + 30},e.description)
            }
            div.on('click',function(){
                $('p.speech').appendTo(div).css({display:'block',left:20,top:-70}).html("");
                $('p.speech').append("<ul><li>CreatedBy: "+e.createdBy+"</li><li>Duration: "+e.duration+" days</li></ul>");
            });
            var descedant = available.filter(function(ind){
                return ind.dependency === e.id;
            });
            if(descedant.length>0){
                createTimeline(descedant,e,baseTask,div,available);
            }
        });
    }

    function days(date2,date1){
        var oneday = 1000 * 60 * 60 *24;
        var day1 = new Date(date1);
        var day2 = new Date(date2);
        var day = day2.getTime() - day1.getTime();
        return day/oneday;
    }

    function createElement(parent,element,classname,attribute,css,html){
        element.css(css).addClass(classname).attr(attribute).html(html);
        parent.append($(element));
        return element;
    }



});

myApp.controller('AssignmentController',function($scope,$mdDialog,UserService,TaskService,AssignmentService){

    $scope.user = {};
    $scope.task = {};
    $scope.searchby={};
    $scope.statuslist=['Finish','Cancel','Pending'];

    $scope.getUser = function(){
        UserService.get($scope.user).success(function(data){
           $scope.users = data;
        });
    };
    $scope.getTask = function(){
        console.log("aaaaa");
        AssignmentService.getTaskforAssign().success(function (data) {
            var data = data.filter(function(ele){
                return ele.parent_id != null
            });
            $scope.tasks = data;

        });
    };
    $scope.assignTask = function(){
        var array = [];
        var tasks,user;
        if($scope.tasks && $scope.users){
            console.log($scope.tasks, $scope.users);
            tasks = $scope.tasks.filter(function(ele){
                return ele.checked === true;
            });
            user = $scope.users.filter(function(ele){
                return ele.checked === "true";
            });
            console.log(tasks, user);
            if(tasks.length > 0 && user.length >0){
                tasks.forEach(function(ele){
                    var obj = {};
                    obj.task_id = ele.id;
                    obj.assignee_id = user[0].id;
                    array.push(obj);
                });
                AssignmentService.post(array).success(function(data){
                    $scope.assignments = data;
                });
                var status = 'successful';
                $scope.getTask();
                showAlert(status);
            }else{
                var status = 'selectagain';
                showAlert(status);
            }
        }
    };
     function showAlert(status,ev) {
         if(status=='successful'){
             $mdDialog.show(
                 $mdDialog.alert()
                     .parent(angular.element(document.querySelector('#popupContainer')))
                     .clickOutsideToClose(true)
                     .title('Message')
                     .content('Assign Successfully!')
                     .ariaLabel('Alert Dialog Demo')
                     .ok('Got it!')
                 //.targetEvent(ev)
             );
         }else if(status=='selectagain'){
             $mdDialog.show(
                 $mdDialog.alert()
                     .parent(angular.element(document.querySelector('#popupContainer')))
                     .clickOutsideToClose(true)
                     .title('Message')
                     .content('Please select both User and Task!')
                     .ariaLabel('Alert Dialog Demo')
                     .ok('Got it!')
                 //.targetEvent(ev)
             );
         }else if(status=='failure'){
             $mdDialog.show(
                 $mdDialog.alert()
                     .parent(angular.element(document.querySelector('#popupContainer')))
                     .clickOutsideToClose(true)
                     .title('Message')
                     .content('Update failure. The updated information will be kept until you refresh.')
                     .ariaLabel('Alert Dialog Demo')
                     .ok('Got it!')
             //.targetEvent(ev)
             );
         }

    };
    $scope.makesearch=function(){

        var obj = UserService.objToUrl($scope.searchby);
        console.log(obj);
        AssignmentService.search(obj).success(function(data){
            $scope.hide = false;
            $scope.searchresult=data;
            $scope.searchby={};
        }).error(function(error){
            console.log("error is", error);
        });
    };

    $scope.update=function(updateobj){
        console.log(updateobj);
        AssignmentService.update(updateobj).success(function(data){
            console.log(data);
        }).error(function(error){
            var status = 'failure';
            showAlert(status);
            console.log("error is", error);
        });;
    };
});

myApp.factory('UserService',function($http){
    return{
        get:function(user){

          return $http.get('/user?'+this.objToUrl(user));
        },
        post:function(user){
            return $http.post('/user',user);
        },
        put:function(user){
            console.log(user);
            return $http.put('/user/'+user.id,user);
        },
        objToUrl:function(obj){
            var arr = [];
            for(var prop in obj){
                var name = encodeURIComponent(prop);
                var value = encodeURIComponent(obj[prop]);
                arr.push(name + '=' + value);
            }
            return arr.join('&');
        }
    }
});

myApp.factory('TaskService',function($http,UserService){
   return {
       subTasks:'',
       get:function(task){
           return $http.get('/task?'+UserService.objToUrl(task));
       },
       post:function(task){
           return $http.post('/task',task);
       },
       findSubTasks:function(){
           return $http.get('/subTask');
       },
       addDependency:function(tasks){
           return $http.patch('/task',tasks);
       },
       findAvailable:function() {
           return $http.get('/available');
       },
       put:function(tasks){
           console.log("=======================",tasks);
           return $http.put('/task', tasks)
       },
       delete:function(task){
           return $http.delete('/task/'+task.id);
       },
       searchobj_task:{},
       deleteobj_task:{}
   }
});

myApp.factory('AssignmentService',function($http){
    return{
        post:function(assignment){
            return $http.post('/assignment',assignment);
        },
        search:function(arr){
            console.log('/assignment?'+ arr);
            return $http.get('/assignment?'+ arr)
        },
        update:function(obj){
            console.log(obj.id);
            return $http.put('/assignment/'+ obj.id , obj);
        },
        getTaskforAssign:function(){
            return $http.get('/notassignedTask');
        }
    }
});
myApp.directive('myContextmenu', function ($parse) {
    return {
        compile: function(tElem, tAttrs) {
            var fn = $parse(tAttrs.myContextmenu);
            return function(scope, elem, attrs) {
                elem.on('contextmenu', function (evt) {
                    scope.$apply(function () {
                        fn(scope, {$event: evt});
                    });
                });
            };
        }
    };
});
myApp.filter('durationunits', function () {
    return function (seconds) {
        // convert seconds to relevant units
        return new Date(2015,08,01).setSeconds(seconds);
    };
});
myApp.directive('durationInputbox',function(){
    return {
        rectict:'AE',
        scope:true,
        template:"<input class='duration' type=text ng-blur='blurevent($event)' placeholder='duration/sec/min/hour/day' style='width:200px'>",
        link: function(scope,event){
            // this is for noraml DOM use, without using scope
            scope.blurevent = function (event){
                if(event.target.value){
                    var second = convertToSeconds(event.target.value);
                    event.target.setAttribute("value_template", second);
                }
            };
            function convertToSeconds(str) {
                var regex = /(\d+)\s?(days?|seconds?|secs?|hours?|weeks?|minutes?|mins?)/gmi;
                var match = regex.exec(str);
                console.log('quantity:',match[1],', \n units:',match[2]);
                var seconds = 0;
                switch(match[2]){
                    case 'days' :
                    case 'day' :
                        seconds=match[1]*3600*24;
                        break;
                    case 'hours':
                    case 'hour':
                        seconds=match[1]*3600;
                        break;
                    case 'seconds':
                    case 'second' :
                    case 'secs' :
                    case 'sec':
                        seconds=match[1];
                        break;
                    case 'min' :
                    case 'mins':
                        seconds=match[1]*60;
                        break;
                    case 'weeks' :
                    case 'week':
                        seconds=match[1]*3600*24*7;
                        break;
                    default:
                        seconds=0;
                        console.log("please enter the right duration");
                        break;
                }
                return seconds;
            }
        }

    }
});