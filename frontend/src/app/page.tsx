"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// TypeScript interfaces
interface LinkedinResult {
  url: string
  title: string
}

interface ProfileDetails {
  summary: string
  github_url?: string
  personal_website?: string
}

export default function LinkedInSearchPage() {
  // State management
  const [name, setName] = useState("")
  const [university, setUniversity] = useState("Waterloo")
  const [degreeStatus, setDegreeStatus] = useState("PhD")
  const [linkedinResults, setLinkedinResults] = useState<LinkedinResult[]>([])
  const [selectedProfile, setSelectedProfile] = useState<ProfileDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedLinkedin, setSelectedLinkedin] = useState("")

  // Handle form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert("Please enter a student name")
      return
    }

    setLoading(true)
    setSelectedProfile(null)

    try {
      const response = await fetch("http://localhost:8000/search-linkedin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          university,
          degree_status: degreeStatus,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const results = await response.json()
      setLinkedinResults(results.slice(0, 5)) // Ensure max 5 results
    } catch (error) {
      alert(`Search error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle profile selection
  const handleProfileClick = async (url: string) => {
    setSelectedLinkedin(url)
    setLoading(true)

    try {
      const response = await fetch("http://localhost:8000/profile-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkedin_url: url,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const profileData = await response.json()
      setSelectedProfile(profileData)
    } catch (error) {
      alert(`Profile details error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-2xl">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">LinkedIn Profile Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Student's Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter student's full name"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="university" className="block text-sm font-medium mb-2">
                  University
                </label>
                <Select value={university} onValueChange={setUniversity}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Guelph">Guelph</SelectItem>
                    <SelectItem value="Conestoga">Conestoga</SelectItem>
                    <SelectItem value="Laurier">Laurier</SelectItem>
                    <SelectItem value="Waterloo">Waterloo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="degree" className="block text-sm font-medium mb-2">
                  Degree Status
                </label>
                <Select value={degreeStatus} onValueChange={setDegreeStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bachelor's">Bachelor's</SelectItem>
                    <SelectItem value="Master's">Master's</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                    <SelectItem value="Alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? "Searching..." : "Search LinkedIn"}
              </Button>
            </form>

            {/* LinkedIn Results */}
            {linkedinResults.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Top 5 LinkedIn Profiles</h2>
                <div className="space-y-2">
                  {linkedinResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleProfileClick(result.url)}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      disabled={loading}
                    >
                      <div className="font-semibold text-blue-600 hover:text-blue-800">{result.title}</div>
                      <div className="text-sm text-gray-500 mt-1">{result.url}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Profile Details */}
            {selectedProfile && (
              <div className="mt-8 bg-green-50 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Selected Profile: {selectedLinkedin}</h2>

                {loading ? (
                  <div className="text-center py-4">
                    <p>Loading...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold mb-2">Experience Summary</h3>
                      <p className="text-gray-600 leading-relaxed">{selectedProfile.summary}</p>
                    </div>

                    {selectedProfile.github_url && (
                      <div>
                        <span className="font-bold">GitHub: </span>
                        <a
                          href={selectedProfile.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {selectedProfile.github_url}
                        </a>
                      </div>
                    )}

                    {selectedProfile.personal_website && (
                      <div>
                        <span className="font-bold">Personal Website: </span>
                        <a
                          href={selectedProfile.personal_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {selectedProfile.personal_website}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
