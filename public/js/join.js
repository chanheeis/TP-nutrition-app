
//Flag_1은 ID_Check, Flag_2는 PW_Check 결과를 의미
let flag_1=false;
let flag_2=false;

function IDCheck(){
    const m_id=document.getElementById("m_id").value;
    const m_id_result=document.getElementById("m_id_result");

    //ID의 숫자, 영문조합을 판단하기 위한 조건, 해당 조건이 충족되야 AJAX요청으로 넘어갈 수 있음
    let cond=true;

    for(let index=0;index<m_id.length;index++){
        let temp=m_id[index].charCodeAt(0);
        if((temp>=48 && temp<=57)||(temp>=65&&temp<=90)||(temp>=97&&temp<=122)){
            continue;
        }
        cond=false;
        m_id_result.innerHTML="숫자와 영문으로 조합된 10자리로 구성하세요.";
        m_id_result.style.color="red";
        break;
    }

    console.log(cond);

    //Server로부터 해당 ID의 중복여부를 판단하기 위한 AJAX요청 코드
    if(cond){
        const url=`/id_check?id=${m_id}`;
        const xhr=new XMLHttpRequest();
        xhr.open('GET',url);
        xhr.onreadystatechange=()=>{
            if(xhr.readyState==4&&xhr.status==200){
                const data=JSON.parse(xhr.responseText);
                
                if(data.isDuplicated){
                    //ID가 중복되는 경우의 처리
                    m_id_result.innerHTML="ID가 중복됩니다.";
                    m_id_result.style.color="red";
                }else{
                    //ID가 중복되지 않는 경우의 처리
                    m_id_result.innerHTML="사용가능한 ID입니다.";
                    m_id_result.style.color="blue";
                    flag_1=true;
                }
            }
        }
        xhr.send();
    }
}

function passwordCheck(){
    const m_password=document.getElementById("m_password").value;
    const m_password_check=document.getElementById("m_password_check").value;

    //cond_1은 숫자,영문 조합을 판단하고, cond_2는 두개의 비밀번호 상호 일치여부를 판단하는 변수
    let cond_1=true;
    let cond_2=false;

    for(let index=0;index<m_password.length;index++){
        let temp=m_password[index].charCodeAt(0);
        if((temp>=48 && temp<=57)||(temp>=65&&temp<=90)||(temp>=97&&temp<=122)){
            continue;
        }
        cond_1=false;
        console.log("cond_1 Changed!!");
        break;
    }

    if(m_password===m_password_check){
        cond_2=true;
        console.log("cond_2 Changed!!");
    }

    const m_password_result=document.getElementById("m_password_result");
    
    if(!cond_1){
        m_password_result.innerHTML="PW를 숫자또는 영문으로 입력하세요";
        m_password_result.style.color="red";
    }else if(!cond_2){
        m_password_result.innerHTML="PW가 일치하지 않습니다.";
        m_password_result.style.color="red";
    }else if(cond_1&&cond_2){
        m_password_result.innerHTML="PW 확인이 통과되었습니다.";
        m_password_result.style.color="blue";
        flag_2=true;
    }
}      

function submitCheck(){
    console.log(`Flag 1 : ${flag_1}, Flag 2 : ${flag_2}`);
    if(!flag_1 || !flag_2){
        alert("ID와 PW를 체크하세요.");
        return false;
    }else{
        return true;
    }
}