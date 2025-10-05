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

  // 재무상태표 박스 시각화를 위한 데이터 준비
  const prepareBalanceSheetBoxData = () => {
    if (!data) return null

    const cfsData = data.filter(item => item.fs_div === 'CFS' && item.sj_div === 'BS')
    
    const getAmount = (accountName) => {
      const item = cfsData.find(d => d.account_nm === accountName)
      if (!item) return 0
      const amountStr = item.thstrm_amount || '0'
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

  const chartData = prepareChartData()
  const financialRatios = calculateFinancialRatios()
  const balanceSheetBoxData = prepareBalanceSheetBoxData()

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
              <h3>🤖 AI 재무제표 해설</h3>
              <div className="ai-buttons">
                <button
                  onClick={handleExplainWithAI}
                  disabled={aiLoading}
                  className="ai-button"
                >
                  {aiLoading ? '분석 중...' : 'AI로 쉽게 설명받기'}
                </button>
                <button
                  onClick={handleStockAnalysis}
                  disabled={stockLoading}
                  className="ai-button stock-button"
                >
                  {stockLoading ? '주가 조회 중...' : '📈 최근 주식 현황'}
                </button>
              </div>
            </div>

            {aiExplanation && (
              <div className="ai-explanation-content">
                <div className="explanation-text">
                  {aiExplanation.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 주식 현황 섹션 */}
          {showStockAnalysis && stockData && (
            <div className="stock-analysis-section">
              <h3>📈 주식 현황 ({company.stock_code})</h3>

              {/* 주가 통계 */}
              <div className="stock-statistics">
                <div className="stat-card">
                  <div className="stat-label">현재가</div>
                  <div className="stat-value">{stockData.statistics.current_price.toLocaleString()}원</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">변동률</div>
                  <div className={`stat-value ${stockData.statistics.change_percent >= 0 ? 'positive' : 'negative'}`}>
                    {stockData.statistics.change_percent >= 0 ? '+' : ''}{stockData.statistics.change_percent.toFixed(2)}%
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">52주 최고</div>
                  <div className="stat-value">{stockData.statistics.high_52week.toLocaleString()}원</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">52주 최저</div>
                  <div className="stat-value">{stockData.statistics.low_52week.toLocaleString()}원</div>
                </div>
              </div>

              {/* 주가 차트 */}
              <div className="chart-section">
                <h4>주가 추이 (1년)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stockData.data.dates.map((date, idx) => ({
                    date: date,
                    price: stockData.data.prices[idx]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => {
                        const d = new Date(date)
                        return `${d.getMonth() + 1}/${d.getDate()}`
                      }}
                    />
                    <YAxis
                      label={{ value: '원', angle: -90, position: 'insideLeft' }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      formatter={(value) => `${value.toLocaleString()}원`}
                      labelFormatter={(date) => date}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#2563eb"
                      strokeWidth={2}
                      name="주가"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 거래량 차트 */}
              <div className="chart-section">
                <h4>거래량 추이</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stockData.data.dates.map((date, idx) => ({
                    date: date,
                    volume: stockData.data.volumes[idx]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => {
                        const d = new Date(date)
                        return `${d.getMonth() + 1}/${d.getDate()}`
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => value.toLocaleString()}
                      labelFormatter={(date) => date}
                    />
                    <Bar dataKey="volume" fill="#10b981" name="거래량" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* AI 투자 분석 */}
              {investmentLoading && (
                <div className="investment-loading">
                  <p>🤖 AI가 재무제표와 주가를 종합 분석 중입니다...</p>
                </div>
              )}

              {investmentAnalysis && (
                <div className="investment-analysis">
                  <h3>🤖 AI 종합 투자 분석</h3>
                  <div className="analysis-content">
                    {investmentAnalysis.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* 재무상태표 */}
          <div className="chart-section">
            <h3>📈 재무상태표 (연결)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.bs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: '조원', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `${value.toFixed(2)}조원`} />
                <Legend />
                <Bar dataKey={chartData.yearLabels.당기} fill="#d4af37" />
                <Bar dataKey={chartData.yearLabels.전기} fill="#a8a8a8" />
                <Bar dataKey={chartData.yearLabels.전전기} fill="#c0c0c0" />
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
            <h3>💰 손익계산서 (연결)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.is}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: '조원', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `${value.toFixed(2)}조원`} />
                <Legend />
                <Line type="monotone" dataKey={chartData.yearLabels.당기} stroke="#d4af37" strokeWidth={3} />
                <Line type="monotone" dataKey={chartData.yearLabels.전기} stroke="#6e6e73" strokeWidth={3} />
                <Line type="monotone" dataKey={chartData.yearLabels.전전기} stroke="#a8a8a8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

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
