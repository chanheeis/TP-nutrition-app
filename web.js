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
        cb(null,`${root}/public/image/uploads`)
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
    password:'A1318dkfk!@',
    database:'chanheeis'
});

//미들웨어 설정
app.set('view engine','ejs');
app.set('views',path.join(root,'/views'));

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(express.static(root + '/public'));

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

//제품을 추천하는 JSON 응답의 AJAX요청 수행
app.post('/recommend',(req,res)=>{

    const res_1=req.body.res_1;
    const res_2=req.body.res_2;
    const res_3=req.body.res_3;
    const res_4=req.body.res_4;

    insertResponse(res_1,res_2,res_3,res_4).catch(err=>console.log(err))
        .then(selectResponse).catch(err=>console.log(err))
        .then(processCondition).catch(err=>console.log(err))
        .then(selectProduct).catch(err=>console.log(err))
        .then(filterProducts).catch(err=>console.log(err)).then(
            idList=>{
                return Promise.all(idList.map(id=>{
                    return new Promise((resolve,reject)=>{
                        const query=`
                            SELECT p_id, p_brand, p_name, p_image FROM product WHERE p_id=${id}
                        `;
                        conn.query(query,(err,result)=>{
                            if(err) throw err;
                            resolve(result)
                        })
                    })
                }))
            }
        ).then(data=>res.json(data));
    
    function filterProducts(data){
        return new Promise((resolve,reject)=>{
            const condition=data.condition;
            const products=data.products;
            const resultArr=[];

            if(condition.isDiabetes&&condition.isKidneyDisorder){
                let count=0;
                console.log(count);
                for(product of products){
                    if(
                        calRate(product.p_serving,product.p_protein)>=condition.minProRate&&
                        calRate(product.p_serving,product.p_protein)<=condition.maxProRate&&
                        calRate(product.p_serving,product.p_corbohydrate)>=condition.minCarRate&&
                        calRate(product.p_serving,product.p_corbohydrate)<=condition.maxCarRate&&
                        product.p_sugar==0&&
                        product.p_protein<15
                    ){
                        resultArr.push(product.p_id);
                        count++;
                        if(count==3) break;
                    }
                }
                resolve(resultArr);
            }else if(condition.isDiabetes&&!condition.isKidneyDisorder){
                let count=0;
                console.log(count);
                for(product of products){
                    if(
                        calRate(product.p_serving,product.p_protein)>=condition.minProRate&&
                        calRate(product.p_serving,product.p_protein)<=condition.maxProRate&&
                        calRate(product.p_serving,product.p_corbohydrate)>=condition.minCarRate&&
                        calRate(product.p_serving,product.p_corbohydrate)<=condition.maxCarRate&&
                        product.p_sugar==0
                    ){
                        console.log("minCarRate : "+condition.minCarRate)
                        resultArr.push(product.p_id);
                        console.log(resultArr);
                        count++;
                        console.log(count);
                        if(count==3) break;
                    }
                }
                resolve(resultArr);
            }else if(!condition.isDiabetes&&condition.isKidneyDisorder){
                let count=0;
                console.log(count);
                for(product of products){
                    if(
                        calRate(product.p_serving,product.p_protein)>=condition.minProRate&&
                        calRate(product.p_serving,product.p_protein)<=condition.maxProRate&&
                        calRate(product.p_serving,product.p_corbohydrate)>=condition.minCarRate&&
                        calRate(product.p_serving,product.p_corbohydrate)<=condition.maxCarRate&&
                        product.p_protein<15
                    ){
                        console.log("minCarRate : "+condition.minCarRate)
                        resultArr.push(product.p_id);
                        console.log(resultArr);
                        count++;
                        console.log(count);
                        if(count==3) break;
                    }
                }
                resolve(resultArr);
            }else if(!condition.isDiabetes&&!condition.isKidneyDisorder){
                let count=0;
                console.log(count);
                for(product of products){
                    if(
                        calRate(product.p_serving,product.p_protein)>=condition.minProRate&&
                        calRate(product.p_serving,product.p_protein)<=condition.maxProRate&&
                        calRate(product.p_serving,product.p_corbohydrate)>=condition.minCarRate&&
                        calRate(product.p_serving,product.p_corbohydrate)<=condition.maxCarRate
                    ){
                        console.log("minCarRate : "+condition.minCarRate)
                        resultArr.push(product.p_id);
                        console.log(resultArr);
                        count++;
                        console.log(count);
                        if(count==3) break;
                    }
                }
                resolve(resultArr);
            }
        })
    }

    function selectProduct(data){
        return new Promise((resolve,reject)=>{
            console.log(data);
            const query=`
                SELECT p_id,p_protein,p_corbohydrate,p_sugar,p_serving FROM product
            `;
            conn.query(query,(err,result)=>{
                if(err)throw err;
                const passData={
                    condition:data,
                    products:result
                }
                resolve(passData);
            })
            
        })
    }

    function processCondition(data){
        return new Promise((resolve,reject)=>{    
            let minProteinLimit=null;
            let maxProteinLimit=null;
            let minProtein=null;
            let maxProtein=null;
            let minCarRate=null;
            let maxCarRate=null;
            let minProRate=null;
            let maxProRate=null;
            let isDiabetes=false;
            let isKidneyDisorder=false;

            //res_1에 대한 처리 (신장 장애 여부)
            if(data.res_1=='T'){
                isKidneyDisorder=true;
                minProteinLimit=10;
                maxProteinLimit=15;
            }
            //res_2에 대한 처리 (보충제 섭취의 목적)
            switch (data.res_2){
                case '체중감량' :
                    isDiabetes=true;
                    minProtein=0;
                    maxProtein=1.2;
                    maxCarRate=40;
                    minCarRate=20;
                    maxProRate=50;
                    minProRate=30;
                    break;
                case '일반적인 운동' :
                    minProtein=1.2;
                    maxProtein=1.6;
                    maxCarRate=60;
                    minCarRate=40;
                    maxProRate=40;
                    minProRate=20;
                    break;
                case '근육증가' :
                    minProtein=1.6;
                    maxProtein=3;
                    minCarRate=30;
                    maxCarRate=50;
                    maxProRate=60;
                    minProRate=40;
                    break;
                default :
                    break;
            }
            //res_3에 대한 처리 (몸무게)
            minProtein=(minProtein)*(data.res_3)-60;
            maxProtein=(maxProtein)*(data.res_3)-60;
            
            //res_4에 대한 처리 (당뇨 여부)
            if(data.res_4=='T'){
                isDiabetes=true;
            }
            
            console.log(`귀하의 분석 결과 : `)
            if(isKidneyDisorder){
                console.log(`프로틴 제한 : ${minProteinLimit}~${maxProteinLimit}`);
            }

            console.log(`프로틴 권장 섭취량 : ${minProtein}~${maxProtein}`);
            console.log(`탄수화물 권장 비율 : ${minCarRate}%~${maxCarRate}%`);
            console.log(`단백질 권장 비율 : ${minProRate}%~${maxProRate}%`);

            const passData={
                minProteinLimit,maxProteinLimit,
                minProtein,maxProtein,
                minCarRate,maxCarRate,
                minProRate,maxProRate,
                isDiabetes,isKidneyDisorder
            };
            resolve(passData);
        })
    }

    function insertResponse(res_1,res_2,res_3,res_4){
        return new Promise((resolve,reject)=>{
            const query="INSERT INTO response SET ?";
            
            let res_user="unknown";
            if(req.session.memberNumber){
                res_user=req.session.memberNumber
            };

            const queryData={
                res_1,res_2,res_3,res_4,res_user
            };
            conn.query(query,queryData,(err,result)=>{
                if(err) throw err;
                resolve(result.insertId);
            })
        })
    }

    function selectResponse(insertId){
        return new Promise((resolve,reject)=>{
            const query=`SELECT res_1,res_2,res_3,res_4 FROM response WHERE res_id=${insertId}`;
            conn.query(query,(err,result)=>{
                if(err) throw err;
                resolve(result[0]);
            })
        })
    }

    function calRate(sumWeight,weight){
        return (weight/sumWeight)*100;
    };

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
    const m_birth_y=req.body.m_birth_y
    const m_birth_m=req.body.m_birth_m;
    const m_birth_d=req.body.m_birth_d;
    const m_sex=req.body.m_sex;
    const m_email_1=req.body.m_email_1;
    const m_email_2=req.body.m_email_2;
     
    const query='INSERT INTO member SET ?';
    const data={
        m_name,m_password,m_sex,m_id,m_email_1,m_email_2,m_birth_y,m_birth_m,m_birth_d
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
    const p_image=`/image/uploads/${req.file.originalname}`;

    const ingredient=req.body.ingredient;

    const data={
        p_name,p_brand,p_weight,
        p_flavor,p_fat,p_calorie,
        p_saturated_fat,p_trans_fat,p_cholesterol,
        p_sodium,p_corbohydrate,p_dietary_fiber,
        p_sugar,p_protein,p_image
    };

    if(typeof ingredient=='string'){

    }else{
        mappingIng(ingredient,data).catch(err=>console.log(`Error Occured During Promise_1!! ${err}`))
        .then(insertProduct).catch(err=>console.log(`Error Occured During Promise_2!! ${err}`))
        .then(insertIngredient).catch(err=>console.log(`Error Occured During Promise_3!! ${err}`))
        .then(()=>{
            res.redirect('/product/upload');
        })
    }
    function mappingIng_str(item,data){
        return new Promise((resolve,reject)=>{
            const passData={
                ingredient:item,
                data
            };

            const query=`
            SELECT * FROM (
                SELECT ing_name FROM ingredient 
                UNION
                SELECT ano_name AS ing_name FROM anotherName
            ) ING WHERE ing_name='${item}'
            `
        })
    }

    function mappingIng(list,data){
        return Promise.all(list.map(item=>{
            return new Promise((resolve,reject)=>{
                //해당 데이터가 이미 성분 테이블에 존재하는 데이터인지를 판단
                const passData={
                    ingredient:item,
                    data
                };
                const query=`
                    SELECT * FROM (
                        SELECT ing_name FROM ingredient 
                        UNION
                        SELECT ano_name AS ing_name FROM anotherName
                    ) ING WHERE ing_name='${item}'
                `;

                conn.query(query,(err,result)=>{
                    if(err) throw err;
                    //Data의 값이 0이거나 0보다 큰 경우로 분기해야 함, 아래는 해당 값이 테이블이 이미 존재할 때 INSERT 명령을 Skip
                    if(result[0]!=null){
                        resolve(passData);
                    }else{
                        //해당 값이 없을 경우, INSERT명령을 실행해야 하며, 이를 비동기적으로 처리하기 위하여 Promise내에 하나의 Promise를 더 정의
                        const query_2=`
                            INSERT INTO ingredient SET ?
                        `;
                        const query_2_data={ing_name:item,ing_type:null}
                        conn.query(query_2,query_2_data,(err,result_2)=>{
                            if(err) throw err;
                            resolve(passData);
                        })
                    }
                })
            })
        }))
    }

    function insertProduct(data){
        return new Promise((resolve,reject)=>{
            const query=`
                INSERT INTO product SET ?
            `;

            console.log(`Data in Promise_2 : ${data[0]}`);
            const queryData={
                p_name:data[0].data.p_name,
                p_brand:data[0].data.p_brand,
                p_weight:data[0].data.p_weight,
                p_flavor:data[0].data.p_flavor,
                p_fat:data[0].data.p_fat,
                p_calorie:data[0].data.p_calorie,
                p_saturated_fat:data[0].data.p_saturated_fat,
                p_trans_fat:data[0].data.p_trans_fat,
                p_cholesterol:data[0].data.p_cholesterol,
                p_sodium:data[0].data.p_sodium,
                p_corbohydrate:data[0].data.p_corbohydrate,
                p_dietary_fiber:data[0].data.p_dietary_fiber,
                p_sugar:data[0].data.p_sugar,
                p_protein:data[0].data.p_protein,
                p_image:data[0].data.p_image
            }
            const ingredient=data.map((item)=>{
                console.log(item);
                console.log(item.ingredient);
                return item.ingredient;
            });
            console.log(ingredient);

            conn.query(query,queryData,(err,result)=>{
                if(err) throw err;
                const passData={
                    ingredient,
                    p_id:result.insertId
                };
                resolve(passData);
            })
        })
    }

    function insertIngredient(data){
        return Promise.all(data.ingredient.map(item=>{
            return new Promise((resolve,reject)=>{
                console.log(item);
                const query=`
                    INSERT INTO product_ingredient SET ?
                `;
                const queryData={
                    p_id:data.p_id,
                    ing_name:item
                };
                conn.query(query,queryData,(err,result)=>{
                    if(err) throw err;
                    resolve();
                })
            })
        }))
    }
})

//DB에 등록되어 있는 모든 보충제 제품들을 보여주는 페이지, query 객체를 이용하여 페이지별로 20개씩 조회될 수 있게 함
app.get('/product',(req,res)=>{
    const page=req.query.page;
    if(req.query.sort){
        const sort=req.query.page;
    }
    
    if(req.session.loginStatus){
        //session에 memberNumber가 있을 경우(즉, 로그인 상태가 True일 경우 정의되는 쿼리)
        const query=
        `SELECT P.p_id,P.p_name,P.p_image,P.p_brand,
        (SELECT COUNT(*) FROM product_like PL WHERE P.p_id=PL.p_id) AS count_like,
        (SELECT COUNT(*) FROM product_unlike PUL WHERE P.p_id=PUL.p_id) AS count_unlike,
        (SELECT COUNT(*)>0 FROM product_like PL WHERE P.p_id=PL.p_id AND PL.m_number=${req.session.memberNumber}) AS isLike,
        (SELECT COUNT(*)>0 FROM product_unlike PUL WHERE P.p_id=PUL.p_id AND PUL.m_number=${req.session.memberNumber}) AS isUnlike,
        (SELECT COUNT(*) FROM product_cmt PC WHERE P.p_id=PC.p_id) AS count_comment
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
        (SELECT COUNT(*) FROM product_unlike PUL WHERE P.p_id=PUL.p_id) AS count_unlike,
        (SELECT COUNT(*) FROM product_cmt PC WHERE P.p_id=PC.p_id) AS count_comment
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
    const p_id=req.params.p_id;
    selectProduct(p_id).then(selectIngredient).then(selectSNS).then(selectComment);

    function selectComment(data){
        return new Promise((resolve,reject)=>{
            const query=`
                SELECT cmt_content,cmt_date FROM product_cmt WHERE p_id=${data[0].data.p_id} LIMIT 0,3 
            `;

            conn.query(query,(err,result)=>{
                const loginInfo={
                    loginStatus:req.session.loginStatus,
                    userName:req.session.userName,
                    isAdmin:req.session.isAdmin
                };
                const SNSInfo={
                    like:data[0].result[0].p_like,
                    unlike:data[1].result[0].p_unlike
                };
                const commentData={
                    result
                }                
                res.render('./product/product_info',{viewData:data[0].data,loginInfo,SNSData:SNSInfo,commentData:commentData.result})
            })
        })
    }

    function selectSNS(data){
        return Promise.all([selectGood(data),selectBad(data)]);
    ;}

    function selectGood(data){
        return new Promise((resolve,reject)=>{
            const query=`SELECT COUNT(*) AS p_like FROM product_like WHERE p_id=${data.p_id}`;
            conn.query(query,(err,result)=>{
                if(err) throw err;
                const passData={
                    data,
                    result
                };
                resolve(passData);
            })
        })
    }

    function selectBad(data){
        return new Promise((resolve,reject)=>{
            const query=`SELECT COUNT(*) AS p_unlike FROM product_unlike WHERE p_id=${data.p_id}`;
            conn.query(query,(err,result)=>{
                if(err) throw err;
                const passData={
                    data,
                    result
                }
                resolve(passData);
            })
        })
    }

    function selectIngredient(data){
        return new Promise((resolve,reject)=>{
            const query=`
                SELECT ing_name FROM product_ingredient WHERE p_id=${data.p_id}
            `;
            //여기서부터 새로 추가한 부분
            conn.query(query,(err,result)=>{
                if(err) throw err;
                let passString='';
                for(item of result){
                    if(result.indexOf(item)==result.length-1){
                        passString+=`${item.ing_name}`;
                    }else{
                        passString+=`${item.ing_name},`;
                    }
                    
                };

                data.productInfo.p_ingredient=passString;
                resolve(data.productInfo);
            })
        })
    }

    function selectProduct(p_id){
        return new Promise((resolve,reject)=>{
            const query=`SELECT * FROM product WHERE p_id=${p_id}`;
            conn.query(query,(err,result)=>{
                if(err) throw err;
                const passData={
                    productInfo:result[0],
                    p_id
                };
                resolve(passData);
            })
        })
    }
})
app.post('/ingCheck',(req,res)=>{
    const nameList=req.body.nameList;
    
    selectIngre(nameList).then(data=>{
        console.log(data);
        res.json(data);
    }).catch(err=>console.log(err));
    
    function selectIngre(nameList){
        return Promise.all(nameList.map(name=>{
            return new Promise((resolve,reject)=>{
                const query=`
                    SELECT * FROM ingredient WHERE ing_name='${name}'
                `;
                conn.query(query,(err,result)=>{
                    if(err) throw err;
                    //result[0]의 값이 있으면,
                    let data={
                        ing_name:null,
                        ing_type:null
                    };

                    if(result[0]){
                        data.ing_name=result[0].ing_name,
                        data.ing_type=result[0].ing_type    
                    }else{
                        data.ing_name=name,
                        data.ing_type=null
                    }

                    resolve(data);
                })
            })
        }))
    }
})
app.post('/product/:p_id/comment',(req,res)=>{
    const p_id=req.params.p_id;
    const m_number=req.session.memberNumber;
    const cmt_content=req.body.cmt_content;

    const query=`
        INSERT INTO product_cmt SET ?
    `;
    const queryData={
        p_id,m_number,cmt_content
    };

    conn.query(query,queryData,(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.json();
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
        const p_serving=req.body.p_serving;

        const query=`UPDATE product SET ? WHERE p_id=${p_id}`;
        
        let data={
            p_name,p_brand,
            p_weight,p_flavor,p_fat,
            p_saturated_fat,p_trans_fat,p_cholesterol,
            p_sodium,p_corbohydrate,p_dietary_fiber,
            p_sugar,p_protein,p_calorie,p_serving   
        };
    
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
            console.log(`isUnlike : ${isUnlike}`)

            const query=`SELECT count(*) COUNT FROM product_unlike WHERE p_id=${productNumber}`;
            conn.query(query,(err,result)=>{
                const data_3={
                    isUnlike,
                    COUNT:result[0].COUNT
                };
                console.log(data_3);
                res.json(data_3);
            })
        })
    }
})

app.get('/mypage',(req,res)=>{
    //로그인 한 상태이면 실행하는 분기
    if(req.session.loginStatus){
        const memberNumber=req.session.memberNumber;
        queryMemberInfo(memberNumber).then(queryLikeTable).catch(err=>console.log(`Error Occured During Promise_1 ${err}`));
    }
    
    function queryMemberInfo(memberNumber){
        return new Promise((resolve,reject)=>{
            const query=`SELECT * FROM member WHERE m_number=${memberNumber}`
            conn.query(query,(err,result)=>{
                if(err) throw err
                resolve(result[0]); 
            });
        })
    }

    function queryLikeTable(data){
        return new Promise((resolve,reject)=>{
            const query=
            `
                SELECT p_name,p_brand,p_image,p_id FROM product
                WHERE p_id IN (SELECT p_id FROM product_like WHERE m_number=${data.m_number})
                LIMIT 0,5;
            `;
            conn.query(query,(err,result)=>{
                if(err) throw err;

                const loginInfo={
                    loginStatus:req.session.loginStatus,
                    userName:req.session.userName
                }
                console.log(`Member Data : ${data}`);
                console.log(`login Info : ${loginInfo}`);
                console.log(`Like Info : ${result}`);

                res.render('mypage',{loginInfo:loginInfo,memberInfo:data,likeInfo:result});
            })
        })
    }
})

app.get('/ingredient',(req,res)=>{
    res.render('ingredient');
})

app.post('/ingredient',(req,res)=>{
    const ing_name=req.body.ing_name;
    const ano_name=req.body.ano_name;
    const ing_type=req.body.ing_type;
    
    console.log(ano_name);
    console.log(ano_name.length);
    console.log(typeof ano_name);
    console.log(typeof ano_name=='object');
    //이 부분의 Promise는 정상 작동
    //typeof ano_name=='object'일 때 동작할 Promise 분기
    if(typeof ano_name=='object'){
        insertIng(ing_name,ing_type,ano_name)
        .then(data=>{
            console.log(`Data from Promise_1 : ${data}`);
            return Promise.all(data.ano_name_list.map(ano_name=>{
                return new Promise((resolve,reject)=>{
                    const query=`INSERT INTO anotherName SET ?`;
                    const query_data={ano_name,ing_name:data.ing_name}
                    conn.query(query,query_data,(err,result)=>{
                        if(err) throw err;
                        resolve(result);
                    })
                })
            }))
        }).then(()=>{
            console.log("DONE!!");
            res.redirect('/ingredient');
        }).catch(err=>{
            console.log(`Error Occured during Promise_2! ${err}`);
        })
    }else{
        //이쪽 분기에서도 null값인지를 확인해야 함 (string.length>0?)으로 판단
        insertIng(ing_name,ing_type,ano_name)
        .then(data=>{
            console.log(`Date from Promise_1 : ${data}`);
            return new Promise((resolve,reject)=>{
                const query=`INSERT INTO anotherName SET ?`;
                const query_data={
                    ano_name:data.ano_name_list,
                    ing_name:data.ing_name}
                console.log(data.ano_name_list);
                console.log(data.ing_name);

                conn.query(query,query_data,(err,result)=>{
                    if(err) throw err;
                    resolve(result);
                })
            })
        }).then(()=>{
            console.log("DONE!!");
            res.redirect('/ingredient');
        }).catch(err=>{
            console.log(`Error Occured during Promise_2! ${err}`);
        })
    }
    
    
    //첫번째 Query_Ingredient를 입력하는 Promise
    function insertIng(ing_name,ing_type,ano_name_list){
        return new Promise((resolve,reject)=>{  
            const query_ing="INSERT INTO ingredient SET ?";
            const query_data={
                ing_name,
                ing_type
            };
            conn.query(query_ing,query_data,(err,result)=>{
                if(err) throw err;
                resolve({ing_name,ano_name_list});
            })
        })
    }
})

app.get('/product/upload/ingredient',(req,res)=>{

    queryIngData().then(mapData).catch(err=>console.log("Error Occured in Promise_1 : "+err))
    .then(data=>res.json(data)).catch(err=>console.log("Error Occured in Promise_2 "+err));

    function queryIngData(){
        return new Promise((resolve,reject)=>{
            const query=
            `
                SELECT ing_name FROM ingredient
                UNION
                SELECT ano_name AS ing_name FROM anotherName
            `;

            conn.query(query,(err,result)=>{
                if(err) throw err;
                resolve(result);
            })
        })
    }

    function mapData(data){
        return new Promise((resolve,reject)=>{
            let arr=[];
            data.map((data)=>{
                arr.push(data.ing_name);
            })
            resolve(arr);        
        })
    }
})

/*app.get('/add',(req,res)=>{
    const arr=[55,67,69,79,86,87,95];
    const ingList=['organic Sugar Cane','natural Lemon and Lime flavors','Citric Acid','Silicon Dioxide','Malic Acid','Fruit juice (color)','Stevia (leaf) extract (Stevia) (leaf)'];
    mapArray(arr,ingList).then(data=>{
        console.log(data);
        res.send("Complete!");
    })
    function mapArray(arr,ingList){
        return Promise.all(arr.map(item=>{
            return Promise.all(ingList.map(ing=>{
                return new Promise((resolve,reject)=>{
                    const query=`
                        INSERT INTO product_ingredient SET ?
                    `;
                    const queryData={
                        p_id:item,
                        ing_name:ing
                    };
                    conn.query(query,queryData,(err,result)=>{
                        if(err) throw err;
                        console.log(result);

                        resolve(result);
                    })
                })
            }))
        }))
    }
})*/

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