var express = require('express');
var router = express.Router();
var Sequelize = require('sequelize');
//
var sequelize = new Sequelize('test','root','123456',{
  host:'localhost',
  port:3306,
  dialect:'mysql'
});


sequelize.sync().then(function(data){
  //console.log(data);
}).catch(function(error){
  console.log(error);
});

var User = sequelize.define('users',{
  id:{type:Sequelize.INTEGER,allowNull:false,primaryKey:true,autoIncrement:true},
  username:{type:Sequelize.STRING(20),allowNull:false},
  email:{type:Sequelize.STRING(40),allosdwNull:false,unique:true},
  tel:{type:Sequelize.STRING(15)},
  company:{type:Sequelize.STRING(10)},
  organization:{type:Sequelize.STRING(10)},
  department:{type:Sequelize.STRING(20)},
  mongo_id:{type:Sequelize.STRING(50),unique:true}
},{timestamps:false});

var Task = sequelize.define('tasks',{
  id:{type:Sequelize.INTEGER,allowNull:false,primaryKey:true,autoIncrement:true},
  parent_id:{type:Sequelize.INTEGER},
  description:{type:Sequelize.STRING(200),allowNull:false},
  createdBy:{type:Sequelize.STRING(15),allowNull:false},
  dependency:{type:Sequelize.INTEGER},
  duration:{type:Sequelize.INTEGER},
  start_date:{type:Sequelize.DATE}
},{updatedAt:false});

var Assignment = sequelize.define('assignments',{
  id:{type:Sequelize.INTEGER,allowNull:false,primaryKey:true,autoIncrement:true},
  assigner_id:{type:Sequelize.INTEGER,allowNull:true,references:{
    model:User,
    key:'id'
  }},
  assignee_id:{type:Sequelize.INTEGER,allowNull:false,references:{
    model:User,
    key:'id'
  }},
  task_id:{type:Sequelize.INTEGER,allowNull:false,references:{
    model:Task,
    key:'id'
  }},
  priority:{
    type:Sequelize.STRING(10)
  },
  status:{type:Sequelize.STRING(10)},
  comment:{type:Sequelize.STRING(100)},
  actual_end_date:{type:Sequelize.DATE},
  actual_start_date:{type:Sequelize.DATE}
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/user',function(req,res){
  if(Object.getOwnPropertyNames(req.query).length > 0){
    if(req.query.username){
      var username = decodeURIComponent(req.query.username);
    }
    if(req.query.email){
      var email = decodeURIComponent(req.query.email);
    }
    User.findAll({
      where:{
        $or:{
          username:username,
          email:email
        }
      }
    }).then(function(result){
      res.status(200).json(result);
    });
  }else{
    User.findAll().then(function(result){
      res.status(200).json(result);
    });
  }
});

router.get('/user/:username',function(req,res){
  console.log(req.params);
  User.findOne({
    where:{username:req.params.username}
  }).then(function(result){
    res.status(200).json(result);
  })
});

router.post('/user',function(req,res){
  console.log(req.body);
  console.log(typeof req.body);
  User.create(req.body).then(function(){
    console.log(res);
    res.status(201).json({message:'create a user successfully'});
  },function(error){
    console.log(error);
  })
});

router.put('/user/:id',function(req,res){
  console.log(req.body);
  User.update(
      {username:req.body.username,email:req.body.email,tel:req.body.tel, department:req.body.department,company:req.body.company,organization:req.body.organization},
      {where:{id:req.params.id}}).then(function(){
    res.status(200).json({message:'update use successfully'});
  },function(error){
    console.log(error);
  })
});

router.get('/task',function(req,res){
  console.log(req.query);
  if(req.query.createdBy){
    var createBy = decodeURIComponent(req.query.createdBy);
    Task.findAll({
      where:{
        createdBy:createBy
      }
    }).then(function(result){
      res.status(200).json(result);
    })
  }else if(req.query.description){
    var description = decodeURIComponent(req.query.description);
    Task.findAll({
      where:{
        description:{
          $like:'%'+description+'%'
        }
      }
    }).then(function(result){
      res.status(200).json(result);
    })
  }else{
    Task.findAll().then(function(result){
      res.status(200).json(result);
    })
  }
});

router.get('/subTask',function(req,res){
  Task.findAll({where:{parent_id:{$ne:null}}}).then(function(result){
    res.status(200).json(result);
  })
});

router.get('/available',function(req,res){
  Task.findAll({where:{duration:{$ne:null}},order:'start_date'}).then(function(result){
    res.status(200).json(result);
  });
});

router.post('/task',function(req,res){
  Task.create({
    description:req.body.section,
    createdBy:req.body.createdBy}).then(function(result){
    if(req.body.subTasks){
      var arr = [];
      req.body.subTasks.forEach(function(ele){
        var obj = {description:ele.subTask,createdBy:req.body.createdBy,parent_id:result.dataValues.id,duration:ele.duration,start_date:ele.start_date};
        arr.push(obj);
      });
      Task.bulkCreate(arr).then(function(){
        Task.findAll({order:'id DESC',limit:arr.length}).then(function(response){
          res.status(201).json(response);
        });

      });
    }else{
      res.status(201).json({message:'successfully!'});
    }
  },function(error){
    console.log(error);
  })
});

router.patch('/task',function(req,res){
  var promises = [];
  req.body.forEach(function(ele){
    if(ele.dependency !== null){
      var promise = Task.update({dependency:ele.dependency},{where:{id:ele.id}});
      promises.push(promise);
    }
  });
  Promise.all(promises).then(function(result){
    console.log(result);
    res.status(200).json({message:'update successfully'});
  },function(err){
    console.log(err);
  })
});
router.put('/task',function(req,res){
  var count = 0;
  req.body.forEach(function(ele){
    Task.update(
        {description:ele.description},
        {where:{id:ele.id}}
    ).then(function(){
          count ++;
        },function(error){
          console.log(error);
        });
  })
  res.status(200).json({message:"Tasks has been updated successfully!"});
});
router.delete('/task/:id',function(req,res){
  Task.findAll({
    where: {
      $or: [
        { id:req.params.id},
        { parent_id:req.params.id}
      ]
    }
  }).then(function(){
    Task.destroy({
      where: {
        $or: [
          { id:req.params.id},
          { parent_id:req.params.id}
        ]
      }
    }).then(function(affectedRows) {
      res.status(200).json({message:"Deleted"+affectedRows+"tasks !"});
    });
  });
});
router.get('/assignment',function(req,res){
  var querystring = "WHERE ";
  if(Object.keys(req.query).length != 0){
    for(var prop in req.query){
      req.query[prop] = decodeURIComponent(req.query[prop]);
      querystring = querystring + prop +" = '"+req.query[prop] + "' AND ";
    }
    querystring = querystring.slice(0, -5);
  }else{
    querystring=""
  }

  console.log(req.query);
  console.log(querystring);
  sequelize.query("SELECT assignments.id,assignments.assigner_id, users.username,tasks.description,assignments.priority,assignments.status,assignments.comment,assignments.createdAt FROM `assignments` INNER JOIN tasks ON assignments.task_id=tasks.id INNER JOIN users ON assignments.assignee_id = users.id "+querystring, { type: sequelize.QueryTypes.SELECT}).then(function(result) {
        result.forEach(function(ele){
          console.log(ele);
        });
    res.status(200).json(result);
  }),function(error){
    res.status(500).json(error);
  };

});
router.post('/',function(req){
  mongodb.find().update(req.body)
})
router.post('/assignment',function(req,res){
  Assignment.bulkCreate(req.body).then(function(){
    Assignment.findAll().then(function(data){
      res.status(201).json(data);
    });

  },function(error){
    res.status(500).json(error);
    console.log(error);
  })
});

router.put('/assignment/:id',function(req,res){
  Assignment.update(req.body,
      {where:{id:req.params.id}}).then(function(){
        res.status(200).json({message:'update use successfully'});
      },function(error){
        res.status(500).json(error);
        console.log(error);
      })
});

router.post('/assignTask',function(req,res){
  console.log(req.body);
  var promise1 = Task.create({description:req.body.description,createdBy:req.body.createdBy});
  promise1.then(function(data){
    var promise2 = Assignment.create({task_id:data.dataValues.id,assigner_id:req.body.assigner_id,assignee_id:req.body.assignee_id});
    promise2.then(function(){
      res.status(201).json({message:'Assign Task successfully'});
    },function(error){
      console.log('Error:'+error);
    })
  }, function(error){
    console.log('Error:'+error);
  });
});

router.get('/notassignedTask',function(req,res){

  sequelize.query("SELECT tasks.id,tasks.parent_id, tasks.description,tasks.createdBy,tasks.createdAt,tasks.dependency,tasks.duration,tasks.start_date, assignments.assignee_id FROM `tasks` LEFT JOIN assignments ON tasks.id = assignments.task_id WHERE assignments.assignee_id IS NULL", { type: sequelize.QueryTypes.SELECT}).then(function(result) {
    result.forEach(function(ele){
      console.log(ele);
    });
    res.status(200).json(result);
  });
})


module.exports = router;
