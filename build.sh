#!/usr/bin/env bash
# Render 빌드 스크립트

set -o errexit  # 오류 발생 시 스크립트 중단

echo "===== 현재 작업 디렉토리 ====="
pwd
ls -la

echo "===== 1. Python 패키지 설치 ====="
pip install --no-cache-dir -r requirements.txt

echo "===== 2. 회사 코드 다운로드 ====="
python download_corp_code.py

echo "===== 3. 데이터베이스 초기화 ====="
python init_db.py

echo "===== 4. Node.js 설치 (via NodeSource) ====="
# Render에서는 apt를 사용할 수 없으므로 다른 방법 사용
if ! command -v node &> /dev/null; then
    echo "Node.js가 없습니다. nvm으로 설치합니다..."
    
    # nvm 설치
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    
    # nvm 환경 변수 설정
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    # Node.js 18 설치
    nvm install 18
    nvm use 18
    nvm alias default 18
    
    echo "Node.js 설치 완료!"
fi

echo "===== Node.js 버전 확인 ====="
node --version
npm --version

echo "===== 5. 프론트엔드 빌드 ====="
cd frontend

echo "npm 의존성 설치 중..."
npm ci --prefer-offline --no-audit

echo "프론트엔드 빌드 중..."
npm run build

echo "빌드 결과 확인..."
ls -la dist/

cd ..

echo "===== 6. 최종 확인 ====="
if [ -d "frontend/dist" ]; then
    echo "✅ frontend/dist 폴더가 성공적으로 생성되었습니다."
    echo "내용:"
    ls -la frontend/dist
    echo ""
    echo "파일 개수: $(find frontend/dist -type f | wc -l)"
else
    echo "❌ 오류: frontend/dist 폴더가 생성되지 않았습니다."
    echo "frontend 디렉토리 내용:"
    ls -la frontend/
    exit 1
fi

echo "===== ✅ 빌드 완료! ====="
