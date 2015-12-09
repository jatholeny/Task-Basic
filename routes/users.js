var express = require('express');
var router = express.Router();
var Sequelize = require('sequelize');

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
  email:{type:Sequelize.STRING(40),allowNull:false,unique:true},
  tel:{type:Sequelize.STRING(15)},
  company:{type:Sequelize.STRING(10)},
  organization:{type:Sequelize.STRING(10)},
  department:{type:Sequelize.STRING(20)}
},{timestamps:false});

var Task = sequelize.define('tasks',{
  id:{type:Sequelize.INTEGER,allowNull:false,primaryKey:true,autoIncrement:true},
  parent_id:{type:Sequelize.INTEGER},
  description:{type:Sequelize.STRING(200),allowNull:false},
  createdBy:{type:Sequelize.STRING(15),allowNull:false},
  dependency:{type:Sequelize.INTEGER}
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
  schedule_end_date:{type:Sequelize.DATE,allowNull:false}
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
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

router.post('/user',function(req,res){
  User.create({
    username:req.body.username,
    email:req.body.email,
    tel:req.body.tel,
    company:req.body.company,
    organization:req.body.organization,
    department:req.body.department}).then(function(){
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

router.post('/task',function(req,res){
  Task.create({
    description:req.body.description,
    createdBy:req.body.createdBy,
    parent_id:req.body.parent}).then(function(){
    res.status(201).json({message:'create a task successfully'});
  },function(error){
    console.log(error);
  })
});

router.get('/assignment',function(req,res){
  for(var prop in req.query){
    req.query[prop] = decodeURIComponent(req.query[prop]);
  }
  Assignment.findAll({
    where:req.query
  }).then(function(result){
    res.status(200).json(result);
  })
});

router.post('/assignment',function(req,res){
  Assignment.bulkCreate(req.body).then(function(){
    Assignment.findAll().then(function(data){
      res.status(201).json(data);
    });

  },function(error){
    console.log(error);
  })
});

router.put('/assignment/:id',function(req,res){
  Assignment.update(req.body,
      {where:{id:req.params.id}}).then(function(){
        res.status(200).json({message:'update use successfully'});
      },function(error){
        console.log(error);
      })
});


module.exports = router;
