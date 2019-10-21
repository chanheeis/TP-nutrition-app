let idCheckResult=false;
let pwCheckResult=false;
function IDCheck(){
    const m_id=document.getElementById("m_id").value;
    const m_id_result=document.getElementById("m_id_result");
    
    const idLength=m_id.length>3?true:false;
    if(!idLength){
        m_id_result.innerHTML="ID를 4자리 이상으로 구성해주세요.";
    }

    const idCombination=/^([0-9a-zA-Z]+)$/.test(m_id);
    if(!idCombination){
        m_id_result.innerHTML="숫자와 영문으로 조합된 10자리로 구성하세요.";
        m_id_result.style.color="red";
    }

    if(idLength){
        if(idCombination){
            const url=`/id_check?id=${m_id}`;
            const xhr=new XMLHttpRequest();
            xhr.open('GET',url);
            xhr.onreadystatechange=()=>{
                if(xhr.readyState==4&&xhr.status==200){
                    const data=JSON.parse(xhr.responseText);                    
                    if(data.isDuplicated){
                        m_id_result.innerHTML="ID가 중복됩니다.";
                        m_id_result.style.color="red";
                    }else{
                        m_id_result.innerHTML="사용가능한 ID입니다.";
                        m_id_result.style.color="blue";
                        idCheckResult=true;
                    }
                }
            }
            xhr.send();
        }
    }
}

function passwordCheck(){
    const m_password=document.getElementById("m_password").value;
    const m_password_check=document.getElementById("m_password_check").value;

    const pwLength= m_password.length>3 ? true :false ;
    const pwCorrect= m_password===m_password_check? true : false
    const pwCombination=/^([0-9a-zA-Z]+)$/.test(m_password);

    const m_password_result=document.getElementById("m_password_result");
    if(pwLength){
        if(!pwCombination){
            m_password_result.innerHTML="PW를 숫자또는 영문으로 입력하세요";
            m_password_result.style.color="red";
        }else if(!pwCorrect){
            m_password_result.innerHTML="PW가 일치하지 않습니다.";
            m_password_result.style.color="red";
        }else if(pwCombination&&pwCorrect){
            m_password_result.innerHTML="PW 확인이 통과되었습니다.";
            m_password_result.style.color="blue";
            pwCheckResult=true;
        }
    }else{
        m_password_result.innerHTML="비밀번호를 4자리 이상으로 구성해주세요.";
    }
}      

function submitCheck(){
    if(!idCheckResult || !pwCheckResult){
        alert("ID와 PW를 체크하세요.");
        return false;
    }else{
        return true;
    }
}