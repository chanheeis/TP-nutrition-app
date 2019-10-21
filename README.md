# ./web.js

### line:1
Express 프레임워크를 사용, 앱에 대한 전반적인 설정

### line:11
보충제 제품 이미지 저장을 위해 multer모듈을 사용, path모듈을 활용하여 절대 경로를 추출한 후, 절대경로/public/image/uploads 경로에 제품 이미지를 저장

### line:23
MySQL Database Server에 대한 내용을 담음, 해당 DB설정 정보는 추후 .gitignore를 통해 분리 시킬 예정

### line:31
ejs 템플릿 엔진을 활용하여 front-end를 구성하였음

### line:39
session에 대한 기본 설정

### line:51
로그인에 대한 session정보와 함께 'home'페이지를 렌더

### line:61
사용자가 세 단계에 걸친 신체 정보를 입력한 후 제출을 클릭했을 때 넘어가는 페이지

### line:86
사용자의 입력 정보를 데이터베이스에 저장, 사용자 이름을 unknown으로 먼저 설정하고, 로그인 한 유저의 응답이라면 session 정보를 불러와 해당 이름을 저장

### line:105
product테이블에 저장 돼 있는 모든 보충제 제품을 가져옴, 이 부분은 추후 효율적인 Query 작성을 통해 최적화 해야 하는 부분

### line:121
사용자의 신체 정보에 따라 단백질 섭취 한계(minProteinLimit, maxProteinLimit),최소-최대로 필요한 단백질의 양(minProtein,maxProtein), 최소-최대로 필요한 탄수화물의 비율(minCarRate,maxCarRate), 설탕 첨가 여부(isDiabetes), 신장 질환 여부(isKidneyDisorder)를 계산함

### line:141
보충제 섭취 목적에 따라 위에서 설정한 변수 값을 설정

### line:200
가져온 모든 보충제 제품 중 해당 조건에 부합하는 제품을 선별하기 위한 로직, 이 부분은 차후 효율적인 Query 작성을 통해 코드의 양을 대폭 줄일 수 있음

### line:293
회원가입 페이지로 접속했을 때 session정보와 함께 'join'페이지를 렌더

### line:301
사용자가 회원가입 정보를 정확히 입력하여 제출했을 때, DB에 해당 정보를 입력

### line:323
회원가입 시, ID 중복 여부를 체크하기 위한 라우터로, ID가 중복여부에 따라(isDuplicated의 값), boolean값과 함께 CSS색상을 전달

### line:344
로그인 성공 여부를 판단하기 위한 라우터로

### line:355
해당 ID에 해당 Password를 갖고 있는 칼럼이 있다면 사용자 정보를 session에 저장하고, 회원 번호가 0~100번이면 관리자 계정으로, 101 이상이면 일반 계정으로 판단함




