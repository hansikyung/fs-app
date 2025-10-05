# 🚀 Render로 배포하기 (가장 쉬운 방법!)

Render를 사용하면 **단 5분**만에 무료로 배포할 수 있습니다!

## ✨ Render의 장점

- ✅ **완전 무료** (시작 플랜)
- ✅ **백엔드 + 프론트엔드 통합** 배포
- ✅ **자동 HTTPS** 제공
- ✅ **GitHub 연동** 자동 배포
- ✅ **PostgreSQL 무료** 제공
- ✅ **설정 파일 자동 인식**

---

## 📋 사전 준비

### 1. 필요한 계정
- [ ] [GitHub 계정](https://github.com)
- [ ] [Render 계정](https://render.com) (GitHub으로 가입 가능)

### 2. API 키 준비
- [ ] Open DART API Key
- [ ] Google Gemini API Key

---

## 🎯 배포 단계 (5분!)

### Step 1: GitHub에 코드 업로드 (2분)

```bash
# 1. Git 초기화 (이미 되어있지 않은 경우)
git init

# 2. 모든 파일 추가
git add .

# 3. 커밋
git commit -m "재무제표 시각화 서비스 - Render 배포 준비"

# 4. GitHub에서 새 저장소 생성 후 연결
# https://github.com/new 에서 저장소 생성

# 5. GitHub 저장소와 연결
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

---

### Step 2: Render에서 배포 (3분)

#### 2-1. Render 대시보드 접속

1. https://dashboard.render.com 접속
2. GitHub 계정으로 로그인

#### 2-2. 새 프로젝트 생성

1. **"New +"** 버튼 클릭
2. **"Web Service"** 선택

#### 2-3. GitHub 저장소 연결

1. **"Connect a repository"** 클릭
2. GitHub 계정 연동 (처음이라면)
3. 방금 푸시한 저장소 선택
4. **"Connect"** 클릭

#### 2-4. 프로젝트 설정

다음과 같이 입력하세요:

| 설정 항목 | 입력 값 |
|----------|---------|
| **Name** | `financial-statement-app` (원하는 이름) |
| **Region** | `Singapore` (가장 가까운 지역) |
| **Branch** | `main` |
| **Root Directory** | (비워두기) |
| **Runtime** | `Python` |
| **Build Command** | 자동 입력됨 (render.yaml 사용) |
| **Start Command** | 자동 입력됨 (render.yaml 사용) |
| **Instance Type** | `Free` |

#### 2-5. 환경 변수 설정

**"Advanced"** 섹션에서 환경 변수 추가:

1. **"Add Environment Variable"** 클릭
2. 다음 변수들 추가:

```
DART_API_KEY=your_dart_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**중요**: 실제 API 키 값을 입력하세요!

#### 2-6. 배포 시작

1. **"Create Web Service"** 클릭
2. 자동으로 빌드 및 배포 시작!

---

## ⏱️ 배포 진행 상황 확인

### 빌드 로그 확인

Render 대시보드에서 실시간 로그를 볼 수 있습니다:

```
==> Building...
==> Installing Python dependencies...
==> Installing Node.js dependencies...
==> Building frontend...
==> Starting application...
==> Your service is live! 🎉
```

**예상 시간**: 3-5분

---

## ✅ 배포 확인

### 1. URL 확인

배포가 완료되면 Render가 자동으로 URL을 생성합니다:

```
https://financial-statement-app.onrender.com
```

### 2. 동작 테스트

브라우저에서 다음을 확인하세요:

- [ ] 메인 페이지 로드 확인
- [ ] 회사 검색 기능 테스트
- [ ] 재무제표 조회 테스트
- [ ] AI 설명 생성 테스트

### 3. API 테스트

```
https://your-app.onrender.com/api/report-codes
```

위 URL로 접속하면 JSON 응답이 나와야 합니다!

---

## 🔧 문제 해결

### 1. 빌드 실패

**증상**: "Build failed" 에러

**해결 방법**:
1. 로그 확인
2. `render.yaml` 파일 확인
3. `requirements.txt` 확인
4. Node.js 버전 확인 (18 이상)

### 2. 환경 변수 오류

**증상**: "API key not found" 에러

**해결 방법**:
1. Render 대시보드 → "Environment" 탭
2. 환경 변수가 올바르게 설정되었는지 확인
3. 변경 후 **"Manual Deploy"** → "Deploy latest commit" 클릭

### 3. 첫 요청이 느림 (Cold Start)

**증상**: 배포 후 첫 접속이 느림

**이유**: 무료 플랜은 15분 동안 요청이 없으면 자동으로 슬립 모드로 전환됩니다.

**해결 방법**:
- 정상입니다! 첫 요청 후에는 빠르게 작동합니다.
- 또는 유료 플랜으로 업그레이드하면 항상 활성 상태 유지됩니다.

### 4. CORS 에러

**증상**: 브라우저 콘솔에 CORS 에러

**해결 방법**:
환경 변수에 추가:
```
ALLOW_ALL_ORIGINS=true
```

---

## 🔄 자동 배포 설정

### GitHub Push 시 자동 배포

기본적으로 이미 설정되어 있습니다!

```bash
# 코드 수정 후
git add .
git commit -m "기능 추가"
git push

# Render가 자동으로 감지하고 재배포!
```

### 수동 배포

Render 대시보드에서:
1. **"Manual Deploy"** 클릭
2. **"Deploy latest commit"** 선택

---

## 💰 비용 안내

### 무료 플랜
- **월 비용**: $0
- **빌드 시간**: 500시간/월
- **대역폭**: 100GB/월
- **제한사항**: 
  - 15분 동안 요청 없으면 슬립 모드
  - 첫 요청 시 Cold Start (10-30초)

### 유료 플랜 ($7/월)
- **월 비용**: $7
- **항상 활성 상태**
- **더 빠른 성능**
- **더 많은 리소스**

**추천**: 먼저 무료로 시작하고, 필요하면 업그레이드!

---

## 📊 데이터베이스 (선택사항)

### 현재: SQLite (파일 기반)
- ✅ 간단, 별도 설정 불필요
- ⚠️ 재시작 시 초기화될 수 있음

### 업그레이드: PostgreSQL

Render에서 무료 PostgreSQL 추가:

1. Render 대시보드 → **"New +"** → **"PostgreSQL"**
2. 자동으로 연결 정보 생성됨
3. 환경 변수 `DATABASE_URL` 자동 설정
4. 백엔드 코드 수정 필요 (SQLAlchemy 등 사용)

---

## 🎉 완료!

축하합니다! 이제 전 세계 어디서나 접속 가능한 재무제표 시각화 서비스가 완성되었습니다!

### 다음 단계

- [ ] 친구들과 공유
- [ ] 피드백 받기
- [ ] 커스텀 도메인 연결 (선택사항)
- [ ] 기능 추가 및 개선

---

## 🆘 도움이 필요하신가요?

- [Render 문서](https://render.com/docs)
- [Render 커뮤니티](https://community.render.com)
- 또는 저에게 질문하세요!

---

## 📝 체크리스트

배포 완료 확인:

- [ ] GitHub에 코드 푸시 완료
- [ ] Render에서 서비스 생성 완료
- [ ] 환경 변수 설정 완료
- [ ] 빌드 성공 확인
- [ ] URL 접속 가능
- [ ] 회사 검색 기능 작동
- [ ] 재무제표 조회 작동
- [ ] AI 설명 생성 작동

**모두 완료하셨나요? 축하합니다!** 🎊
