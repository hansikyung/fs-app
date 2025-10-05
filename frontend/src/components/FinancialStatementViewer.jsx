import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './FinancialStatementViewer.css'

function FinancialStatementViewer({ company }) {
  const [year, setYear] = useState('2023')
  const [reportCode, setReportCode] = useState('11011')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reportCodes, setReportCodes] = useState([])
  const [aiExplanation, setAiExplanation] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [stockData, setStockData] = useState(null)
  const [stockLoading, setStockLoading] = useState(false)
  const [showStockAnalysis, setShowStockAnalysis] = useState(false)
  const [investmentAnalysis, setInvestmentAnalysis] = useState(null)
  const [investmentLoading, setInvestmentLoading] = useState(false)

  // AI 설명 텍스트를 맥킨지 스타일로 파싱
  const parseAIExplanation = (text) => {
    if (!text) return null

    const lines = text.split('\n')
    const elements = []
    let currentSection = null
    let sectionContent = []
    let tableData = null
    let listItems = []

    const flushSection = () => {
      if (currentSection && sectionContent.length > 0) {
        elements.push(
          <div key={elements.length} className="ai-section-box">
            <div className="ai-section-title">
              {currentSection.title}
            </div>
            <div className="ai-section-content">
              {sectionContent.map((content, idx) => (
                <div key={idx}>{content}</div>
              ))}
            </div>
          </div>
        )
        sectionContent = []
      }
    }

    const flushTable = () => {
      if (tableData && tableData.rows.length > 0) {
        sectionContent.push(
          <table key={`table-${sectionContent.length}`} className="mckinsey-table">
            <thead>
              <tr>
                {tableData.headers.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, ridx) => (
                <tr key={ridx}>
                  {row.map((cell, cidx) => (
                    <td key={cidx}>{parseInlineStyles(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )
        tableData = null
      }
    }

    const flushList = () => {
      if (listItems.length > 0) {
        sectionContent.push(
          <ul key={`list-${sectionContent.length}`} className="mckinsey-list">
            {listItems.map((item, idx) => (
              <li key={idx} className="mckinsey-list-item">
                {parseInlineStyles(item)}
              </li>
            ))}
          </ul>
        )
        listItems = []
      }
    }

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim()
      
      // 빈 줄 및 구분선 무시
      if (line === '' || line.match(/^━+$/)) {
        continue
      }

      // 이모티콘 제거
      line = line.replace(/[📌💰📈🔍💡📊🟢🟡🔴✅❗❌📝↑↓→]/g, '').trim()

      // 섹션 타이틀 감지
      const sectionMatch = line.match(/^(\d+\.)\s*(.+)/)
      if (sectionMatch) {
        flushList()
        flushTable()
        flushSection()
        currentSection = { title: sectionMatch[2] }
        continue
      }

      // 강점/약점 표 감지 (투자 포인트, 강점, 약점)
      if (line.match(/^\*\*투자 포인트\*\*:/) || line.match(/^투자 포인트:/)) {
        flushList()
        flushTable()
        tableData = {
          headers: ['구분', '내용'],
          rows: []
        }
        continue
      }

      // 표 데이터 수집 (강점/약점)
      if (tableData && (line.match(/^강점/) || line.match(/^약점/) || line.match(/^리스크/))) {
        const match = line.match(/^(강점|약점|리스크)\s*(.+)/)
        if (match) {
          const type = match[1]
          const content = match[2].replace(/[:\s]/g, '').trim()
          tableData.rows.push([type, content])
        }
        continue
      }

      // 리스트 항목 감지
      const listMatch = line.match(/^[-*]\s*(.+)/)
      if (listMatch) {
        flushTable()
        listItems.push(listMatch[1])
        continue
      }

      // 투자 등급 감지
      const gradeMatch = line.match(/\*\*투자 등급\*\*:\s*(매수|보유|매도)/)
      if (gradeMatch) {
        flushList()
        flushTable()
        const grade = gradeMatch[1]
        let gradeClass = 'hold'
        if (grade === '매수') gradeClass = 'buy'
        if (grade === '매도') gradeClass = 'sell'
        
        sectionContent.push(
          <div key={`grade-${i}`} className={`investment-grade ${gradeClass}`}>
            투자 등급: {grade}
          </div>
        )
        continue
      }

      // 강조 박스 (목표가, 전략 등)
      if (line.match(/\*\*(목표|전략|리스크)\*\*/)) {
        flushList()
        flushTable()
        const cleanLine = line.replace(/\*\*/g, '')
        sectionContent.push(
          <div key={`box-${i}`} className="highlight-box">
            <div className="highlight-box-content">{parseInlineStyles(cleanLine)}</div>
          </div>
        )
        continue
      }

      // 일반 텍스트
      if (line && !line.match(/^━/)) {
        flushList()
        flushTable()
        sectionContent.push(
          <p key={`text-${i}`}>{parseInlineStyles(line)}</p>
        )
      }
    }

    flushList()
    flushTable()
    flushSection()
    return elements
  }

  // 인라인 스타일 파싱 (**, 금액, 키워드)
  const parseInlineStyles = (text) => {
    const parts = []
    let lastIndex = 0

    // **키워드** 형식 파싱
    const boldRegex = /\*\*(.*?)\*\*/g
    let match

    while ((match = boldRegex.exec(text)) !== null) {
      // 이전 텍스트 추가
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      
      // 강조 텍스트 추가
      const keyword = match[1]
      parts.push(
        <span key={`keyword-${match.index}`} className="keyword-highlight">
          {keyword}
        </span>
      )
      
      lastIndex = match.index + match[0].length
    }

    // 남은 텍스트 추가
    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex)
      // 금액 형식 강조 (XX조원, XX억원 등)
      const amountRegex = /(\d+\.?\d*[조억만]원?)/g
      let remainingParts = []
      let lastAmountIndex = 0
      
      while ((match = amountRegex.exec(remaining)) !== null) {
        if (match.index > lastAmountIndex) {
          remainingParts.push(remaining.substring(lastAmountIndex, match.index))
        }
        remainingParts.push(
          <span key={`amount-${match.index}`} className="keyword-amount">
            {match[1]}
          </span>
        )
        lastAmountIndex = match.index + match[0].length
      }
      
      if (lastAmountIndex < remaining.length) {
        remainingParts.push(remaining.substring(lastAmountIndex))
      }
      
      parts.push(...remainingParts)
    }

    return parts.length > 0 ? parts : text
  }

  useEffect(() => {
    fetchReportCodes()
  }, [])

  useEffect(() => {
    if (company) {
      fetchFinancialData()
    }
  }, [company, year, reportCode])

  const fetchReportCodes = async () => {
    try {
      const response = await axios.get('/api/report-codes')
      setReportCodes(response.data)
    } catch (err) {
      console.error('보고서 코드 조회 실패:', err)
    }
  }

  const fetchFinancialData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get('/api/financial-statement', {
        params: {
          corp_code: company.corp_code,
          bsns_year: year,
          reprt_code: reportCode
        }
      })

      if (response.data.status === '000') {
        setData(response.data.list)
      } else {
        setError(response.data.message || '데이터를 불러올 수 없습니다.')
      }
    } catch (err) {
      setError('재무제표 조회 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount) => {
    if (!amount) return 0
    const num = parseInt(amount.replace(/,/g, ''))
    return num / 1000000000000 // 조 단위
  }

  // 금액을 읽기 쉬운 형식으로 변환 (원 단위)
  const formatAmountWithUnit = (amount) => {
    if (!amount || amount === '-') return '-'
    const num = parseInt(amount.replace(/,/g, ''))
    
    if (num >= 1000000000000) {
      return `${(num / 1000000000000).toFixed(2)}조원`
    } else if (num >= 100000000) {
      return `${(num / 100000000).toFixed(0)}억원`
    } else if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}만원`
    }
    return `${num.toLocaleString()}원`
  }

  // 날짜에서 연도 추출
  const extractYear = (dateStr) => {
    if (!dateStr) return ''
    const match = dateStr.match(/(\d{4})/)
    return match ? match[1] : ''
  }

  // 재무비율 계산
  const calculateFinancialRatios = () => {
    if (!data) return { ratios: [], ratioData: {} }

    const cfsData = data.filter(item => item.fs_div === 'CFS')
    
    // 필요한 데이터 추출 (숫자로 변환)
    const getAmount = (accountName, period) => {
      const item = cfsData.find(d => d.account_nm === accountName)
      if (!item) return 0
      const amountStr = item[period] || '0'
      return parseInt(amountStr.replace(/,/g, '')) || 0
    }

    // 각 기간별 데이터
    const periods = [
      { key: 'thstrm_amount', label: '당기', year: '당기' },
      { key: 'frmtrm_amount', label: '전기', year: '전기' },
      { key: 'bfefrmtrm_amount', label: '전전기', year: '전전기' }
    ]

    const ratioData = {}
    const ratios = []

    periods.forEach(period => {
      const 자산총계 = getAmount('자산총계', period.key)
      const 부채총계 = getAmount('부채총계', period.key)
      const 자본총계 = getAmount('자본총계', period.key)
      const 유동자산 = getAmount('유동자산', period.key)
      const 유동부채 = getAmount('유동부채', period.key)
      const 매출액 = getAmount('매출액', period.key)
      const 영업이익 = getAmount('영업이익', period.key)
      const 당기순이익 = getAmount('당기순이익(손실)', period.key) || getAmount('당기순이익', period.key)

      // 부채비율 = (부채총계 / 자본총계) × 100
      const 부채비율 = 자본총계 !== 0 ? (부채총계 / 자본총계 * 100) : 0
      
      // ROE = (당기순이익 / 자본총계) × 100
      const ROE = 자본총계 !== 0 ? (당기순이익 / 자본총계 * 100) : 0
      
      // 유동비율 = (유동자산 / 유동부채) × 100
      const 유동비율 = 유동부채 !== 0 ? (유동자산 / 유동부채 * 100) : 0
      
      // 영업이익률 = (영업이익 / 매출액) × 100
      const 영업이익률 = 매출액 !== 0 ? (영업이익 / 매출액 * 100) : 0
      
      // 순이익률 = (당기순이익 / 매출액) × 100
      const 순이익률 = 매출액 !== 0 ? (당기순이익 / 매출액 * 100) : 0

      ratioData[period.label] = {
        부채비율,
        ROE,
        유동비율,
        영업이익률,
        순이익률
      }
    })

    // 차트용 데이터 변환
    ratios.push(
      { name: '부채비율(%)', 당기: ratioData.당기.부채비율, 전기: ratioData.전기.부채비율, 전전기: ratioData.전전기.부채비율 },
      { name: 'ROE(%)', 당기: ratioData.당기.ROE, 전기: ratioData.전기.ROE, 전전기: ratioData.전전기.ROE },
      { name: '유동비율(%)', 당기: ratioData.당기.유동비율, 전기: ratioData.전기.유동비율, 전전기: ratioData.전전기.유동비율 },
      { name: '영업이익률(%)', 당기: ratioData.당기.영업이익률, 전기: ratioData.전기.영업이익률, 전전기: ratioData.전전기.영업이익률 },
      { name: '순이익률(%)', 당기: ratioData.당기.순이익률, 전기: ratioData.전기.순이익률, 전전기: ratioData.전전기.순이익률 }
    )

    return { ratios, ratioData }
  }

  const prepareChartData = () => {
    if (!data) return { bs: [], is: [], yearLabels: {} }

    // 첫 번째 데이터에서 연도 정보 추출
    const firstItem = data[0]
    const yearLabels = {
      당기: extractYear(firstItem?.thstrm_dt) || '당기',
      전기: extractYear(firstItem?.frmtrm_dt) || '전기',
      전전기: extractYear(firstItem?.bfefrmtrm_dt) || '전전기'
    }

    // 재무상태표 (BS) - 연결재무제표만
    const bsData = data
      .filter(item => item.sj_div === 'BS' && item.fs_div === 'CFS')
      .filter(item => ['자산총계', '부채총계', '자본총계'].includes(item.account_nm))
      .map(item => ({
        name: item.account_nm,
        [yearLabels.당기]: formatAmount(item.thstrm_amount),
        [yearLabels.전기]: formatAmount(item.frmtrm_amount),
        [yearLabels.전전기]: formatAmount(item.bfefrmtrm_amount)
      }))

    // 손익계산서 (IS) - 연결재무제표만
    const isData = data
      .filter(item => item.sj_div === 'IS' && item.fs_div === 'CFS')
      .filter(item => ['매출액', '영업이익', '당기순이익(손실)'].includes(item.account_nm))
      .map(item => ({
        name: item.account_nm,
        [yearLabels.당기]: formatAmount(item.thstrm_amount),
        [yearLabels.전기]: formatAmount(item.frmtrm_amount),
        [yearLabels.전전기]: formatAmount(item.bfefrmtrm_amount)
      }))

    return { bs: bsData, is: isData, yearLabels }
  }

  // 재무상태표 박스 시각화를 위한 데이터 준비 (연도별)
  const prepareBalanceSheetBoxData = (period = 'thstrm_amount') => {
    if (!data) return null

    const cfsData = data.filter(item => item.fs_div === 'CFS' && item.sj_div === 'BS')
    
    const getAmount = (accountName) => {
      const item = cfsData.find(d => d.account_nm === accountName)
      if (!item) return 0
      const amountStr = item[period] || '0'
      return parseInt(amountStr.replace(/,/g, '')) || 0
    }

    const 자산총계 = getAmount('자산총계')
    const 유동자산 = getAmount('유동자산')
    const 비유동자산 = getAmount('비유동자산')
    const 부채총계 = getAmount('부채총계')
    const 유동부채 = getAmount('유동부채')
    const 비유동부채 = getAmount('비유동부채')
    const 자본총계 = getAmount('자본총계')

    const 총계 = 자산총계

    return {
      자산총계,
      유동자산,
      비유동자산,
      부채총계,
      유동부채,
      비유동부채,
      자본총계,
      총계,
      // 비율 계산 (0-100%)
      유동자산비율: 총계 > 0 ? (유동자산 / 총계 * 100) : 0,
      비유동자산비율: 총계 > 0 ? (비유동자산 / 총계 * 100) : 0,
      유동부채비율: 총계 > 0 ? (유동부채 / 총계 * 100) : 0,
      비유동부채비율: 총계 > 0 ? (비유동부채 / 총계 * 100) : 0,
      자본총계비율: 총계 > 0 ? (자본총계 / 총계 * 100) : 0,
    }
  }

  // 손익계산서 폭포수 시각화를 위한 데이터 준비 (연도별)
  const prepareIncomeStatementWaterfallData = (period = 'thstrm_amount') => {
    if (!data) return null

    const cfsData = data.filter(item => item.fs_div === 'CFS' && item.sj_div === 'IS')
    
    const getAmount = (accountName) => {
      const item = cfsData.find(d => d.account_nm === accountName)
      if (!item) return 0
      const amountStr = item[period] || '0'
      return parseInt(amountStr.replace(/,/g, '')) || 0
    }

    const 매출액 = getAmount('매출액')
    const 매출원가 = getAmount('매출원가')
    const 매출총이익 = getAmount('매출총이익') || (매출액 - 매출원가)
    const 판매비와관리비 = getAmount('판매비와관리비')
    const 영업이익 = getAmount('영업이익') || (매출총이익 - 판매비와관리비)
    const 영업외수익 = getAmount('영업외수익')
    const 영업외비용 = getAmount('영업외비용')
    const 법인세차감전 = getAmount('법인세비용차감전순이익') || (영업이익 + 영업외수익 - 영업외비용)
    const 법인세 = getAmount('법인세비용')
    const 당기순이익 = getAmount('당기순이익(손실)') || getAmount('당기순이익') || (법인세차감전 - Math.abs(법인세))

    return [
      { label: '매출액', amount: 매출액, type: 'revenue', operator: '' },
      { label: '매출원가', amount: 매출원가, type: 'expense', operator: '-' },
      { label: '매출총이익', amount: 매출총이익, type: 'profit', operator: '=' },
      { label: '판매관리비', amount: 판매비와관리비, type: 'expense', operator: '-' },
      { label: '영업이익', amount: 영업이익, type: 'profit', operator: '=' },
      { label: '영업외수익', amount: 영업외수익, type: 'revenue', operator: '+' },
      { label: '영업외비용', amount: 영업외비용, type: 'expense', operator: '-' },
      { label: '법인세차감전순이익', amount: 법인세차감전, type: 'profit', operator: '=' },
      { label: '법인세', amount: Math.abs(법인세), type: 'expense', operator: '-' },
      { label: '당기순이익', amount: 당기순이익, type: 'profit', operator: '=' }
    ]
  }

  // 차트 표시 연도 선택 상태
  const [selectedChartYear, setSelectedChartYear] = useState('당기')

  // 선택한 연도에 맞는 period 키 가져오기
  const getPeriodKey = (year) => {
    switch(year) {
      case '당기': return 'thstrm_amount'
      case '전기': return 'frmtrm_amount'
      case '전전기': return 'bfefrmtrm_amount'
      default: return 'thstrm_amount'
    }
  }

  const chartData = prepareChartData()
  const financialRatios = calculateFinancialRatios()
  
  // 선택한 연도에 따라 박스 데이터 준비
  const selectedPeriod = selectedChartYear === '연결' ? 'thstrm_amount' : getPeriodKey(selectedChartYear)
  const balanceSheetBoxData = prepareBalanceSheetBoxData(selectedPeriod)
  const incomeStatementWaterfallData = prepareIncomeStatementWaterfallData(selectedPeriod)

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= 2015; i--) {
      years.push(i.toString())
    }
    return years
  }

  const handleExplainWithAI = async () => {
    if (!data) return

    setAiLoading(true)
    setAiExplanation(null)

    try {
      const response = await axios.post('/api/explain-financial-statement', {
        company_name: company.corp_name,
        year: year,
        financial_data: { list: data }
      })

      if (response.data.explanation) {
        setAiExplanation(response.data.explanation)
      } else {
        setAiExplanation('AI 설명을 생성할 수 없습니다.')
      }
    } catch (err) {
      console.error('AI 설명 생성 오류:', err)
      const errorMsg = err.response?.data?.detail || err.message
      setAiExplanation(`❌ AI 설명 생성 실패\n\n오류: ${errorMsg}\n\n해결 방법:\n1. .env 파일에 GEMINI_API_KEY가 올바르게 설정되어 있는지 확인\n2. 백엔드 서버를 재시작\n3. API 키가 유효한지 확인 (https://aistudio.google.com/app/apikey)`)
    } finally {
      setAiLoading(false)
    }
  }

  const handleStockAnalysis = async () => {
    if (!company.stock_code) {
      alert('종목 코드가 없습니다.')
      return
    }

    setStockLoading(true)
    setShowStockAnalysis(true)
    setStockData(null)
    setInvestmentAnalysis(null)

    try {
      // 주가 데이터 가져오기
      const stockResponse = await axios.get('/api/stock-price', {
        params: {
          stock_code: company.stock_code,
          period: '1y'
        }
      })

      if (stockResponse.data.status === 'success') {
        setStockData(stockResponse.data)

        // 재무제표 데이터가 있으면 투자 분석도 함께 요청
        if (data) {
          setInvestmentLoading(true)
          const analysisResponse = await axios.post('/api/investment-analysis', {
            company_name: company.corp_name,
            stock_code: company.stock_code,
            year: year,
            financial_data: { list: data },
            stock_data: stockResponse.data
          })

          if (analysisResponse.data.analysis) {
            setInvestmentAnalysis(analysisResponse.data.analysis)
          }
          setInvestmentLoading(false)
        }
      }
    } catch (err) {
      console.error('주식 분석 오류:', err)
      const errorMsg = err.response?.data?.detail || err.message
      alert(`주식 데이터 조회 실패: ${errorMsg}`)
      setShowStockAnalysis(false)
    } finally {
      setStockLoading(false)
    }
  }

  // PDF 다운로드 함수
  const handleDownloadPDF = () => {
    const element = document.getElementById('ai-report-content')
    if (!element) {
      alert('보고서 내용을 찾을 수 없습니다.')
      return
    }

    // html2pdf 옵션 설정
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${company.corp_name}_AI분석보고서_${year}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    // html2pdf 라이브러리 동적 로드 및 PDF 생성
    import('html2pdf.js').then(html2pdf => {
      html2pdf.default().set(opt).from(element).save()
    }).catch(err => {
      console.error('PDF 생성 오류:', err)
      alert('PDF 생성 중 오류가 발생했습니다.')
    })
  }

  return (
    <div className="financial-viewer">
      <div className="viewer-header">
        <h2>{company.corp_name} ({company.stock_code})</h2>
        
        <div className="controls">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="control-select"
          >
            {generateYearOptions().map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>

          <select
            value={reportCode}
            onChange={(e) => setReportCode(e.target.value)}
            className="control-select"
          >
            {reportCodes.map(code => (
              <option key={code.code} value={code.code}>
                {code.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="viewer-status">데이터 로딩 중...</div>}
      {error && <div className="viewer-error">{error}</div>}

      {data && !loading && (
        <div className="charts-container">
          {/* AI 설명 섹션 */}
          <div className="ai-explanation-section">
            <div className="ai-header">
              <h3>AI분석 보고서</h3>
              <div className="ai-buttons">
                <button
                  onClick={handleStockAnalysis}
                  disabled={stockLoading || investmentLoading}
                  className="ai-button stock-button"
                >
                  {stockLoading || investmentLoading ? '분석 중...' : 'AI 분석'}
                </button>
                {investmentAnalysis && (
                  <button
                    onClick={handleDownloadPDF}
                    className="ai-button pdf-button"
                  >
                    PDF 다운
                  </button>
                )}
              </div>
            </div>

            {investmentAnalysis && (
              <div className="ai-explanation-content" id="ai-report-content">
                <div className="explanation-text">
                  {parseAIExplanation(investmentAnalysis)}
                </div>
              </div>
            )}
          </div>

          {/* 재무상태표 */}
          <div className="chart-section">
            <div className="chart-header-with-select">
              <h3>📈 재무상태표</h3>
              <select
                value={selectedChartYear}
                onChange={(e) => setSelectedChartYear(e.target.value)}
                className="year-select"
              >
                <option value="연결">연결 (전체 연도)</option>
                <option value="당기">{chartData.yearLabels.당기 || '당기'}</option>
                <option value="전기">{chartData.yearLabels.전기 || '전기'}</option>
                <option value="전전기">{chartData.yearLabels.전전기 || '전전기'}</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.bs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: '조원', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `${value.toFixed(2)}조원`} />
                <Legend />
                {(selectedChartYear === '연결' || selectedChartYear === '당기') && (
                  <Bar dataKey={chartData.yearLabels.당기} fill="#d4af37" />
                )}
                {(selectedChartYear === '연결' || selectedChartYear === '전기') && (
                  <Bar dataKey={chartData.yearLabels.전기} fill="#a8a8a8" />
                )}
                {(selectedChartYear === '연결' || selectedChartYear === '전전기') && (
                  <Bar dataKey={chartData.yearLabels.전전기} fill="#c0c0c0" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 재무상태표 박스 시각화 */}
          {balanceSheetBoxData && (
            <div className="chart-section">
              <h3>⚖️ 재무상태표 구조 (자산 = 부채 + 자본)</h3>
              <div className="balance-sheet-box-container">
                {/* 좌측: 자산 */}
                <div className="balance-box assets-box">
                  <div className="box-header">
                    <h4>자산</h4>
                    <span className="box-total">{formatAmountWithUnit(balanceSheetBoxData.자산총계.toString())}</span>
                  </div>
                  <div className="box-content">
                    {/* 유동자산 */}
                    <div 
                      className="box-item current-assets"
                      style={{ height: `${balanceSheetBoxData.유동자산비율}%` }}
                    >
                      <div className="item-label">유동자산</div>
                      <div className="item-amount">{formatAmountWithUnit(balanceSheetBoxData.유동자산.toString())}</div>
                      <div className="item-percent">{balanceSheetBoxData.유동자산비율.toFixed(1)}%</div>
                    </div>
                    {/* 비유동자산 */}
                    <div 
                      className="box-item non-current-assets"
                      style={{ height: `${balanceSheetBoxData.비유동자산비율}%` }}
                    >
                      <div className="item-label">비유동자산</div>
                      <div className="item-amount">{formatAmountWithUnit(balanceSheetBoxData.비유동자산.toString())}</div>
                      <div className="item-percent">{balanceSheetBoxData.비유동자산비율.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                {/* 등호 */}
                <div className="balance-equals">=</div>

                {/* 우측: 부채 + 자본 */}
                <div className="balance-box liabilities-equity-box">
                  <div className="box-header">
                    <h4>부채 + 자본</h4>
                    <span className="box-total">{formatAmountWithUnit((balanceSheetBoxData.부채총계 + balanceSheetBoxData.자본총계).toString())}</span>
                  </div>
                  <div className="box-content">
                    {/* 유동부채 */}
                    <div 
                      className="box-item current-liabilities"
                      style={{ height: `${balanceSheetBoxData.유동부채비율}%` }}
                    >
                      <div className="item-label">유동부채</div>
                      <div className="item-amount">{formatAmountWithUnit(balanceSheetBoxData.유동부채.toString())}</div>
                      <div className="item-percent">{balanceSheetBoxData.유동부채비율.toFixed(1)}%</div>
                    </div>
                    {/* 비유동부채 */}
                    <div 
                      className="box-item non-current-liabilities"
                      style={{ height: `${balanceSheetBoxData.비유동부채비율}%` }}
                    >
                      <div className="item-label">비유동부채</div>
                      <div className="item-amount">{formatAmountWithUnit(balanceSheetBoxData.비유동부채.toString())}</div>
                      <div className="item-percent">{balanceSheetBoxData.비유동부채비율.toFixed(1)}%</div>
                    </div>
                    {/* 자본 */}
                    <div 
                      className="box-item equity"
                      style={{ height: `${balanceSheetBoxData.자본총계비율}%` }}
                    >
                      <div className="item-label">자본총계</div>
                      <div className="item-amount">{formatAmountWithUnit(balanceSheetBoxData.자본총계.toString())}</div>
                      <div className="item-percent">{balanceSheetBoxData.자본총계비율.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 손익계산서 */}
          <div className="chart-section">
            <div className="chart-header-with-select">
              <h3>💰 손익계산서</h3>
              <select
                value={selectedChartYear}
                onChange={(e) => setSelectedChartYear(e.target.value)}
                className="year-select"
              >
                <option value="연결">연결 (전체 연도)</option>
                <option value="당기">{chartData.yearLabels.당기 || '당기'}</option>
                <option value="전기">{chartData.yearLabels.전기 || '전기'}</option>
                <option value="전전기">{chartData.yearLabels.전전기 || '전전기'}</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.is}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: '조원', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `${value.toFixed(2)}조원`} />
                <Legend />
                {(selectedChartYear === '연결' || selectedChartYear === '당기') && (
                  <Line type="monotone" dataKey={chartData.yearLabels.당기} stroke="#d4af37" strokeWidth={3} />
                )}
                {(selectedChartYear === '연결' || selectedChartYear === '전기') && (
                  <Line type="monotone" dataKey={chartData.yearLabels.전기} stroke="#6e6e73" strokeWidth={3} />
                )}
                {(selectedChartYear === '연결' || selectedChartYear === '전전기') && (
                  <Line type="monotone" dataKey={chartData.yearLabels.전전기} stroke="#a8a8a8" strokeWidth={3} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 손익계산서 폭포수 시각화 */}
          {incomeStatementWaterfallData && (
            <div className="chart-section">
              <h3>📊 손익계산서 구조</h3>
              <div className="income-waterfall-container">
                {incomeStatementWaterfallData.map((item, index) => (
                  <div key={index} className="waterfall-row">
                    {item.operator && (
                      <div className={`waterfall-operator operator-${item.type}`}>
                        {item.operator}
                      </div>
                    )}
                    <div className={`waterfall-item waterfall-${item.type}`}>
                      <div className="waterfall-label">{item.label}</div>
                      <div className="waterfall-amount">{formatAmountWithUnit(item.amount.toString())}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 재무비율 분석 */}
          <div className="chart-section">
            <h3>📊 재무비율 분석</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={financialRatios.ratios}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                <Legend />
                <Bar dataKey="당기" fill="#d4af37" />
                <Bar dataKey="전기" fill="#a8a8a8" />
                <Bar dataKey="전전기" fill="#c0c0c0" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 재무비율 상세 테이블 */}
          <div className="data-table">
            <h3>📈 재무비율 상세</h3>
            <div className="table-wrapper table-ratios">
              <table>
                <thead>
                  <tr>
                    <th>재무비율</th>
                    <th>{chartData.yearLabels.당기 || '당기'}</th>
                    <th>{chartData.yearLabels.전기 || '전기'}</th>
                    <th>{chartData.yearLabels.전전기 || '전전기'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="account-name">부채비율 (%)</td>
                    <td>{financialRatios.ratioData.당기?.부채비율?.toFixed(2) || '-'}%</td>
                    <td>{financialRatios.ratioData.전기?.부채비율?.toFixed(2) || '-'}%</td>
                    <td>{financialRatios.ratioData.전전기?.부채비율?.toFixed(2) || '-'}%</td>
                  </tr>
                  <tr>
                    <td className="account-name">ROE (자기자본이익률) (%)</td>
                    <td>{financialRatios.ratioData.당기?.ROE?.toFixed(2) || '-'}%</td>
                    <td>{financialRatios.ratioData.전기?.ROE?.toFixed(2) || '-'}%</td>
                    <td>{financialRatios.ratioData.전전기?.ROE?.toFixed(2) || '-'}%</td>
                  </tr>
                  <tr>
                    <td className="account-name">유동비율 (%)</td>
                    <td>{financialRatios.ratioData.당기?.유동비율?.toFixed(2) || '-'}%</td>
                    <td>{financialRatios.ratioData.전기?.유동비율?.toFixed(2) || '-'}%</td>
                    <td>{financialRatios.ratioData.전전기?.유동비율?.toFixed(2) || '-'}%</td>
                  </tr>
                  <tr>
                    <td className="account-name">영업이익률 (%)</td>
                    <td>{financialRatios.ratioData.당기?.영업이익률?.toFixed(2) || '-'}%</td>
                    <td>{financialRatios.ratioData.전기?.영업이익률?.toFixed(2) || '-'}%</td>
                    <td>{financialRatios.ratioData.전전기?.영업이익률?.toFixed(2) || '-'}%</td>
                  </tr>
                  <tr>
                    <td className="account-name">순이익률 (%)</td>
                    <td>{financialRatios.ratioData.당기?.순이익률?.toFixed(2) || '-'}%</td>
                    <td>{financialRatios.ratioData.전기?.순이익률?.toFixed(2) || '-'}%</td>
                    <td>{financialRatios.ratioData.전전기?.순이익률?.toFixed(2) || '-'}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 재무상태표 상세 데이터 */}
          <div className="data-table">
            <h3>📊 재무상태표 상세</h3>
            <div className="table-wrapper table-bs">
              <table>
                <thead>
                  <tr>
                    <th>계정명</th>
                    <th>{chartData.yearLabels.당기 || '당기'}</th>
                    <th>{chartData.yearLabels.전기 || '전기'}</th>
                    <th>{chartData.yearLabels.전전기 || '전전기'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    .filter(item => item.fs_div === 'CFS' && item.sj_div === 'BS')
                    .slice(0, 12)
                    .map((item, idx) => (
                      <tr key={idx}>
                        <td className="account-name">{item.account_nm}</td>
                        <td>{formatAmountWithUnit(item.thstrm_amount)}</td>
                        <td>{formatAmountWithUnit(item.frmtrm_amount)}</td>
                        <td>{formatAmountWithUnit(item.bfefrmtrm_amount)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 손익계산서 상세 데이터 */}
          <div className="data-table">
            <h3>💰 손익계산서 상세</h3>
            <div className="table-wrapper table-is">
              <table>
                <thead>
                  <tr>
                    <th>계정명</th>
                    <th>{chartData.yearLabels.당기 || '당기'}</th>
                    <th>{chartData.yearLabels.전기 || '전기'}</th>
                    <th>{chartData.yearLabels.전전기 || '전전기'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    .filter(item => item.fs_div === 'CFS' && item.sj_div === 'IS')
                    .slice(0, 12)
                    .map((item, idx) => (
                      <tr key={idx}>
                        <td className="account-name">{item.account_nm}</td>
                        <td>{formatAmountWithUnit(item.thstrm_amount)}</td>
                        <td>{formatAmountWithUnit(item.frmtrm_amount)}</td>
                        <td>{formatAmountWithUnit(item.bfefrmtrm_amount)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinancialStatementViewer
