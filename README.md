# 📊 재무제표 시각화 웹 애플리케이션

Open DART API를 활용하여 기업의 재무제표를 조회하고 시각화하는 웹 애플리케이션입니다.

## 🚀 빠른 시작

### 로컬 개발
```bash
# 1. 저장소 클론
git clone https://github.com/your-username/your-repo.git
cd your-repo

# 2. 백엔드 실행
cd backend
python main.py

# 3. 프론트엔드 실행 (새 터미널)
cd frontend
npm install
npm run dev
```

### 🌐 배포하기
- **🎯 Render로 배포 (가장 쉬움!)**: [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) ⭐ 추천!
- **⚡ Railway + Vercel**: [QUICKSTART_DEPLOY.md](./QUICKSTART_DEPLOY.md)
- **📖 전체 배포 옵션**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📝 개발 과정 (사용자 요청 순서)

### 1단계: 환경 설정
**요청**: "open dart api key 를 .env 파일로 관리할래"

**구현 내용**:
- `.env` 파일 생성 및 API 키 관리 설정
- `config.py` 생성 - 환경변수 로드
- `.gitignore` 설정 - API 키 보안

**생성된 파일**:
- `.env` (사용자가 직접 생성)
- `config.py`
- `.gitignore`
- `requirements.txt`

---

### 2단계: 회사코드 다운로드
**요청**: "회사코드 다운로드 받고 해줘"

**구현 내용**:
- DART API의 고유번호(회사코드) 다운로드 스크립트 작성
- ZIP 파일 자동 다운로드 및 압축 해제
- XML 파싱하여 회사 정보 추출

**생성된 파일**:
- `download_corp_code.py`

**실행 방법**:
```bash
python download_corp_code.py
```

---

### 3단계: 재무제표 시각화 웹앱 구축
**요청**: "재무제표를 시각화하는 웹 어플리케이션을 만들고 싶어. react와 fastAPI를 활용해서 만들어 줘"

**구현 내용**:
- **데이터베이스**: SQLite로 회사코드 관리
- **백엔드**: FastAPI 서버 구축
  - 회사 검색 API
  - 재무제표 조회 API
  - 보고서 코드 목록 API
- **프론트엔드**: React + Vite
  - 회사 검색 컴포넌트
  - 재무제표 시각화 컴포넌트 (Recharts)
  - 반응형 디자인

**생성된 파일**:
- `init_db.py` - 데이터베이스 초기화
- `backend/main.py` - FastAPI 서버
- `frontend/` - React 프로젝트 전체
  - `src/App.jsx`
  - `src/components/CompanySearch.jsx`
  - `src/components/FinancialStatementViewer.jsx`
  - CSS 파일들

---

### 4단계: 검색 오류 수정
**요청**: "화면은 나왔는데. 검색 중 오류가 발생했다고 나오는데"

**문제 원인**:
- 데이터베이스 미초기화
- `stock_code`가 공백(' ')으로 저장되어 쿼리 실패

**해결 방법**:
- `init_db.py` 실행하여 DB 초기화
- 백엔드 쿼리 수정: `LENGTH(TRIM(stock_code)) = 6` 조건 추가
- 6자리 숫자만 검색하도록 `GLOB` 패턴 적용

---

### 5단계: 숫자 가독성 및 연도 표시 개선
**요청**: "1. 숫자 단위가 보기가 힘들어 쉽게 읽을 수 있게 해줘. 2. 당기와 전기가 언제인지 알기 힘들어 이 부분 수정해줘"

**구현 내용**:
- **숫자 포맷팅**: 조/억/만원 단위로 자동 변환
  - 예: `175.00조원`, `1234억원`, `5678만원`
- **연도 표시**: 날짜에서 연도 추출하여 표시
  - "당기" → "2024"
  - "전기" → "2023"
  - "전전기" → "2022"

**수정된 파일**:
- `frontend/src/components/FinancialStatementViewer.jsx`

---

### 6단계: Apple 스타일 UI 디자인
**요청**: "전반적으로 UI 개선을 했으면 해. apple 스타일로 해줘. silver, 회색, gold와 하얀색을 섞어서 만들어줘"

**구현 내용**:
- **색상 팔레트**:
  - 🥈 Silver: `#a8a8a8`, `#c0c0c0`
  - ⚫ Gray: `#1d1d1f`, `#6e6e73`, `#86868b`
  - 🥇 Gold: `#d4af37`, `#b8860b`
  - ⚪ White: 반투명 배경
- **디자인 요소**:
  - Backdrop filter (블러 효과)
  - 부드러운 그라데이션
  - 둥근 모서리 (20-30px)
  - SF Pro Display 스타일 폰트
  - 음수 letter-spacing
  - 부드러운 애니메이션

**수정된 파일**:
- `frontend/src/index.css`
- `frontend/src/App.css`
- `frontend/src/components/CompanySearch.css`
- `frontend/src/components/FinancialStatementViewer.css`
- `frontend/src/components/FinancialStatementViewer.jsx` (차트 색상)

---

### 7단계: 재무제표 구분 표시
**요청**: "상세 데이터 표시할 때 재무상태표와 손익계산서를 구분해서 보여줘. 색깔도 구분해줘"

**구현 내용**:
- **재무상태표 (BS)**: Gold 테마
  - 헤더: Gold 그라데이션
  - Hover: Gold 하이라이트
- **손익계산서 (IS)**: Gray 테마
  - 헤더: Gray 그라데이션
  - Hover: Gray 하이라이트
- 두 개의 독립된 테이블로 분리

**수정된 파일**:
- `frontend/src/components/FinancialStatementViewer.jsx`
- `frontend/src/components/FinancialStatementViewer.css`

---

### 8단계: Gemini AI 재무제표 설명 기능
**요청**: "GEMINI API KEY를 사용해서 재무제표를 쉽게 설명해주었으면 해"

**구현 내용**:
- **Gemini 2.0 Flash** 모델 통합
- `.env`에 `GEMINI_API_KEY` 추가
- 고등학생도 이해할 수 있는 재무제표 해설
- 구조화된 설명 형식:
  - 회사 재무 상태 한눈에 보기 (신호등 평가)
  - 핵심 용어 쉽게 이해하기
  - 주요 재무비율 분석 (공식 포함)
  - 전년 대비 변화 분석
  - 고등학생을 위한 투자 가이드

**생성/수정된 파일**:
- `config.py` - GEMINI_API_KEY 추가
- `backend/main.py` - `/api/explain-financial-statement` 엔드포인트 추가
- `frontend/src/components/FinancialStatementViewer.jsx` - AI 설명 버튼 및 UI
- `requirements.txt` - `google-generativeai` 추가

---

### 9단계: 재무비율 분석 추가
**요청**: "중요한 재무비율분석(부채비율과 ROE)이나 수익성 지표 등도 표로 정리하고 시각화해줘"

**구현 내용**:
- **5가지 핵심 재무비율** 계산 및 시각화:
  1. **부채비율** = (부채총계 ÷ 자본총계) × 100
  2. **ROE** = (당기순이익 ÷ 자본총계) × 100
  3. **유동비율** = (유동자산 ÷ 유동부채) × 100
  4. **영업이익률** = (영업이익 ÷ 매출액) × 100
  5. **순이익률** = (당기순이익 ÷ 매출액) × 100
- 막대 차트 및 상세 테이블로 3개년 비교

**수정된 파일**:
- `frontend/src/components/FinancialStatementViewer.jsx`
- `frontend/src/components/FinancialStatementViewer.css`

---

### 10단계: 주가 데이터 및 AI 투자 분석
**요청**: (암묵적) "주식 데이터와 결합한 종합 분석이 필요해"

**구현 내용**:
- **yfinance** 라이브러리로 주가 데이터 수집
- 1년간 주가 추이 및 거래량 차트
- 52주 최고/최저가, 변동률 통계
- **AI 종합 투자 분석**:
  - 재무제표 핵심 분석
  - 주가 트렌드 분석
  - 재무제표 vs 주가 괴리도 분석
  - 종합 투자 의견 (매수/보유/매도)
  - 목표가 및 투자 전략
  - 리스크 요인

**생성/수정된 파일**:
- `backend/main.py` - `/api/stock-price`, `/api/investment-analysis` 엔드포인트
- `frontend/src/components/FinancialStatementViewer.jsx` - 주가 차트 및 투자 분석 UI
- `requirements.txt` - `yfinance`, `pandas` 추가

---

### 11단계: 배포 준비
**요청**: "나 이 서비스를 배포하고 싶어"

**구현 내용**:
- **배포 옵션 문서화**:
  - Railway (백엔드)
  - Vercel (프론트엔드)
  - Docker / Docker Compose
- **배포 설정 파일** 생성:
  - `railway.toml` - Railway 설정
  - `frontend/vercel.json` - Vercel 설정
  - `Dockerfile` - Docker 이미지 빌드
  - `docker-compose.yml` - 로컬 통합 배포
- **CORS 설정** 개선
- **환경 변수 관리**

**생성된 파일**:
- `DEPLOYMENT.md` - 전체 배포 가이드
- `QUICKSTART_DEPLOY.md` - 빠른 배포 가이드
- `railway.toml`
- `frontend/vercel.json`
- `Dockerfile`
- `docker-compose.yml`
- `env.example`

---

### 12단계: Render 통합 배포로 전환
**요청**: "RENDER를 통해서 배포하는게 가장 쉽다고 하는데 RENDER로 배포하게 해줘"

**구현 내용**:
- **Docker 기반 Render 배포**:
  - 프론트엔드 + 백엔드 단일 서비스 통합
  - Node.js를 포함한 멀티 스테이지 Docker 빌드
  - 정적 파일 자동 서빙
- **자동 초기화**:
  - 컨테이너 시작 시 회사 코드 다운로드
  - 데이터베이스 자동 생성
  - uvicorn으로 서버 시작

**생성/수정된 파일**:
- `render.yaml` - Render Blueprint 설정
- `build.sh` - 빌드 스크립트
- `Dockerfile` - 멀티 스테이지 빌드로 개선
- `backend/main.py` - StaticFiles 서빙 추가
- `RENDER_DEPLOY.md` - Render 배포 가이드
- `STEP_BY_STEP_RENDER.md` - 단계별 배포 가이드

**실행 명령**:
```bash
# GitHub에 푸시
git add .
git commit -m "Deploy to Render"
git push origin main

# Render에서 자동 배포 시작
```

---

### 13단계: API 라우트 우선순위 수정
**문제**: Render 배포 후 API가 404 오류 발생

**원인**:
- FastAPI의 catch-all 라우트 `/{full_path:path}`가 API 라우트보다 먼저 정의됨
- 모든 `/api/*` 요청이 정적 파일 서빙에 가로채짐

**해결 방법**:
- 정적 파일 서빙 로직을 **파일 맨 끝**으로 이동
- API 라우트가 먼저 매칭되도록 순서 조정

**수정된 파일**:
- `backend/main.py` - 라우트 정의 순서 변경

---

### 14단계: 재무상태표 박스 시각화
**요청**: "재무상태표를 박스형태로 나타내고 싶은데. 자산 = 부채 + 자본으로 나타내고 싶어. 금액에 따라서 박스 높이가 조절되었으면 좋겠어"

**구현 내용**:
- **좌측 박스 (자산)**:
  - 🟡 유동자산 (밝은 금색)
  - 🟠 비유동자산 (진한 금색)
- **우측 박스 (부채 + 자본)**:
  - 🔴 유동부채 (밝은 빨강)
  - 🔴 비유동부채 (진한 빨강)
  - 🟢 자본총계 (녹색)
- **가운데 등호 (=)**: 애니메이션 펄스 효과
- **동적 높이**: 금액 비율에 따라 박스 높이 자동 조절
- **호버 효과**: 마우스 올리면 밝아지고 떠오름

**생성/수정된 파일**:
- `frontend/src/components/FinancialStatementViewer.jsx` - 박스 시각화 컴포넌트
- `frontend/src/components/FinancialStatementViewer.css` - 박스 스타일링

---

### 15단계: 손익계산서 박스 시각화 및 연도별 선택
**요청**: "1. 손익계산서는 보고서 형태처럼 수익, 비용, 이익 형태를 추가해줘. 2. 각 년도별로 선택할 수 있게 해줘"

**구현 내용**:
- **손익계산서 박스 시각화 (3박스 구조)**:
  - **좌측 (수익)**: 매출액 + 영업외수익 (녹색 그라데이션)
  - **중앙 (비용)**: 매출원가 + 판관비 + 영업외비용 (빨강 그라데이션)
  - **우측 (이익)**: 영업이익 + 당기순이익 (파랑 그라데이션)
  - **수식**: 수익 - 비용 = 이익
- **연도별 선택 기능**:
  - 드롭다운으로 연도 선택 (연결/당기/전기/전전기)
  - 선택한 연도에 따라 차트 및 박스 시각화 자동 업데이트
  - 모든 시각화 요소가 동기화
- **반응형 디자인**: 모바일에서는 세로 배치로 자동 전환

**수정된 파일**:
- `frontend/src/components/FinancialStatementViewer.jsx`:
  - `prepareBalanceSheetBoxData()` - 연도별 파라미터 추가
  - `prepareIncomeStatementBoxData()` - 손익계산서 박스 데이터
  - `selectedChartYear` state 추가
  - 연도 선택 드롭다운 추가
- `frontend/src/components/FinancialStatementViewer.css`:
  - `.income-statement-box-container` - 손익계산서 박스 스타일
  - `.year-select` - 연도 선택 드롭다운 스타일
  - 반응형 미디어 쿼리 추가

---

## 🛠 기술 스택

- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: React 18 + Vite 5
- **Database**: SQLite
- **Charts**: Recharts 2.10
- **API**: 
  - Open DART API (재무 데이터)
  - Google Gemini 2.0 Flash (AI 설명)
  - yfinance (주가 데이터)
- **Styling**: Custom CSS (Apple 스타일)
- **Deployment**: Docker, Render

---

## 📁 프로젝트 구조

```
vibecoding_finance/
├── backend/
│   └── main.py                           # FastAPI 서버
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CompanySearch.jsx         # 회사 검색
│   │   │   ├── CompanySearch.css
│   │   │   ├── FinancialStatementViewer.jsx  # 재무제표 시각화
│   │   │   └── FinancialStatementViewer.css
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── config.py                             # 환경변수 설정
├── download_corp_code.py                 # 회사코드 다운로드
├── init_db.py                            # DB 초기화
├── requirements.txt                      # Python 패키지
├── .env                                  # 환경변수 (직접 생성)
├── .gitignore
└── dart.db                              # SQLite DB (자동 생성)
```

---

## 🚀 설치 및 실행 가이드

### 사전 준비

1. **Python 3.13** 설치
2. **Node.js** 설치
3. **Open DART API 키** 발급 (https://opendart.fss.or.kr/)

### 1단계: 환경 설정

프로젝트 루트에 `.env` 파일 생성:

```env
# 필수: Open DART API 키
DART_API_KEY=your_dart_api_key_here

# 선택: Gemini AI 재무제표 설명 기능 (없으면 AI 기능 비활성화)
GEMINI_API_KEY=your_gemini_api_key_here
```

**API 키 발급 방법**:
- **DART API**: https://opendart.fss.or.kr/ → 로그인 → API 키 발급
- **Gemini API**: https://aistudio.google.com/app/apikey → API 키 생성

### 2단계: 백엔드 설정

```bash
# Python 패키지 설치
pip install -r requirements.txt

# 회사코드 다운로드 (CORPCODE.xml, corpCode.zip 생성)
python download_corp_code.py

# 데이터베이스 초기화 (dart.db 생성)
python init_db.py
```

**예상 출력**:
```
데이터베이스 초기화 시작...
✓ 데이터베이스 테이블 생성 완료
XML 파싱 중...
✓ 114147개 회사 정보 DB에 저장 완료
✓ 상장회사: 3901개
✓ 데이터베이스 초기화 완료!
```

### 3단계: 프론트엔드 설정

```bash
cd frontend
npm install
```

### 4단계: 서버 실행

**터미널 1 - 백엔드 서버 (필수)**

```bash
cd backend
python main.py
```

✅ 서버 실행 확인: http://localhost:8000

**터미널 2 - 프론트엔드 (필수)**

```bash
cd frontend
npm run dev
```

✅ 웹앱 실행 확인: http://localhost:3000 (또는 3002)

---

## 🎯 주요 기능

### 1. 회사 검색
- 실시간 자동완성 검색
- 상장회사만 검색 (종목코드 6자리)
- 회사명, 종목코드, 고유번호 표시

### 2. 재무제표 조회
- **연도 선택**: 2015년 ~ 현재
- **보고서 유형**:
  - 사업보고서 (11011)
  - 반기보고서 (11012)
  - 1분기보고서 (11013)
  - 3분기보고서 (11014)

### 3. 시각화 📊
- **재무상태표 차트**: 자산/부채/자본 (막대 차트)
- **손익계산서 차트**: 매출/영업이익/순이익 (라인 차트)
- **재무비율 차트**: 부채비율, ROE, 유동비율, 영업이익률, 순이익률
- **박스 다이어그램**:
  - 재무상태표: 자산 = 부채 + 자본 (유동/비유동 구분)
  - 손익계산서: 수익 - 비용 = 이익 (구조적 표현)
  - 금액 비례 높이, 호버 효과, 애니메이션
- **연도별 선택**: 연결/당기/전기/전전기 선택 가능
- **상세 테이블**: 재무상태표/손익계산서 구분 표시

### 4. AI 기능 🤖
- **Gemini AI 재무제표 설명**:
  - 고등학생도 이해 가능한 쉬운 설명
  - 재무 상태 신호등 평가 (🟢🟡🔴)
  - 핵심 용어 및 공식 해설
  - 전년 대비 변화 분석
  - 투자 가이드 제공
- **AI 종합 투자 분석**:
  - 재무제표 + 주가 데이터 통합 분석
  - 투자 등급 (매수/보유/매도)
  - 목표가 및 투자 전략
  - 리스크 요인 분석

### 5. 주가 데이터 📈
- 1년간 주가 추이 차트
- 거래량 차트
- 52주 최고/최저가
- 변동률 통계

### 6. UI/UX ✨
- Apple 스타일 디자인 (Silver, Gray, Gold, White)
- 반응형 레이아웃 (모바일/태블릿/데스크톱)
- 부드러운 애니메이션 및 전환 효과
- 숫자 가독성 (조/억/만원 단위)
- 실제 연도 표시
- 호버 효과 및 인터랙션

---

## 📡 API 엔드포인트

### 1. 회사 검색
```
GET /api/companies/search?query={회사명}
```

**응답 예시**:
```json
[
  {
    "corp_code": "00126380",
    "corp_name": "삼성전자",
    "stock_code": "005930",
    "modify_date": "20250320"
  }
]
```

### 2. 재무제표 조회
```
GET /api/financial-statement?corp_code={고유번호}&bsns_year={연도}&reprt_code={보고서코드}
```

### 3. 보고서 코드 목록
```
GET /api/report-codes
```

### 4. AI 재무제표 설명
```
POST /api/explain-financial-statement
Body: {
  "company_name": "삼성전자",
  "year": "2024",
  "financial_data": { ... }
}
```

### 5. 주가 데이터 조회
```
GET /api/stock-price?stock_code={종목코드}&period={기간}
```

### 6. AI 투자 분석
```
POST /api/investment-analysis
Body: {
  "company_name": "삼성전자",
  "stock_code": "005930",
  "year": "2024",
  "financial_data": { ... },
  "stock_data": { ... }
}
```

---

## ⚠️ 주의사항

1. **데이터 제공 범위**: DART API는 2015년 이후 데이터만 제공
2. **API 요청 제한**: 일반적으로 20,000건/일
3. **회사코드 업데이트**: 정기적으로 `download_corp_code.py` 재실행 권장
4. **.env 파일**: Git에 절대 커밋하지 마세요 (이미 .gitignore에 등록됨)
5. **포트 충돌**: 8000번(백엔드), 3000번(프론트엔드) 포트가 사용 중이면 변경 필요

---

## 🐛 문제 해결

### 검색이 안 돼요
```bash
python init_db.py  # DB 재초기화
```

### 백엔드 서버가 안 켜져요
- 8000번 포트 사용 중인지 확인
- Python 패키지 설치 확인: `pip install -r requirements.txt`

### 프론트엔드가 안 켜져요
- Node.js 설치 확인
- `cd frontend && npm install` 재실행

### API 키 오류
- `.env` 파일이 프로젝트 루트에 있는지 확인
- DART_API_KEY 값이 올바른지 확인

---

## 📸 스크린샷

- 🎨 Apple 스타일 디자인 (Silver, Gray, Gold, White)
- 📊 재무상태표 막대 차트 (Gold 테마)
- 💰 손익계산서 라인 차트 (Gray 테마)
- 📋 구분된 상세 테이블 (색상 구분)

---

## 📄 라이선스

이 프로젝트는 개인 학습 및 연구 목적으로 제작되었습니다.
데이터 출처: 금융감독원 전자공시시스템(DART)
