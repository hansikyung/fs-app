# 🎯 Render 배포 - 단계별 가이드

하나씩 천천히 따라하세요! 각 단계가 완료되면 다음 단계로 넘어갑니다.

---

## ✅ 사전 준비 체크리스트

시작하기 전에 다음 항목들을 확인하세요:

### 필수 준비물
- [ ] GitHub 계정 (없으면 https://github.com 에서 가입)
- [ ] Open DART API Key (https://opendart.fss.or.kr/ 에서 발급)
- [ ] Google Gemini API Key (https://aistudio.google.com/app/apikey 에서 발급)

### API 키 발급 방법

#### 1) Open DART API Key
1. https://opendart.fss.or.kr/ 접속
2. 회원가입 후 로그인
3. "오픈API" → "인증키 신청/관리"
4. 인증키 발급 (무료)
5. 발급된 키를 복사해서 메모장에 저장

#### 2) Google Gemini API Key
1. https://aistudio.google.com/app/apikey 접속
2. Google 계정으로 로그인
3. "Create API Key" 클릭
4. 발급된 키를 복사해서 메모장에 저장

---

## 📌 Step 1: GitHub 저장소 생성

### 1-1. GitHub에서 새 저장소 만들기

1. https://github.com 접속 후 로그인
2. 우측 상단 **"+"** 버튼 클릭 → **"New repository"** 선택
3. 저장소 설정:
   - **Repository name**: `financial-statement-app` (원하는 이름으로 변경 가능)
   - **Description**: "재무제표 시각화 서비스"
   - **Public** 선택 (무료)
   - ❌ "Add a README file" 체크 해제 (이미 있음)
   - ❌ ".gitignore" 선택 안함 (이미 있음)
   - ❌ "Choose a license" 선택 안함
4. **"Create repository"** 클릭

### 1-2. 저장소 URL 복사

생성된 페이지에서 HTTPS URL을 복사하세요:
```
https://github.com/your-username/financial-statement-app.git
```

---

## 📌 Step 2: Git 설정 및 푸시

### 2-1. Git 초기화 확인

터미널(PowerShell)을 열고 프로젝트 폴더로 이동:

```powershell
cd c:\vibecoding_finance
```

Git이 초기화되어 있는지 확인:

```powershell
git status
```

만약 "not a git repository" 에러가 나면:

```powershell
git init
```

### 2-2. 현재 코드 상태 확인

```powershell
git status
```

빨간색으로 표시된 파일들이 커밋되지 않은 파일들입니다.

### 2-3. 모든 파일 추가

```powershell
git add .
```

### 2-4. 커밋

```powershell
git commit -m "재무제표 시각화 서비스 - Render 배포 준비"
```

### 2-5. GitHub 저장소 연결

Step 1에서 복사한 URL 사용:

```powershell
git remote add origin https://github.com/your-username/financial-statement-app.git
```

**중요**: `your-username`과 `financial-statement-app`을 본인의 것으로 변경하세요!

### 2-6. 메인 브랜치 설정

```powershell
git branch -M main
```

### 2-7. GitHub에 푸시

```powershell
git push -u origin main
```

GitHub 로그인 요청이 나오면 로그인하세요.

### 2-8. 확인

브라우저에서 GitHub 저장소로 가서 파일들이 업로드되었는지 확인하세요!

---

## 📌 Step 3: Render 계정 생성

### 3-1. Render 접속

https://render.com 접속

### 3-2. 회원가입

**"Get Started"** 버튼 클릭 후:

- **추천**: "Sign in with GitHub" (가장 간단)
- 또는: 이메일로 가입

### 3-3. GitHub 연동 (GitHub으로 가입한 경우)

1. GitHub 계정 연동 허용
2. "Authorize Render" 클릭

---

## 📌 Step 4: Render 프로젝트 생성

### 4-1. 대시보드 접속

https://dashboard.render.com 으로 이동

### 4-2. 새 서비스 생성

1. **"New +"** 버튼 클릭 (우측 상단)
2. **"Web Service"** 선택

### 4-3. GitHub 저장소 연결

1. **"Connect a repository"** 섹션에서:
   - GitHub 계정이 연결되어 있으면 저장소 목록이 보입니다
   - 없으면 "Connect GitHub" 클릭

2. 방금 만든 저장소 찾기:
   - `financial-statement-app` 검색
   - 옆의 **"Connect"** 버튼 클릭

### 4-4. 저장소 권한 설정 (처음인 경우)

GitHub에서 Render 접근 권한 요청이 나올 수 있습니다:
1. "Install & Authorize" 클릭
2. 저장소 선택 또는 "All repositories" 선택

---

## 📌 Step 5: 서비스 설정

이제 설정 페이지가 나타납니다. 다음과 같이 입력하세요:

### 5-1. 기본 정보

| 항목 | 입력값 |
|------|--------|
| **Name** | `financial-statement-app` (원하는 이름) |
| **Region** | `Singapore` (한국과 가까움) |
| **Branch** | `main` (자동 선택됨) |
| **Root Directory** | (비워두기) |

### 5-2. 빌드 설정

| 항목 | 입력값 |
|------|--------|
| **Runtime** | `Python` (자동 선택될 수 있음) |
| **Build Command** | 자동으로 입력됨 (render.yaml 사용) |
| **Start Command** | 자동으로 입력됨 (render.yaml 사용) |

만약 자동으로 입력되지 않으면 다음을 입력:

**Build Command**:
```bash
pip install -r requirements.txt && python download_corp_code.py && python init_db.py && cd frontend && npm install && npm run build && cd ..
```

**Start Command**:
```bash
python backend/main.py
```

### 5-3. 인스턴스 타입

| 항목 | 선택값 |
|------|--------|
| **Instance Type** | `Free` |

---

## 📌 Step 6: 환경 변수 설정 (중요!)

### 6-1. Advanced 섹션 열기

페이지 아래 **"Advanced"** 버튼 클릭

### 6-2. 환경 변수 추가

**"Add Environment Variable"** 버튼을 클릭하여 다음 변수들을 하나씩 추가:

#### 첫 번째 변수: DART_API_KEY

1. **"Add Environment Variable"** 클릭
2. **Key**: `DART_API_KEY`
3. **Value**: `사전에 준비한 DART API 키 붙여넣기`
4. (체크 안함) "Generate value"

#### 두 번째 변수: GEMINI_API_KEY

1. **"Add Environment Variable"** 클릭
2. **Key**: `GEMINI_API_KEY`
3. **Value**: `사전에 준비한 Gemini API 키 붙여넣기`
4. (체크 안함) "Generate value"

### 6-3. 환경 변수 확인

두 개의 환경 변수가 추가되었는지 확인:
- ✅ DART_API_KEY
- ✅ GEMINI_API_KEY

---

## 📌 Step 7: 배포 시작!

### 7-1. 서비스 생성

페이지 맨 아래 **"Create Web Service"** 버튼 클릭!

### 7-2. 배포 진행 확인

자동으로 빌드 로그 페이지로 이동합니다.

실시간으로 로그를 볼 수 있습니다:

```
==> Cloning from GitHub...
==> Building...
==> Installing Python dependencies...
==> Downloading CORPCODE...
==> Initializing database...
==> Installing Node.js dependencies...
==> Building frontend...
==> Starting application...
==> Your service is live at https://...
```

### 7-3. 대기 시간

- **첫 배포**: 약 5-7분 소요 (정상입니다!)
- 빌드 로그를 보면서 진행 상황을 확인하세요

### 7-4. 배포 완료 확인

로그에 다음과 같은 메시지가 나타나면 성공:

```
==> Build successful 🎉
==> Deploying...
==> Your service is live!
```

---

## 📌 Step 8: 배포된 서비스 확인

### 8-1. URL 확인

1. Render 대시보드 상단에 URL이 표시됩니다:
   ```
   https://financial-statement-app.onrender.com
   ```

2. 또는 왼쪽 메뉴에서 서비스 클릭 → 상단에 URL 표시

### 8-2. 웹사이트 접속

1. URL을 클릭하거나 복사해서 브라우저에 입력
2. **첫 접속 시 10-30초 정도 소요될 수 있습니다** (Cold Start)

### 8-3. 기능 테스트

배포된 웹사이트에서 다음을 확인:

- [ ] 메인 페이지가 로드됨
- [ ] 회사 검색 (예: "삼성전자" 입력)
- [ ] 검색 결과가 나타남
- [ ] 회사 클릭 → 재무제표 조회
- [ ] 차트가 표시됨
- [ ] "AI로 쉽게 설명받기" 버튼 클릭
- [ ] AI 설명이 생성됨

모두 작동하면 **배포 성공!** 🎉

---

## 📌 Step 9: 문제 해결 (필요한 경우)

### 문제 1: 빌드 실패

**증상**: "Build failed" 에러

**해결**:
1. Render 대시보드 → "Logs" 탭
2. 에러 메시지 확인
3. 일반적인 원인:
   - 환경 변수 누락
   - Python/Node.js 버전 문제
   - 의존성 설치 실패

### 문제 2: 환경 변수 오류

**증상**: "API key not found" 또는 500 에러

**해결**:
1. Render 대시보드 → "Environment" 탭
2. 환경 변수 확인:
   - `DART_API_KEY` 값이 올바른지
   - `GEMINI_API_KEY` 값이 올바른지
3. 수정 후:
   - "Save Changes" 클릭
   - 오른쪽 상단 "Manual Deploy" → "Deploy latest commit"

### 문제 3: 서비스가 느림

**증상**: 첫 접속 시 매우 느림

**설명**:
- 무료 플랜은 15분 동안 요청이 없으면 슬립 모드
- 첫 요청 시 서비스 재시작 필요 (Cold Start)
- **정상입니다!** 활성화 후에는 빠름

**해결**:
- 유료 플랜으로 업그레이드 ($7/월)
- 또는 그냥 사용 (무료로 충분함)

### 문제 4: 회사 검색이 안됨

**증상**: 검색해도 결과가 없음

**원인**: 데이터베이스 초기화 실패

**해결**:
1. Render 대시보드 → "Logs" 탭
2. `init_db.py` 실행 로그 확인
3. 에러가 있으면:
   - "Manual Deploy" → "Clear build cache & deploy"
   - 다시 빌드

---

## 📌 Step 10: 추가 설정 (선택사항)

### 10-1. 커스텀 도메인 연결

1. Render 대시보드 → "Settings" 탭
2. "Custom Domain" 섹션
3. 본인의 도메인 입력 (있는 경우)

### 10-2. 자동 배포 설정

기본적으로 이미 활성화되어 있습니다!

GitHub에 코드를 푸시하면 자동으로 재배포됩니다:

```bash
git add .
git commit -m "기능 추가"
git push
```

약 3-5분 후 자동으로 업데이트됩니다!

---

## 🎉 완료!

축하합니다! 성공적으로 배포하셨습니다!

### 배포된 서비스 공유하기

URL을 친구들과 공유하세요:
```
https://your-app-name.onrender.com
```

### 다음 단계

- [ ] 소셜 미디어에 공유
- [ ] 피드백 받기
- [ ] 기능 개선
- [ ] 유료 플랜 고려 (필요한 경우)

---

## 📞 도움이 필요하신가요?

### Render 공식 문서
- https://render.com/docs

### 추가 질문
궁금한 점이 있으면 언제든 물어보세요!

---

## 📋 최종 체크리스트

배포 완료를 확인하세요:

- [ ] GitHub에 코드 업로드 완료
- [ ] Render 계정 생성 완료
- [ ] 웹 서비스 생성 완료
- [ ] 환경 변수 설정 완료
- [ ] 빌드 성공 확인
- [ ] 배포된 URL 접속 가능
- [ ] 회사 검색 작동
- [ ] 재무제표 조회 작동
- [ ] AI 설명 생성 작동

**모두 완료하셨나요? 대단합니다!** 🏆🎊
