# 멀티 스테이지 빌드: 프론트엔드 빌드
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# 프론트엔드 의존성 설치
COPY frontend/package*.json ./
RUN npm install

# 프론트엔드 빌드
COPY frontend/ ./
RUN npm run build

# 백엔드 이미지
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 코드 복사
COPY backend/ ./backend/
COPY download_corp_code.py .
COPY init_db.py .
COPY config.py .

# 프론트엔드 빌드 결과 복사
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# 시작 스크립트 생성
RUN echo '#!/bin/sh\n\
set -e\n\
echo "🔧 데이터베이스 초기화 시작..."\n\
if [ ! -f "dart.db" ]; then\n\
  echo "📥 회사 코드 다운로드 중..."\n\
  python download_corp_code.py\n\
  echo "💾 데이터베이스 생성 중..."\n\
  python init_db.py\n\
  echo "✅ 데이터베이스 초기화 완료!"\n\
else\n\
  echo "✅ 데이터베이스가 이미 존재합니다."\n\
fi\n\
echo "🚀 서버 시작..."\n\
exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}\n\
' > /app/start.sh && chmod +x /app/start.sh

# 포트 노출
EXPOSE 8000

# 환경 변수 설정
ENV PYTHONUNBUFFERED=1

# 시작 명령
CMD ["/app/start.sh"]
