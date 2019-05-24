var express=require('express');
var app=express();
var path=require('path');
var bodyParser=require('body-parser');
var mysql=require('mysql');

var conn=mysql.createConnection({
    host:'nodejs-004.cafe24.com',
    user:'chanheeis',
    password:'chanheeis12',
    database:'chanheeis'
});

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'/views'));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use('/public',express.static(__dirname+'/views/public'));

app.listen(8001,()=>{
    console.log("Connected to 3000 PORT!!!");
    conn.connect();
    console.log("DB Connected!!");
    
})

app.get('/',(req,res)=>{
    res.render('home');
})

app.get('/join',(req,res)=>{
    res.render('join');
})

app.post('/join',(req,res)=>{
    const m_name=req.body.m_name;
    const m_id=req.body.m_id;
    const m_password=req.body.m_password;
    const m_birth=req.body.m_birth_y+req.body.m_birth_m+req.body.m_birth_d;
    const m_sex=req.body.m_sex;
    const m_email=req.body.m_email_1 + req.body.m_email_2; 

    const query='INSERT INTO member SET ?';
    const data={
        m_name,m_password,m_birth,m_sex,m_email,m_id
    };
    

    conn.query(query,data,(err,result)=>{
        if(err) throw err;
        
        console.log(result);
        res.redirect('/');
    })
})

app.get('/id_check',(req,res)=>{
    const m_id=req.query.id;
    const query=`SELECT m_number FROM member WHERE m_id='${m_id}'`;
    conn.query(query,(err,result)=>{
        if(err) throw err;
        
        var response={
            isDuplicated:true,
            color:'red'
        };

        if(result.length==0){
            response.isDuplicated=false;
            response.color='blue';
        }

        res.json(response);
    })
})

//Login체크를 위한 라우터
app.post('/login',(req,res)=>{
    const m_id=req.body.id;
    const m_password=req.body.pw;

    const queryArr=[m_id,m_password]
    const query=`SELECT m_name FROM member WHERE m_id=? AND m_password=?`;

    conn.query(query,queryArr,(err,results)=>{
        if(err) throw err;
        
        const responseData={
            m_name:null,
            login_status:false
        };

        if(results[0]){
            responseData.m_name=results[0].m_name;
            responseData.login_status=true;
        }
        res.json(responseData);
    })
})