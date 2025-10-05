import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# DART API Key 가져오기
DART_API_KEY = os.getenv('DART_API_KEY')

# Gemini API Key 가져오기
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not DART_API_KEY:
    raise ValueError("DART_API_KEY가 .env 파일에 설정되지 않았습니다.")

if not GEMINI_API_KEY:
    print("⚠️  GEMINI_API_KEY가 설정되지 않았습니다. AI 설명 기능을 사용하려면 .env 파일에 추가하세요.")
