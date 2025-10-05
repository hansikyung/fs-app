from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import sqlite3
import requests
from typing import List, Optional
from pydantic import BaseModel
import os
import sys
from dotenv import load_dotenv
import google.generativeai as genai
import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd

# .env 파일 로드
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
DART_API_KEY = os.getenv('DART_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# 프론트엔드 URL 설정 (배포 시 환경 변수로 설정 가능)
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# Gemini API 설정
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="재무제표 시각화 API")

# CORS 설정 (로컬 개발 + 배포 환경)
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
]

# 배포된 프론트엔드 URL 추가
if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
    allowed_origins.append(FRONTEND_URL)

# 모든 Vercel 프리뷰 URL 허용 (선택사항)
if os.getenv('ALLOW_ALL_ORIGINS') == 'true':
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 데이터 모델
class Company(BaseModel):
    corp_code: str
    corp_name: str
    stock_code: Optional[str]
    modify_date: Optional[str]


class FinancialStatement(BaseModel):
    rcept_no: str
    bsns_year: str
    reprt_code: str
    fs_div: str
    fs_nm: str
    sj_div: str
    sj_nm: str
    account_nm: str
    thstrm_nm: str
    thstrm_dt: str
    thstrm_amount: str
    frmtrm_nm: Optional[str]
    frmtrm_dt: Optional[str]
    frmtrm_amount: Optional[str]
    bfefrmtrm_nm: Optional[str]
    bfefrmtrm_dt: Optional[str]
    bfefrmtrm_amount: Optional[str]


def get_db_connection():
    """데이터베이스 연결"""
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dart.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


@app.get("/api/companies/search", response_model=List[Company])
def search_companies(query: str, limit: int = 20):
    """회사명으로 검색"""
    
    if not query:
        raise HTTPException(status_code=400, detail="검색어를 입력하세요")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # LIKE 검색 (상장회사만 - stock_code가 6자리 숫자인 경우)
    cursor.execute('''
        SELECT corp_code, corp_name, TRIM(stock_code) as stock_code, modify_date
        FROM companies
        WHERE corp_name_lower LIKE ? 
        AND LENGTH(TRIM(stock_code)) = 6
        AND TRIM(stock_code) GLOB '[0-9][0-9][0-9][0-9][0-9][0-9]'
        ORDER BY corp_name
        LIMIT ?
    ''', (f'%{query.lower()}%', limit))
    
    results = cursor.fetchall()
    conn.close()
    
    companies = [
        Company(
            corp_code=row['corp_code'],
            corp_name=row['corp_name'],
            stock_code=row['stock_code'],
            modify_date=row['modify_date']
        )
        for row in results
    ]
    
    return companies


@app.get("/api/financial-statement")
def get_financial_statement(
    corp_code: str,
    bsns_year: str,
    reprt_code: str = "11011"
):
    """재무제표 조회
    
    Args:
        corp_code: 회사 고유번호 (8자리)
        bsns_year: 사업연도 (4자리, 예: 2018)
        reprt_code: 보고서 코드
            - 11011: 사업보고서
            - 11012: 반기보고서
            - 11013: 1분기보고서
            - 11014: 3분기보고서
    """
    url = "https://opendart.fss.or.kr/api/fnlttSinglAcnt.json"
    
    params = {
        'crtfc_key': DART_API_KEY,
        'corp_code': corp_code,
        'bsns_year': bsns_year,
        'reprt_code': reprt_code
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data['status'] != '000':
            raise HTTPException(
                status_code=400,
                detail=f"DART API 오류: {data.get('message', '알 수 없는 오류')}"
            )
        
        return data
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"API 요청 실패: {str(e)}")


@app.get("/api/report-codes")
def get_report_codes():
    """보고서 코드 목록"""
    return [
        {"code": "11011", "name": "사업보고서"},
        {"code": "11012", "name": "반기보고서"},
        {"code": "11013", "name": "1분기보고서"},
        {"code": "11014", "name": "3분기보고서"}
    ]


class ExplainRequest(BaseModel):
    company_name: str
    year: str
    financial_data: dict


class InvestmentAnalysisRequest(BaseModel):
    company_name: str
    stock_code: str
    year: str
    financial_data: dict
    stock_data: dict


@app.post("/api/explain-financial-statement")
def explain_financial_statement(request: ExplainRequest):
    """Gemini AI를 사용하여 재무제표 설명"""
    
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY가 설정되지 않았습니다. .env 파일에 추가해주세요."
        )
    
    try:
        # Gemini 모델 생성 (최신 안정 버전 사용)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # 재무 데이터 요약
        financial_summary = []
        for item in request.financial_data.get('list', [])[:15]:  # 상위 15개만
            if item.get('fs_div') == 'CFS':  # 연결재무제표만
                sj_nm = item.get('sj_nm', '')
                account_nm = item.get('account_nm', '')
                thstrm = item.get('thstrm_amount', '0')
                frmtrm = item.get('frmtrm_amount', '0')
                
                financial_summary.append(
                    f"{sj_nm} - {account_nm}: 당기 {thstrm}, 전기 {frmtrm}"
                )
        
        # 프롬프트 생성
        prompt = f"""당신은 고등학생도 이해할 수 있도록 재무제표를 쉽게 설명하는 전문가입니다. 
{request.company_name}의 {request.year}년 재무제표를 분석하여 아래 형식으로 설명해주세요.

📊 주요 재무 데이터:
{chr(10).join(financial_summary[:10])}

다음 형식으로 구조화된 설명을 작성해주세요:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 1. 회사 재무 상태 한눈에 보기
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 이 회사의 전반적인 재무 건전성을 신호등(🟢건강함/🟡보통/🔴주의필요)으로 평가하고, 그 이유를 2-3문장으로 설명하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 2. 재무제표 핵심 용어 쉽게 이해하기
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
다음 용어들을 구체적인 숫자와 함께 쉽게 설명해주세요:

**자산총계** (현재: XX조원)
→ 회사가 가진 모든 재산의 총합

**부채총계** (현재: XX조원)
→ 회사가 갚아야 할 빚의 총합

**자본총계** (현재: XX조원)
→ 순수하게 회사 주인(주주)의 몫
→ 계산식: 자산총계 - 부채총계 = 자본총계

**매출액** (현재: XX조원)
→ 회사가 물건이나 서비스를 팔아서 번 돈

**영업이익** (현재: XX조원)
→ 본업으로 벌어들인 순수 이익

**당기순이익** (현재: XX조원)
→ 세금과 이자 등을 다 떼고 남은 최종 이익

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 3. 주요 재무비율 분석 (공식 포함)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
다음 비율들을 계산하고 의미를 설명해주세요:

**부채비율** = (부채총계 ÷ 자본총계) × 100
→ 계산 결과: XX%
→ 의미: 100% 이하면 빚보다 자기 돈이 많아 안정적

**ROE (자기자본이익률)** = (당기순이익 ÷ 자본총계) × 100
→ 계산 결과: XX%
→ 의미: 주주가 투자한 돈으로 얼마나 효율적으로 이익을 냈는지 측정

**영업이익률** = (영업이익 ÷ 매출액) × 100
→ 계산 결과: XX%
→ 의미: 매출 100원당 본업에서 남는 이익

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 4. 전년 대비 변화 분석
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
전년 대비 주요 지표의 변화를 ↑증가/↓감소/→유지로 표시하고 설명하세요:
- 매출액: 
- 영업이익: 
- 당기순이익: 

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 5. 고등학생을 위한 투자 가이드
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
만약 여러분이 이 회사에 투자를 고려한다면:
✅ 좋은 점:
❗ 주의할 점:
📝 종합 의견:

모든 설명은 고등학생이 이해할 수 있는 쉬운 단어로 작성하고, 전문용어는 반드시 괄호()로 풀어서 설명해주세요.
구체적인 숫자를 많이 사용하여 실감나게 설명해주세요."""
        
        # Gemini API 호출 (안전 설정 추가)
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=2500,
            ),
            safety_settings=[
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE"
                }
            ]
        )
        
        return {
            "status": "success",
            "explanation": response.text
        }
        
    except Exception as e:
        import traceback
        error_detail = f"AI 설명 생성 중 오류: {str(e)}\n상세: {traceback.format_exc()}"
        print(error_detail)  # 서버 로그에 출력
        
        return {
            "status": "error",
            "explanation": f"AI 설명 생성 중 오류가 발생했습니다.\n\n오류 내용: {str(e)}\n\nGEMINI_API_KEY가 올바르게 설정되어 있는지 확인해주세요."
        }


@app.get("/api/stock-price")
def get_stock_price(stock_code: str, period: str = "1y"):
    """주식 가격 정보 조회

    Args:
        stock_code: 종목 코드 (6자리)
        period: 조회 기간 (1mo, 3mo, 6mo, 1y, 2y, 5y)
    """
    try:
        # 한국 주식 코드 형식으로 변환 (예: 005930 -> 005930.KS)
        ticker_symbol = f"{stock_code}.KS"

        # yfinance로 주식 데이터 가져오기
        stock = yf.Ticker(ticker_symbol)

        # 역사적 데이터 가져오기
        hist = stock.history(period=period)

        if hist.empty:
            # KS가 안되면 KQ(코스닥) 시도
            ticker_symbol = f"{stock_code}.KQ"
            stock = yf.Ticker(ticker_symbol)
            hist = stock.history(period=period)

            if hist.empty:
                raise HTTPException(
                    status_code=404,
                    detail="주식 데이터를 찾을 수 없습니다. 종목 코드를 확인해주세요."
                )

        # 데이터 가공
        stock_data = {
            "dates": hist.index.strftime('%Y-%m-%d').tolist(),
            "prices": hist['Close'].tolist(),
            "volumes": hist['Volume'].tolist(),
            "high": hist['High'].tolist(),
            "low": hist['Low'].tolist(),
            "open": hist['Open'].tolist(),
        }

        # 기본 통계 계산
        current_price = hist['Close'].iloc[-1]
        previous_price = hist['Close'].iloc[0]
        change = current_price - previous_price
        change_percent = (change / previous_price) * 100

        # 52주 최고/최저
        high_52week = hist['High'].max()
        low_52week = hist['Low'].min()

        # 평균 거래량
        avg_volume = hist['Volume'].mean()

        return {
            "status": "success",
            "ticker": ticker_symbol,
            "data": stock_data,
            "statistics": {
                "current_price": round(current_price, 2),
                "previous_price": round(previous_price, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "high_52week": round(high_52week, 2),
                "low_52week": round(low_52week, 2),
                "avg_volume": int(avg_volume)
            }
        }

    except Exception as e:
        import traceback
        error_detail = f"주식 데이터 조회 중 오류: {str(e)}\n상세: {traceback.format_exc()}"
        print(error_detail)

        raise HTTPException(
            status_code=500,
            detail=f"주식 데이터 조회 실패: {str(e)}"
        )


@app.post("/api/investment-analysis")
def investment_analysis(request: InvestmentAnalysisRequest):
    """재무제표와 주가 데이터를 종합하여 AI 투자 분석 제공"""

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY가 설정되지 않았습니다."
        )

    try:
        model = genai.GenerativeModel('gemini-2.0-flash')

        # 재무 데이터 요약
        financial_summary = []
        for item in request.financial_data.get('list', [])[:20]:
            if item.get('fs_div') == 'CFS':
                sj_nm = item.get('sj_nm', '')
                account_nm = item.get('account_nm', '')
                thstrm = item.get('thstrm_amount', '0')
                frmtrm = item.get('frmtrm_amount', '0')

                financial_summary.append(
                    f"{sj_nm} - {account_nm}: 당기 {thstrm}, 전기 {frmtrm}"
                )

        # 주가 통계
        stock_stats = request.stock_data.get('statistics', {})
        current_price = stock_stats.get('current_price', 0)
        change_percent = stock_stats.get('change_percent', 0)
        high_52week = stock_stats.get('high_52week', 0)
        low_52week = stock_stats.get('low_52week', 0)

        # AI 프롬프트 생성
        prompt = f"""당신은 금융 전문가입니다. {request.company_name}({request.stock_code})의 {request.year}년 재무제표와 최근 주가 데이터를 종합적으로 분석하여 투자 의견을 제시해주세요.

📊 재무제표 주요 데이터:
{chr(10).join(financial_summary[:15])}

📈 주가 현황:
- 현재가: {current_price:,.0f}원
- 기간 변동률: {change_percent:+.2f}%
- 52주 최고가: {high_52week:,.0f}원
- 52주 최저가: {low_52week:,.0f}원

다음 형식으로 종합 투자 분석을 작성해주세요:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 1. 재무제표 핵심 분석
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 자산/부채/자본 구조 평가
- 매출 및 수익성 분석
- 주요 재무비율 (부채비율, ROE, 영업이익률 등)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 2. 주가 트렌드 분석
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 현재 주가 수준 평가 (52주 최고/최저 대비)
- 최근 변동성 및 추세 분석
- 시장 대비 상대적 강도

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 3. 재무제표 vs 주가 괴리도 분석
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 재무 실적 대비 주가가 적정한지 평가
- 고평가/저평가 여부 분석
- PER, PBR 등 밸류에이션 지표 언급 (추정)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 4. 종합 투자 의견
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**투자 등급**: 매수 / 보유 / 매도 중 하나 선택

**투자 포인트**:
✅ 강점 3가지
❌ 약점 3가지

**목표가 및 전략**:
- 적정 목표 주가 제시 (근거 포함)
- 단기/중기/장기 투자 전략 제안

**리스크 요인**:
- 주의해야 할 위험 요소 나열

구체적인 숫자를 사용하여 설득력 있게 작성해주세요.
전문 투자자가 읽어도 유익한 수준의 분석을 제공해주세요."""

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=3000,
            ),
            safety_settings=[
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
            ]
        )

        return {
            "status": "success",
            "analysis": response.text
        }

    except Exception as e:
        import traceback
        error_detail = f"투자 분석 생성 중 오류: {str(e)}\n상세: {traceback.format_exc()}"
        print(error_detail)

        return {
            "status": "error",
            "analysis": f"투자 분석 생성 중 오류가 발생했습니다.\n\n오류 내용: {str(e)}"
        }


# ============================================
# 정적 파일 서빙 (맨 마지막에 정의 - catch-all 라우트)
# ============================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSSIBLE_STATIC_DIRS = [
    os.path.join(BASE_DIR, "frontend", "dist"),
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"),
    "frontend/dist",
    "./frontend/dist"
]

STATIC_DIR = None
for possible_dir in POSSIBLE_STATIC_DIRS:
    abs_path = os.path.abspath(possible_dir)
    print(f"🔍 정적 파일 경로 확인: {abs_path}")
    if os.path.exists(abs_path):
        STATIC_DIR = abs_path
        print(f"✅ 정적 파일 디렉토리 발견: {STATIC_DIR}")
        break

if STATIC_DIR and os.path.exists(STATIC_DIR):
    print(f"📂 정적 파일 내용: {os.listdir(STATIC_DIR)}")
    
    # assets 폴더가 있는 경우에만 마운트
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static")
        print(f"✅ /assets 마운트 완료")
    
    @app.get("/")
    async def serve_root():
        """프론트엔드 index.html 서빙"""
        index_path = os.path.join(STATIC_DIR, "index.html")
        print(f"📄 index.html 서빙: {index_path}")
        return FileResponse(index_path)
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """SPA 라우팅을 위한 catch-all (API 경로 제외)"""
        # API 경로는 제외
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # 파일이 존재하면 반환
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # 그 외에는 index.html 반환 (SPA 라우팅)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    print(f"❌ 정적 파일 디렉토리를 찾을 수 없습니다. 시도한 경로:")
    for possible_dir in POSSIBLE_STATIC_DIRS:
        print(f"  - {os.path.abspath(possible_dir)}")
    
    @app.get("/")
    def read_root():
        return {"message": "재무제표 시각화 API", "error": "프론트엔드 빌드 파일을 찾을 수 없습니다."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
