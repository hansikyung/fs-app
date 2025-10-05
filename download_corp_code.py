import requests
import zipfile
import xml.etree.ElementTree as ET
import os
from io import BytesIO
from config import DART_API_KEY


def download_corp_code():
    """DART API에서 회사코드 다운로드 및 처리"""
    
    # API URL
    url = "https://opendart.fss.or.kr/api/corpCode.xml"
    
    # 요청 파라미터
    params = {
        'crtfc_key': DART_API_KEY
    }
    
    print("회사코드 다운로드 중...")
    
    try:
        # API 호출
        response = requests.get(url, params=params)
        
        # 응답 확인
        if response.status_code == 200:
            # ZIP 파일 저장
            zip_path = "corpCode.zip"
            with open(zip_path, 'wb') as f:
                f.write(response.content)
            print(f"✓ ZIP 파일 다운로드 완료: {zip_path}")
            
            # ZIP 파일 압축 해제
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(".")
            print("✓ ZIP 파일 압축 해제 완료")
            
            # XML 파일 파싱
            xml_path = "CORPCODE.xml"
            if os.path.exists(xml_path):
                tree = ET.parse(xml_path)
                root = tree.getroot()
                
                # 회사 정보 추출
                companies = []
                for company in root.findall('list'):
                    corp_code = company.findtext('corp_code', '')
                    corp_name = company.findtext('corp_name', '')
                    stock_code = company.findtext('stock_code', '')
                    modify_date = company.findtext('modify_date', '')
                    
                    companies.append({
                        'corp_code': corp_code,
                        'corp_name': corp_name,
                        'stock_code': stock_code,
                        'modify_date': modify_date
                    })
                
                print(f"✓ 총 {len(companies)}개 회사 정보 로드 완료")
                
                # 상장회사만 필터링 (종목코드가 있는 회사)
                listed_companies = [c for c in companies if c['stock_code']]
                print(f"✓ 상장회사: {len(listed_companies)}개")
                
                return companies
            else:
                print("✗ XML 파일을 찾을 수 없습니다.")
                return None
                
        else:
            print(f"✗ API 호출 실패: {response.status_code}")
            print(f"응답 내용: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ 오류 발생: {str(e)}")
        return None


if __name__ == "__main__":
    companies = download_corp_code()
    
    if companies:
        # 상장회사 몇 개 샘플 출력
        print("\n=== 상장회사 샘플 (처음 5개) ===")
        for company in companies[:5]:
            if company['stock_code']:
                print(f"회사명: {company['corp_name']}")
                print(f"  고유번호: {company['corp_code']}")
                print(f"  종목코드: {company['stock_code']}")
                print(f"  최종변경일: {company['modify_date']}")
                print()
