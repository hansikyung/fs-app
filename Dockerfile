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

# 프론트엔드 빌드 결과 복사
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# 회사 코드 다운로드 및 DB 초기화
RUN python download_corp_code.py && python init_db.py

# 포트 노출
EXPOSE 8000

# 시작 명령
CMD ["python", "backend/main.py"]
