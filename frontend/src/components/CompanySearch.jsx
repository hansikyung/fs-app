import React, { useState } from 'react'
import axios from 'axios'
import './CompanySearch.css'

function CompanySearch({ onSelectCompany }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await axios.get('/api/companies/search', {
        params: { query: searchQuery }
      })
      setResults(response.data)
    } catch (err) {
      setError('검색 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    handleSearch(value)
  }

  const handleSelectCompany = (company) => {
    onSelectCompany(company)
    setQuery('')
    setResults([])
  }

  return (
    <div className="company-search">
      <div className="search-box">
        <input
          type="text"
          placeholder="회사명을 입력하세요 (예: 삼성전자)"
          value={query}
          onChange={handleInputChange}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      {loading && <div className="search-status">검색 중...</div>}
      {error && <div className="search-error">{error}</div>}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((company) => (
            <div
              key={company.corp_code}
              className="result-item"
              onClick={() => handleSelectCompany(company)}
            >
              <div className="company-name">{company.corp_name}</div>
              <div className="company-info">
                <span className="stock-code">{company.stock_code}</span>
                <span className="corp-code">{company.corp_code}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CompanySearch
