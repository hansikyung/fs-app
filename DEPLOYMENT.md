# 🚀 배포 가이드

## 📋 목차
1. [배포 전 준비사항](#배포-전-준비사항)
2. [백엔드 배포 (Railway)](#백엔드-배포-railway)
3. [프론트엔드 배포 (Vercel)](#프론트엔드-배포-vercel)
4. [환경 변수 설정](#환경-변수-설정)
5. [배포 후 확인사항](#배포-후-확인사항)

---

## 배포 전 준비사항

### 1. 필수 계정 생성
- [ ] [GitHub 계정](https://github.com) (코드 저장소)
- [ ] [Railway 계정](https://railway.app) (백엔드 배포 - 무료)
- [ ] [Vercel 계정](https://vercel.com) (프론트엔드 배포 - 무료)

### 2. API 키 준비
- [ ] Open DART API Key
- [ ] Google Gemini API Key

### 3. 코드 GitHub에 업로드
```bash
# Git 초기화 (이미 되어있지 않은 경우)
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit - 재무제표 시각화 서비스"

# GitHub 저장소 생성 후 연결
git remote add origin https://github.com/your-username/your-repo-name.git

# 푸시
git push -u origin main
```

---

## 백엔드 배포 (Railway)

### 1. Railway 프로젝트 생성

1. [Railway 대시보드](https://railway.app/dashboard) 접속
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. 저장소 선택

### 2. 환경 변수 설정

Railway 프로젝트 설정에서 다음 환경 변수 추가:

```
DART_API_KEY=your_dart_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Railway 설정 파일 생성

프로젝트에 `railway.toml` 파일이 자동으로 생성됩니다.

### 4. 백엔드 URL 확인

배포 완료 후 Railway에서 제공하는 URL 확인 (예: `https://your-app.railway.app`)

---

## 프론트엔드 배포 (Vercel)

### 1. Vercel 프로젝트 생성

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. "Add New Project" 클릭
3. GitHub 저장소 선택
4. Root Directory: `frontend` 설정
5. Framework Preset: `Vite` 선택

### 2. 환경 변수 설정

Vercel 프로젝트 설정에서 환경 변수 추가:

```
VITE_API_URL=https://your-railway-backend-url.railway.app
```

### 3. 빌드 설정

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 4. 배포

"Deploy" 버튼 클릭 후 자동 배포 시작

---

## 프론트엔드 코드 수정

### `frontend/vite.config.js` 수정

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

### `frontend/src/axios-config.js` 생성 (API 요청 설정)

```javascript
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

axios.defaults.baseURL = API_URL

export default axios
```

---

## 백엔드 프로덕션 설정

### `backend/main.py` CORS 설정 수정

```python
# CORS 설정 (배포된 프론트엔드 URL 추가)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://your-vercel-app.vercel.app",  # Vercel URL 추가
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 대체 배포 방법

### Option 1: Render (백엔드 + 프론트엔드 통합)

**장점**: 무료, 간단한 설정
**단점**: 속도가 Railway보다 느릴 수 있음

1. [Render 대시보드](https://dashboard.render.com) 접속
2. "New Web Service" 클릭
3. GitHub 저장소 연결
4. 환경 변수 설정
5. 자동 배포

### Option 2: Heroku

**장점**: 안정적, 유명함
**단점**: 무료 플랜 제한

```bash
# Heroku CLI 설치 후
heroku create your-app-name
git push heroku main
```

### Option 3: Docker + AWS/GCP

**장점**: 완전한 제어, 확장성
**단점**: 설정 복잡, 비용 발생 가능

---

## 데이터베이스 고려사항

### 현재 상태 (SQLite)
- ✅ 간단, 별도 설정 불필요
- ❌ 배포 시 재시작마다 초기화 가능
- ❌ 동시 접속 제한

### 프로덕션 권장 (PostgreSQL)

Railway에서 PostgreSQL 추가:
1. Railway 프로젝트에서 "New" → "Database" → "PostgreSQL" 추가
2. 연결 정보를 환경 변수로 자동 설정됨
3. SQLAlchemy 등으로 DB 연결 코드 수정 필요

---

## 배포 후 확인사항

### ✅ 체크리스트

- [ ] 백엔드 API가 정상 작동하는지 확인
  - `https://your-backend-url/` 접속 → 응답 확인
  - `https://your-backend-url/api/report-codes` → JSON 응답 확인

- [ ] 프론트엔드가 정상 작동하는지 확인
  - 회사 검색 기능
  - 재무제표 조회
  - AI 설명 생성
  - 차트 표시

- [ ] API 키가 올바르게 설정되었는지 확인
  - Open DART API 호출 성공
  - Gemini API 호출 성공

- [ ] CORS 설정 확인
  - 브라우저 콘솔에 CORS 에러가 없는지 확인

---

## 비용 예상

### 무료 플랜으로 시작

| 서비스 | 무료 플랜 | 제한사항 |
|--------|----------|---------|
| **Railway** | $5 무료 크레딧/월 | 실행 시간 제한 |
| **Vercel** | 무료 | 대역폭 100GB/월 |
| **PostgreSQL (Railway)** | $5 크레딧 포함 | 저장 공간 제한 |

### 월 예상 비용 (유료 전환 시)
- Railway (백엔드): $5~$10
- Vercel Pro (선택사항): $20
- **총 예상: $5~$30/월**

---

## 문제 해결

### 1. 백엔드 배포 실패
```bash
# 로그 확인
railway logs

# 환경 변수 확인
railway variables
```

### 2. 프론트엔드 빌드 실패
- `package.json` 확인
- Node.js 버전 확인 (18.x 이상 권장)
- `.env` 파일 설정 확인

### 3. API 연결 실패
- CORS 설정 확인
- 백엔드 URL이 올바른지 확인
- 방화벽 설정 확인

---

## 추가 리소스

- [Railway 문서](https://docs.railway.app)
- [Vercel 문서](https://vercel.com/docs)
- [FastAPI 배포 가이드](https://fastapi.tiangolo.com/deployment/)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html)

---

## 다음 단계

1. ✅ 코드를 GitHub에 푸시
2. ✅ Railway에서 백엔드 배포
3. ✅ Vercel에서 프론트엔드 배포
4. ✅ 환경 변수 설정
5. ✅ 테스트 및 확인
6. 🎉 서비스 시작!

---

**질문이나 문제가 있으면 언제든지 물어보세요!** 🚀
