<h1 align="center">🔐 Security QA Testing Playground</h1>

<p align="center">
보안 중심 QA 테스트 케이스 작성 및 자동화 테스트 포트폴리오 프로젝트
</p>

<p align="center">
  <img src="https://img.shields.io/badge/QA-Testing-blue">
  <img src="https://img.shields.io/badge/Security-Testing-red">
  <img src="https://img.shields.io/badge/Automation-Selenium-green">
  <img src="https://img.shields.io/badge/Python-Test-yellow">
</p>

---

# 📌 Project Introduction

이 프로젝트는 **보안 취약점 테스트와 QA 자동화 연습을 위한 웹 테스트 환경**입니다.

실제 서비스에서 발생할 수 있는 보안 이슈를 기반으로 다음을 수행합니다.

- 취약점 검증 테스트
- python 기반 자동화 테스트
- QA 포트폴리오 구축

---
# 📂 Project Structure

project-root/  
├─ src/ # 애플리케이션 소스 코드  
├─ test/ # pytest 기반 테스트 코드  
│  
├─ .env.example # 환경 변수 예시 파일  
├─ .gitignore # git 제외 파일 설정  
├─ README.md # 프로젝트 설명 문서  
├─ index.html # 메인 HTML 파일  
├─ metadata.json # 보안 관리 시스템 메타데이터  
├─ package.json # npm 의존성 및 스크립트  
├─ package-lock.json # 패키지 버전 잠금  
├─ tsconfig.json # TypeScript 설정  
└─ vite.config.ts # Vite 빌드 설정


# 🎯 Project Goals

✔ 자동화 테스트 프레임워크 구축  
✔ QA 엔지니어 포트폴리오 제작  

---

# 🧪 Test Coverage

| Category | Description |
|--------|-------------|
| Authentication | 로그인 및 인증 테스트 |
| Authorization | 권한 검증 테스트 |
| Input Validation | 입력값 검증 |
| Session Management | 세션 관리 테스트 |
| Data Exposure | 개인정보 노출 여부 |

---

# 웹 첫 화면
<img width="1374" height="1137" alt="Image" src="https://github.com/user-attachments/assets/8e58d011-fc6c-4962-8c40-33b37ce780d3" />

# 테스트 코드 활성화
- TestCode는 Sucess 5개, Fail 1개 총 6개로 구성
<img width="1680" height="1050" alt="Image" src="https://github.com/user-attachments/assets/1a18d3a4-c976-47d1-b4b7-c41cd065a8ae" />

# 테스트 결과 로그 저장
- 로그 내용은 검증시작시간, 검증타이틀, 결과, 검증시간, 오류메세지로 구성
- 로그는 폴더 내의 reports폴더를 만들고 내부에 저장되도록 구성
<img width="1095" height="362" alt="Image" src="https://github.com/user-attachments/assets/9171ce4c-53f7-45c7-a37e-6b5a4ac843e3" />
<img width="1541" height="727" alt="Image" src="https://github.com/user-attachments/assets/9d69a69a-29d3-47ff-adc0-ff97ae7b5aa2" />

# 테스트 오류 스크린샷
- 테스트 결과가 FAIL로 반환되면 감지하여 스크린샷 (아래는 실제로 찍힌 스크린샷을 확대한 사진)
- 스크린샷은 폴더 내의 screenshots폴더를 만들고 내부에 저장되도록 구성
<img width="1180" height="315" alt="Image" src="https://github.com/user-attachments/assets/e62338a8-7b11-4c81-b92e-1631a3da244c" />
<img width="1275" height="766" alt="Image" src="https://github.com/user-attachments/assets/cceb19fe-7c1b-4c37-9b4f-ffe941fbbcd2" />

# 테스트 환경에서 실제로 동작되는 웹페이지
<img width="1374" height="1137" alt="Image" src="https://github.com/user-attachments/assets/088476a7-3f10-4a3a-8cee-e54d10acf9f6" />
<img width="1374" height="1137" alt="Image" src="https://github.com/user-attachments/assets/fed55b78-1ea1-4eae-910e-becae06ef900" />
<img width="1374" height="1137" alt="Image" src="https://github.com/user-attachments/assets/58e50687-57ca-446f-a0bc-effab1cc9e02" />
<img width="1374" height="1137" alt="Image" src="https://github.com/user-attachments/assets/de2168cd-e977-44b8-b971-a2dac06cbd1d" />
<img width="1374" height="1137" alt="Image" src="https://github.com/user-attachments/assets/9c68e74d-bc61-4a71-a482-a5ddd00d81cd" />
