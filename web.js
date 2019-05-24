var express=require('express');
var app=express();
var path=require('path');
var bodyParser=require('body-parser');
var mysql=require('mysql');
var multer=require('multer');

var storage=multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'uploads/')
    },
    filename: function(req,file,cb){
        cb(null,file.originalname);
    }
});

var upload=multer({storage:storage});

var conn=mysql.createConnection({
    host:'nodejs-004.cafe24.com',
    user:'chanheeis',
    password:'chanheeis12@',
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

app.get('/product/insert',(req,res)=>{
    res.render('product');
});

app.post('/product/insert',upload.single('p_image'),(req,res)=>{
    const p_name=req.body.p_name;
    const p_brand=req.body.p_brand;
    const p_desc=req.body.p_desc;
    const p_weight=req.body.p_weight;
    const p_flavor=req.body.p_flavor;
    const p_fat=req.body.p_fat;
    const p_saturated_fat=req.body.p_saturated_fat;
    const p_trans_fat=req.body.p_trans_fat;
    const p_cholesterol=req.body.p_cholesterol;
    const p_sodium=req.body.p_sodium;
    const p_corbohydrate=req.body.p_corbohydrate;
    const p_dietary_fiber=req.body.p_dietary_fiber;
    const p_sugar=req.body.p_sugar;
    const p_protein=req.body.p_protein;

    const query=`INSERT INTO product SET ?`;
    const data={
        p_name,p_brand,p_desc,p_weight,p_flavor,p_fat,p_saturated_fat,p_trans_fat,p_cholesterol,p_sodium,p_corbohydrate,p_dietary_fiber,p_sugar,p_protein
    };

    console.log(req.file);

    conn.query(query,data,(err,result)=>{
        console.log(result);
        res.redirect('/product/insert');
    });
})