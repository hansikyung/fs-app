import React, { useState } from 'react'
import CompanySearch from './components/CompanySearch'
import FinancialStatementViewer from './components/FinancialStatementViewer'
import './App.css'

function App() {
  const [selectedCompany, setSelectedCompany] = useState(null)

  return (
    <div className="app">
      <header className="app-header">
        <h1>📊 재무제표 시각화</h1>
        <p>기업의 재무정보를 한눈에 확인하세요</p>
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