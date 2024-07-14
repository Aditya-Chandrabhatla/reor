import React, { useEffect, useRef } from 'react'

import { DBQueryResult } from 'electron/main/vector-database/schema'
import posthog from 'posthog-js'
import { FaSearch } from 'react-icons/fa'

import { DBSearchPreview } from '../File/DBResultPreview'
import debounce from './utils'

interface SearchComponentProps {
  onFileSelect: (path: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: DBQueryResult[]
  setSearchResults: (results: DBQueryResult[]) => void
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  onFileSelect,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null) // Reference for the input field

  const handleSearch = async (query: string) => {
    const results: DBQueryResult[] = await window.database.search(query, 50)
    setSearchResults(results)
  }

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])
  const debouncedSearch = debounce((query: string) => handleSearch(query), 300)

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery)
    }
  }, [searchQuery, debouncedSearch])

  const openFileSelectSearch = (path: string) => {
    onFileSelect(path)
    posthog.capture('open_file_from_search')
  }

  return (
    <div className="h-below-titlebar overflow-y-auto overflow-x-hidden p-1">
      <div className="relative mr-1 rounded bg-neutral-800 p-2">
        <span className="absolute inset-y-0 left-0 mt-[2px] flex items-center pl-3">
          <FaSearch className="text-lg text-gray-200" size={14} />
        </span>
        <input
          ref={searchInputRef}
          type="text"
          className="mr-1 mt-1 h-8 w-full rounded-md border border-transparent bg-neutral-700 pl-7 pr-5 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Semantic search..."
        />
      </div>
      <div className="mt-2 w-full">
        {searchResults.length > 0 && (
          <div className="w-full">
            {searchResults.map((result) => (
              <DBSearchPreview
                key={`${result.notepath}-${result.subnoteindex}`}
                dbResult={result}
                onSelect={openFileSelectSearch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchComponent
