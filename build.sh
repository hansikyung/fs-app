#!/usr/bin/env bash
# Render 빌드 스크립트

set -o errexit  # 오류 발생 시 스크립트 중단

echo "===== 1. Python 패키지 설치 ====="
pip install -r requirements.txt

echo "===== 2. 회사 코드 다운로드 ====="
python download_corp_code.py

echo "===== 3. 데이터베이스 초기화 ====="
python init_db.py

echo "===== 4. Node.js 및 npm 설치 확인 ====="
# Node.js 버전 확인
if command -v node > /dev/null 2>&1; then
    echo "Node.js 버전: $(node --version)"
else
    echo "Node.js가 설치되어 있지 않습니다. nvm을 통해 설치합니다..."
    # nvm 설치
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Node.js 18 설치
    nvm install 18
    nvm use 18
    echo "Node.js 설치 완료: $(node --version)"
fi

echo "===== 5. 프론트엔드 빌드 ====="
cd frontend
echo "npm 설치 중..."
npm install
echo "프론트엔드 빌드 중..."
npm run build
cd ..

echo "===== 6. 빌드 완료 확인 ====="
if [ -d "frontend/dist" ]; then
    echo "✅ frontend/dist 폴더가 성공적으로 생성되었습니다."
    ls -la frontend/dist
else
    echo "❌ 오류: frontend/dist 폴더가 생성되지 않았습니다."
    exit 1
fi

echo "===== 빌드 완료! ====="
