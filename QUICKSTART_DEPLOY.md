# ⚡ 빠른 배포 가이드 (5분 완성)

## 1️⃣ 코드를 GitHub에 업로드

```bash
# Git 초기화
git init
git add .
git commit -m "재무제표 시각화 서비스"

# GitHub에서 새 저장소 생성 후
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

---

## 2️⃣ 백엔드 배포 (Railway) - 3분

### 단계별 진행

1. **Railway 접속**: https://railway.app
2. **"Start a New Project"** 클릭
3. **"Deploy from GitHub repo"** 선택
4. 저장소 선택
5. **환경 변수 설정** (Settings → Variables)
   ```
   DART_API_KEY=your_dart_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
6. **배포 URL 복사** (예: `https://your-app.up.railway.app`)

### ✅ 확인
브라우저에서 `https://your-app.up.railway.app/api/report-codes` 접속
→ JSON 응답이 보이면 성공!

---

## 3️⃣ 프론트엔드 배포 (Vercel) - 2분

### 단계별 진행

1. **Vercel 접속**: https://vercel.com
2. **"Add New Project"** 클릭
3. GitHub 저장소 선택
4. **Root Directory 설정**: `frontend` 입력
5. **Framework Preset**: `Vite` 선택
6. **환경 변수 추가**:
   ```
   VITE_API_URL=https://your-railway-url.up.railway.app
   ```
7. **"Deploy"** 클릭

### ✅ 확인
Vercel이 제공하는 URL로 접속 (예: `https://your-app.vercel.app`)
→ 웹사이트가 보이면 성공!

---

## 🔧 문제 해결

### 백엔드 연결 안됨
1. Railway의 환경 변수 확인
2. CORS 설정 확인
3. Railway 로그 확인: `railway logs`

### 프론트엔드 빌드 실패
1. Vercel 설정에서 Root Directory가 `frontend`인지 확인
2. 환경 변수 `VITE_API_URL` 확인
3. 빌드 로그 확인

### CORS 에러
Railway 환경 변수에 추가:
```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## 💰 비용

- **Railway**: 월 $5 무료 크레딧 (충분함)
- **Vercel**: 완전 무료

**총 비용: $0/월** 🎉

---

## 🎉 완료!

이제 전 세계 어디서나 접속 가능한 재무제표 시각화 서비스가 완성되었습니다!

### 다음 단계
- [ ] 친구들과 공유
- [ ] 피드백 받기
- [ ] 기능 추가 및 개선
- [ ] 도메인 연결 (선택사항)

---

**도움이 필요하면 언제든 물어보세요!** 💪
