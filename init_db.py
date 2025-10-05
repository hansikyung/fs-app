import sqlite3
import xml.etree.ElementTree as ET
import os
import sys

# Windows 콘솔 인코딩 설정
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')


def create_database():
    """SQLite 데이터베이스 생성 및 회사코드 테이블 생성"""
    
    # 데이터베이스 연결
    conn = sqlite3.connect('dart.db')
    cursor = conn.cursor()
    
    # 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS companies (
            corp_code TEXT PRIMARY KEY,
            corp_name TEXT NOT NULL,
            stock_code TEXT,
            modify_date TEXT,
            corp_name_lower TEXT
        )
    ''')
    
    # 인덱스 생성 (검색 성능 향상)
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_corp_name 
        ON companies(corp_name_lower)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_stock_code 
        ON companies(stock_code)
    ''')
    
    conn.commit()
    print("✓ 데이터베이스 테이블 생성 완료")
    
    return conn, cursor


def import_corpcode_xml(cursor, conn):
    """CORPCODE.xml 파일을 데이터베이스로 임포트"""
    
    xml_path = "CORPCODE.xml"
    
    if not os.path.exists(xml_path):
        print("✗ CORPCODE.xml 파일이 없습니다. download_corp_code.py를 먼저 실행하세요.")
        return False
    
    print("XML 파싱 중...")
    tree = ET.parse(xml_path)
    root = tree.getroot()
    
    # 기존 데이터 삭제
    cursor.execute('DELETE FROM companies')
    
    # 데이터 삽입
    count = 0
    for company in root.findall('list'):
        corp_code = company.findtext('corp_code', '')
        corp_name = company.findtext('corp_name', '')
        stock_code = company.findtext('stock_code', '')
        modify_date = company.findtext('modify_date', '')
        
        cursor.execute('''
            INSERT INTO companies (corp_code, corp_name, stock_code, modify_date, corp_name_lower)
            VALUES (?, ?, ?, ?, ?)
        ''', (corp_code, corp_name, stock_code, modify_date, corp_name.lower()))
        
        count += 1
    
    conn.commit()
    print(f"✓ {count}개 회사 정보 DB에 저장 완료")
    
    # 통계 출력
    cursor.execute('SELECT COUNT(*) FROM companies WHERE stock_code != ""')
    listed_count = cursor.fetchone()[0]
    print(f"✓ 상장회사: {listed_count}개")
    
    return True


def test_search(cursor):
    """검색 테스트"""
    
    print("\n=== 검색 테스트 ===")
    
    # 삼성전자 검색
    cursor.execute('''
        SELECT corp_code, corp_name, stock_code 
        FROM companies 
        WHERE corp_name_lower LIKE ? AND stock_code != ""
        LIMIT 5
    ''', ('%삼성%',))
    
    results = cursor.fetchall()
    print("\n'삼성' 검색 결과:")
    for corp_code, corp_name, stock_code in results:
        print(f"  - {corp_name} ({stock_code}) [고유번호: {corp_code}]")


if __name__ == "__main__":
    print("데이터베이스 초기화 시작...\n")
    
    # 데이터베이스 생성
    conn, cursor = create_database()
    
    # XML 데이터 임포트
    if import_corpcode_xml(cursor, conn):
        # 검색 테스트
        test_search(cursor)
    
    # 연결 종료
    conn.close()
    print("\n✓ 데이터베이스 초기화 완료!")
