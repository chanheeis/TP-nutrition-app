const express=require('express');
const app=express();
const path=require('path');
const bodyParser=require('body-parser');
const mysql=require('mysql');
const multer=require('multer');
const root=require('./routes/root');
var XMLHttpRequest=require('xmlhttprequest').XMLHttpRequest;

//파일 시스템 설정
const storage=multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,`${root}/views/public/image/uploads`)
    },
    filename: function(req,file,cb){
        cb(null,file.originalname);
    }
});

const upload=multer({storage:storage});

//DB설정
const conn=mysql.createConnection({
    host:'nodejs-004.cafe24.com',
    user:'chanheeis',
    password:'chanheeis12@',
    database:'chanheeis'
});

//미들웨어 설정
app.set('view engine','ejs');
app.set('views',path.join(root,'/views'));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use('/public',express.static(root+'/views/public'));

app.listen(8001,()=>{
    console.log("Connected to 3000 PORT!!!");
    console.log(`This App's Root is ${root}.`);
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
app.post('/login/check',(req,res)=>{
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

app.get('/product/upload',(req,res)=>{
    //관리자의 권한을 가지고 있는지 먼저 판단해야 함
    res.render('product_upload');
})

app.post('/product/upload',upload.single('p_image'),(req,res)=>{
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
    const p_div=req.body.p_div;

    //product의 이미지를 file 전송 시스템으로 업로드하는 변수
    const p_image=`public/image/uploads/${req.file.originalname}`;
    
    const query=`INSERT INTO product SET ?`;
    const data={
        p_name,p_brand,p_desc,
        p_weight,p_flavor,p_fat,
        p_saturated_fat,p_trans_fat,p_cholesterol,
        p_sodium,p_corbohydrate,p_dietary_fiber,
        p_sugar,p_protein,p_image,p_div
    };

    conn.query(query,data,(err,result)=>{
        if(err) throw err;
        res.redirect('/product?page=1');
    });
})

app.post('/product/:p_id/edit',upload.single('p_image'),(req,res)=>{
    const p_id=req.params.p_id;

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
    const p_div=req.body.p_div;

    const query=`UPDATE product SET ? WHERE p_id=${p_id}`;

    const data={
        p_name,p_brand,p_desc,
        p_weight,p_flavor,p_fat,
        p_saturated_fat,p_trans_fat,p_cholesterol,
        p_sodium,p_corbohydrate,p_dietary_fiber,
        p_sugar,p_protein,p_div
    };

    if(req.file){
        const p_image=`public/image/uploads/${req.file.originalname}`;    
        const data={
            p_name,p_brand,p_desc,
            p_weight,p_flavor,p_fat,
            p_saturated_fat,p_trans_fat,p_cholesterol,
            p_sodium,p_corbohydrate,p_dietary_fiber,
            p_sugar,p_protein,p_image,p_div
        };
    }

    conn.query(query,data,(err,result)=>{
        if(err) throw err;
        res.redirect('/product?page=1');
    });
})

//DB에 등록되어 있는 모든 보충제 제품들을 보여주는 페이지, query 객체를 이용하여 페이지별로 20개씩 조회될 수 있게 함
app.get('/product',(req,res)=>{
    const page=req.query.page;
    const query=`SELECT p_id,p_name,p_image FROM product LIMIT ${(page-1)*20},${page*20}`;
    
    conn.query(query,(err,result)=>{
        const viewData=result;
        res.render('product',{viewData:viewData});    
    });
})

//해당 상품을 클릭하면, 해당 상품의 정보를 상세하게 볼 수 있는 페이지
app.get('/product/:p_id',(req,res)=>{
    const query=`SELECT * FROM product WHERE p_id=${req.params.p_id}`;
    conn.query(query,(err,result)=>{
        if(err) throw err;
        res.render('product_info',{viewData:result[0]})
    })
})

//해당 상품을 클릭하면, 관리자의 권한으로 해당 상품의 정보를 변경할 수 있도록 하는 페이지
app.get('/product/:p_id/edit',(req,res)=>{
    const queryStr=req.params.p_id;
    
    const query=`SELECT * FROM product WHERE p_id=${queryStr}`;
    conn.query(query,(err,result)=>{
        if(err) throw err;
        res.render('product_edit',{viewData:result[0]})
    })
})

app.get('/test', function (req, res) {

    getDataFromDB().then(queryStringfy).catch(err=>console.log(err))
    .then(APICall).catch(err=>console.log(err))
    .then(data=>{
        console.log(data);
    });

    function getDataFromDB (){
        return new Promise((resolve,reject)=>{
            const query=`SELECT p_id,p_brand,p_name,p_flavor,p_weight FROM product`; 
            conn.query(query,(err,result)=>{
                if(err){
                    reject("Error Occured During selecting from Database");
                };
                if(result.length==0){
                    reject("Query Result is NULL!!");
                }
                resolve(result)
            })       
        })
    } 

    //Query결과가 있을 때만 실행됨, 해당 Promise에서 id와 query값을 가지는 객체를 배열의 갯수만큼 생성함
    function queryStringfy(data){
        return new Promise((resolve,reject)=>{
            if(data!=null){
                data.forEach((item,index,arr)=>{
                    let brand=item.p_brand;
                    let name=item.p_name;
                    let flavor=item.p_flavor;
                    let weight=item.p_weight.toString();

                    arr[index].query=`${brand} ${name} ${flavor} ${weight}`;
                })
                resolve(data);
            }else{
                reject("Data is NULL!!");
            }
        })
    }

    function APICall(data){
        return new Promise((resolve,reject)=>{
            if(data!=null){
                const client_id="rfsNNjH2NfhNhhTNnPfk";
                const client_secret="uPeOXOPI_k";

                //Data내의 각 item에 접근하여, 해당 query를 가지고 API를 호출, 응답이 완료되면 해당 객체에 lprice의 정보들을 배열로 저장함
                data.forEach((item,index,arr)=>{
                    const url = `https://openapi.naver.com/v1/search/shop.json?query=${item.query}&sort=sim&display=5`;
                    
                    const xhttp=new XMLHttpRequest();

                    //URL(혹은 URI)를 UTF-8 인코딩하는 메서드, encodeURL를 통해 전달해야 공백, 한글로 구성된 URL을 전달해도 문제가 없음
                    xhttp.open('GET',encodeURI(url),true);
                    
                    xhttp.setRequestHeader("X-Naver-Client-Id",client_id);
                    xhttp.setRequestHeader("X-Naver-Client-Secret",client_secret);
                
                    //해당 AJAX의 결과가 null일 때 수행할 예외처리를 정의해야 함
                    xhttp.onreadystatechange=()=>{
                        if(xhttp.readyState==4 && xhttp.status==200){
                            const response=JSON.parse(xhttp.responseText);

                            //AJAX요청 결과로 반환되는 lPrice에 대한 배열 반복문을 정의 
                            if(response.items.length==0){
                                arr[index].lpriceList=["null"];
                            }else{  
                                response.items.forEach((resItem,resIndex,resArr)=>{
                                    if(resIndex==0){
                                        arr[index].lpriceList=[resItem.lprice];
                                    }else{
                                        arr[index].lpriceList.push(resItem.lprice);
                                    }
                                })
                            }                    
                        }

                    }
                    xhttp.send();
                })
                console.log(data);
                resolve(data);
            }else{
                reject("Data is NULL!!__3");
            }
        })
    }
  });