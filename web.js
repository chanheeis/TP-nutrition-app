const express=require('express');
const app=express();
const path=require('path');
const bodyParser=require('body-parser');
const mysql=require('mysql');
const multer=require('multer');
const root=require('./routes/root');
const XMLHttpRequest=require('xmlhttprequest').XMLHttpRequest;
const session=require('express-session');

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
app.use('/public',express.static(root + '/public'));

//미들웨어 세션 설정 파트
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))

app.listen(8001,()=>{
    console.log("Connected to 3000 PORT!!!");
    console.log(`This App's Root is ${root}.`);
    conn.connect();
})

app.get('/',(req,res)=>{
    //View에 렌더하기 위해 넘겨줄 변수들을 정의하고 있음
    const loginInfo={
        loginStatus:req.session.loginStatus,
        userName:req.session.userName
    };
    res.render('home',{loginInfo:loginInfo});
})

app.get('/join',(req,res)=>{
    const loginInfo={
            loginStatus:req.session.loginStatus,
            userName:req.session.userName
        }
    res.render('join',{loginInfo:loginInfo});
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
    const m_id=req.body.m_id_login;
    const m_password=req.body.m_password_login;

    const queryArr=[m_id,m_password]
    const query=`SELECT m_name,m_number FROM member WHERE m_id=? AND m_password=?`;

    conn.query(query,queryArr,(err,results)=>{
        if(err) throw err;

        //로그인에 성공하여, 해당 로그인 정보를 세션에 저장하기 위해 해당 라우터로 분기함
        if(results[0]){
            req.session.userName=results[0].m_name;
            req.session.loginStatus=true;
            req.session.memberNumber=results[0].m_number;

            if(results[0].m_number<100){
                req.session.isAdmin=true;
            }else{
                req.session.isAdmin=false;
            }
        }
        res.redirect('/');
    })
})

app.get('/product/upload',(req,res)=>{ 
    //관리자의 권한을 가지고 있는지 먼저 판단해야 함
    const isAdmin=req.session.isAdmin
    const loginInfo={
        loginStatus:req.session.loginStatus,
        userName:req.session.userName
    };
    res.render('./product/product_upload',{isAdmin:isAdmin,loginInfo:loginInfo});
})

app.post('/product/upload',upload.single('p_image'),(req,res)=>{
    const p_name=req.body.p_name;
    const p_brand=req.body.p_brand;
    const p_desc=req.body.p_desc;
    const p_weight=req.body.p_weight;
    const p_flavor=req.body.p_flavor;
    const p_fat=req.body.p_fat;
    const p_calorie=req.body.p_calorie;
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
        p_sugar,p_protein,p_image,p_div,p_calorie
    };

    conn.query(query,data,(err,result)=>{
        if(err) throw err;
        res.redirect('/product/upload');
    });
})

//DB에 등록되어 있는 모든 보충제 제품들을 보여주는 페이지, query 객체를 이용하여 페이지별로 20개씩 조회될 수 있게 함
app.get('/product',(req,res)=>{
    const page=req.query.page;

    if(req.session.loginStatus){
        //session에 memberNumber가 있을 경우(즉, 로그인 상태가 True일 경우 정의되는 쿼리)
        const query=
        `SELECT P.p_id,P.p_name,P.p_image,P.p_brand,
        (SELECT COUNT(*) FROM product_like PL WHERE P.p_id=PL.p_id) AS count_like,
        (SELECT COUNT(*) FROM product_unlike PUL WHERE P.p_id=PUL.p_id) AS count_unlike,
        (SELECT COUNT(*)>0 FROM product_like PL WHERE P.p_id=PL.p_id AND PL.m_number=${req.session.memberNumber}) AS isLike,
        (SELECT COUNT(*)>0 FROM product_unlike PUL WHERE P.p_id=PUL.p_id AND PUL.m_number=${req.session.memberNumber}) AS isUnlike
        FROM product P LIMIT ${(page-1)*20},20`;

        conn.query(query,(err,result)=>{
            const loginInfo={
                loginStatus:req.session.loginStatus,
                userName:req.session.userName
            }
            res.render('./product/product',{viewData:result,loginInfo:loginInfo,pageNum:page});    
        });
    }else{
        //session에 memberNumber가 없을 경우(즉, 로그인 되어 있지 않은 경우에서 정의되는 쿼리)
        const query=
        `SELECT P.p_id,P.p_name,P.p_image,P.p_brand,
        (SELECT COUNT(*) FROM product_like PL WHERE P.p_id=PL.p_id) AS count_like,
        (SELECT COUNT(*) FROM product_unlike PUL WHERE P.p_id=PUL.p_id) AS count_unlike
        FROM product P LIMIT ${(page-1)*20},20`;

        conn.query(query,(err,result)=>{
            const loginInfo={
                loginStatus:req.session.loginStatus,
                userName:req.session.userName
            }
            res.render('./product/product',{viewData:result,loginInfo:loginInfo,pageNum:page});    
        });     
    }
})

//해당 상품을 클릭하면, 해당 상품의 정보를 상세하게 볼 수 있는 페이지
app.get('/product/:p_id',(req,res)=>{
    const query=`SELECT * FROM product WHERE p_id=${req.params.p_id}`;
    conn.query(query,(err,result)=>{
        if(err) throw err;
            const loginInfo={
                loginStatus:req.session.loginStatus,
                userName:req.session.userName,
                isAdmin:req.session.isAdmin
            }
        res.render('./product/product_info',{viewData:result[0],loginInfo:loginInfo})
    })
})

//해당 상품을 클릭하면, 관리자의 권한으로 해당 상품의 정보를 변경할 수 있도록 하는 페이지
app.get('/product/:p_id/edit',(req,res)=>{
    const queryStr=req.params.p_id;
    
    const query=`SELECT * FROM product WHERE p_id=${queryStr}`;
    conn.query(query,(err,result)=>{
        if(err) throw err;
        const isAdmin=req.session.isAdmin;
        res.render('./product/product_edit',{viewData:result[0],isAdmin:isAdmin})
    })
})

app.post('/product/:p_id/edit',upload.single('p_image'),(req,res)=>{
    const submitType=req.body.submitType;
    const p_id=req.params.p_id;
    
    //삭제하기 버튼으로 해당 페이지에 접근했을 때 수행
    if(submitType==="삭제하기"){
        res.redirect(`/product/${p_id}/delete`);
    //편집완료 버튼으로 해당 페이지에 접근했을 때 수행
    }else if(submitType==="편집완료"){
        const p_calorie=req.body.p_calorie;
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
        let data={
            p_name,p_brand,p_desc,
            p_weight,p_flavor,p_fat,
            p_saturated_fat,p_trans_fat,p_cholesterol,
            p_sodium,p_corbohydrate,p_dietary_fiber,
            p_sugar,p_protein,p_div,p_calorie   
        }
    
        if(req.file){
            const p_image=`/image/uploads/${req.file.originalname}`;    
            data.p_image=p_image;
        }
    
        conn.query(query,data,(err,result)=>{
            if(err) throw err;
            res.redirect('/product?page=1');
        });
    }else{
        res.send("잘못된 페이지 접근입니다.")
    }
})

//해당 상품을 삭제하는 페이지이므로, 반드시 관리자의 권한을 가지고 있는 사용자만이 접근할 수 있어야 함
app.get('/product/:p_id/delete',(req,res)=>{
    const p_id=req.params.p_id;
    const query=`DELETE FROM product WHERE p_id=${p_id}`;
    conn.query(query,(err,result)=>{
        if(err) throw err;
        res.redirect('/product?page=1');
    })

})

app.get('/logout',(req,res)=>{
    delete req.session.isAdmin;
    delete req.session.loginStatus;
    delete req.session.userName;
    res.redirect('/');
})

//사용자가 좋아요 버튼을 클릭하였을 때, 해당 처리를 AJAX로 수행하는 라우트
app.get('/like/:p_id',(req,res)=>{
    const productNumber=req.params.p_id;
    if(req.session.loginStatus){
        const memberNumber=req.session.memberNumber;
        
        //User Number가 있을 때만 DB쿼리를 실행
        queryLike(memberNumber,productNumber)
        .then(controlPromise).catch(err=>console.log("Error Occured During Control Promise"+err))
        .then(calcUnlike).catch(err=>console.log("Error Occured during last Promise!!"));

    }

    function queryLike(memberNumber,productNumber){
        return new Promise((resolve,reject)=>{
            const query=`SELECT like_id FROM product_like WHERE m_number=${memberNumber} AND p_id=${productNumber}`;
            conn.query(query,(err,result)=>{
                if(err) throw err;

                //result의 길이와 함께, product의 ID도 함께 전달해야 함
                const data={
                    resultLength:result.length,
                    productNumber,
                    memberNumber
                };
                resolve(data);
            })
        })
    }

    function controlPromise(data){
        return new Promise((resolve,reject)=>{
            if(data.resultLength==0){

                //insertLike Promise정의
                const query=`INSERT INTO product_like SET ?`;
                const queryData={
                    m_number:data.memberNumber,
                    p_id:data.productNumber
                };

                conn.query(query,queryData,(err,result)=>{
                    if(err) throw err;
                    const data_2={
                        productNumber:data.productNumber,
                        isLike:true
                    };
                    resolve(data_2);
                })
                //insert query이후 다시 AJAX 응답 전송하기 (Promise 방식으로 전달해야 함)
            
            }else if(data.resultLength==1){
                //deleteLike Promise 정의
                const query=`DELETE FROM product_like WHERE m_number=${data.memberNumber} AND p_id=${data.productNumber}`;
                
                conn.query(query,(err,result)=>{
                    if(err) throw err;
                    const data_2={
                        productNumber:data.productNumber,
                        isLike:false
                    };
                    resolve(data_2);
                })

                //delete query 이후 다시 AJAX 응답 전송하기 (Promise 방식으로 전달해야 함)
            }else{
                //에러처리하기
                reject("Control Promise 처리 중 오류가 발생하였습니다.");
            }
        })
    }

    //좋아요의 갯수와 상품의 좋아요 여부를 판단하는 로직
    function calcUnlike(data){
        return new Promise((resolve,reject)=>{
            const productNumber=data.productNumber;
            const isLike=data.isLike;

            const query=`SELECT count(*) COUNT FROM product_like WHERE p_id=${productNumber}`;
            conn.query(query,(err,result)=>{
                const data_3={
                    isLike,
                    COUNT:result[0].COUNT
                };
                res.json(data_3);
            })
        })
    }
})

//싫어요를 눌렀을 때 작동하는 쿼리
app.get('/unlike/:p_id',(req,res)=>{
    const productNumber=req.params.p_id;
    if(req.session.loginStatus){
        const memberNumber=req.session.memberNumber;
        console.log(memberNumber);
        
        //User Number가 있을 때만 DB쿼리를 실행
        queryLike(memberNumber,productNumber)
        .then(controlPromise).catch(err=>console.log("Error Occured During Control Promise"+err))
        .then(calcUnlike).catch(err=>console.log("Error Occured during last Promise!!"));

    }else{
        console.log("Login Please!!");
    }

    function queryLike(memberNumber,productNumber){
        return new Promise((resolve,reject)=>{
            const query=`SELECT unlike_id FROM product_unlike WHERE m_number=${memberNumber} AND p_id=${productNumber}`;
            conn.query(query,(err,result)=>{
                if(err) throw err;

                //result의 길이와 함께, product의 ID도 함께 전달해야 함
                const data={
                    resultLength:result.length,
                    productNumber,
                    memberNumber
                };
                resolve(data);
            })
        })
    }

    function controlPromise(data){
        return new Promise((resolve,reject)=>{
            console.log(`ControlPromise Data : ${data.resultLength},${data.productNumber},${data.memberNumber}`);
            if(data.resultLength==0){

                //insertLike Promise정의
                const query=`INSERT INTO product_unlike SET ?`;
                const queryData={
                    m_number:data.memberNumber,
                    p_id:data.productNumber
                };

                conn.query(query,queryData,(err,result)=>{
                    if(err) throw err;
                    const data_2={
                        productNumber:data.productNumber,
                        isUnlike:true
                    };
                    resolve(data_2);
                })
                //insert query이후 다시 AJAX 응답 전송하기 (Promise 방식으로 전달해야 함)
            
            }else if(data.resultLength==1){
                //deleteLike Promise 정의
                const query=`DELETE FROM product_unlike WHERE m_number=${data.memberNumber} AND p_id=${data.productNumber}`;
                
                conn.query(query,(err,result)=>{
                    if(err) throw err;
                    const data_2={
                        productNumber:data.productNumber,
                        isUnlike:false
                    };
                    resolve(data_2);
                })

                //delete query 이후 다시 AJAX 응답 전송하기 (Promise 방식으로 전달해야 함)
            }else{
                console.log("잘못된 처리")
                //에러처리하기
                reject("Control Promise 처리 중 오류가 발생하였습니다.");
            }
        })
    }

    //좋아요의 갯수와 상품의 좋아요 여부를 판단하는 로직
    function calcUnlike(data){
        return new Promise((resolve,reject)=>{
            const productNumber=data.productNumber;
            const isUnlike=data.isUnlike;

            const query=`SELECT count(*) COUNT FROM product_unlike WHERE p_id=${productNumber}`;
            conn.query(query,(err,result)=>{
                const data_3={
                    isUnlike,
                    COUNT:result[0].COUNT
                };
                res.json(data_3);
            })
        })
    }
})

app.get('/mypage',(req,res)=>{
    /*
        마이페이지에서 구현할 기능 :
        1) 입력했던 회원정보를 보여주고, 해당 정보를 수정할 수 있도록 구성
        2) 내가 좋아요했던 상품이 무엇인지 보여주고(이름, 브랜드), 해당 상품 페이지로 이동할 수 있도록 a태그 링크로 연결
    */
    res.render('mypage');
})


//해당 상품의 가격대를 탐색하기 위하여 네이버에서 제공하는 쇼핑 검색 API를 호출하는 부분
/*
app.get('/test', function (req, res) {
    getDataFromDB().then(queryStringfy).catch(err=>console.log(err))
    .then(data=>{
        return Promise.all(data.map((value)=>{
            return new Promise((resolve,reject)=>{
                //각 value의 query로 API호출을 하여, readyState와 status가 만족되면, 해당 가격들을 리스트화하여 resolve 
                const client_id="rfsNNjH2NfhNhhTNnPfk";
                const client_secret="uPeOXOPI_k";
                const url = `https://openapi.naver.com/v1/search/shop.json?query=${value.query}&sort=sim&display=1`;    
                const xhttp=new XMLHttpRequest();

                //URL(혹은 URI)를 UTF-8 인코딩하는 메서드, encodeURL를 통해 전달해야 공백, 한글로 구성된 URL을 전달해도 문제가 없음
                xhttp.open('GET',encodeURI(url),true);

                xhttp.setRequestHeader("X-Naver-Client-Id",client_id);
                xhttp.setRequestHeader("X-Naver-Client-Secret",client_secret);
            
                //해당 AJAX의 결과가 null일 때 수행할 예외처리를 정의해야 함
                xhttp.onreadystatechange=()=>{
                    if(xhttp.readyState==4 && xhttp.status==200){
                        const response=JSON.parse(xhttp.responseText);
                        resolve(response);
                        if(response.items.length==0){
                            value.lpriceList=["null"];
                            resolve(value);
                        }else{  
                            console.log(response.items);
                            response.items.forEach((item,index,arr)=>{
                                if(index==0){
                                    value.lpriceList=[item.lprice];
                                }else{
                                    value.lpriceList.push(item.lprice);
                                }
                            })
                            resolve(value);
                        }
                    }else{
                        console.log(`ReadyState is ${xhttp.readyState}`);
                        console.log(`Status is ${xhttp.status}`);
                    }
                } 
                xhttp.send();
            })
        }));
    })
    .then((data)=>{
        console.log(data[4].items);
    })

    function getDataFromDB (){
        return new Promise((resolve,reject)=>{
            const query=`SELECT p_id,p_brand,p_name,p_flavor,p_weight FROM product LIMIT 10`; 
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
})*/