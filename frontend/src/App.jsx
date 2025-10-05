import React, { useState } from 'react'
import CompanySearch from './components/CompanySearch'
import FinancialStatementViewer from './components/FinancialStatementViewer'
import './App.css'

function App() {
  const [selectedCompany, setSelectedCompany] = useState(null)

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI-Finance 투자 분석 보고서</h1>
        <p>AI 기반 기업 재무분석 및 투자 인사이트</p>
      </header>

      <main className="app-main">
        <CompanySearch onSelectCompany={setSelectedCompany} />
        
        {selectedCompany && (
          <FinancialStatementViewer company={selectedCompany} />
        )}
      </main>

      <footer className="app-footer">
        <p>Data from DART (전자공시시스템)</p>
      </footer>
    </div>
  )
}

export default App