"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/ui/shadcn-io/copy-button"
import Link from "next/link"

// TypeScript interfaces
interface LinkedinResult {
  url: string
  title: string
}

interface ProfileDetails {
  summary: string
  social_links?: string[]
}

export default function LinkedInSearchPage() {
  // State management
  const [name, setName] = useState("")
  const [university, setUniversity] = useState("Laurier")
  const [degreeStatus, setDegreeStatus] = useState("Bachelor's")
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search-linkedin`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile-details`, {
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
                  placeholder="Enter student's full name, eg. Syed Ahmed"
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
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </div>
                ) : (
                  "Search LinkedIn"
                )}
              </Button>
            </form>

            {/* LinkedIn Results */}
            {linkedinResults.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Top 5 LinkedIn Profiles</h2>
                <div className="space-y-2">
                  {linkedinResults.map((result, index) => (
                    <div
                      key={index}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-blue-600 hover:text-blue-800">{result.title}</div>
                          <div className="text-sm text-gray-500 mt-1">{result.url}</div>
                        </div>
                        <Button
                          onClick={() => handleProfileClick(result.url)}
                          disabled={loading}
                          className="ml-4"
                        >
                          {loading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                              Loading...
                            </div>
                          ) : (
                            "Select"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Profile Details */}
            {selectedProfile && (
              <div className="mt-8 bg-green-50 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Selected Profile: {selectedLinkedin}</h2>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-600">Loading profile details...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold ">Experience Summary</h3>
                        <CopyButton 
                          content={selectedProfile.summary}
                          onCopy={() => console.log("Summary copied!")}
                          variant="default"
                          size="sm"
                        />
                      </div>
                      <p className="text-gray-600 leading-relaxed">{selectedProfile.summary}</p>
                    </div>

                    {selectedProfile.social_links && selectedProfile.social_links.length > 0 && (
                      <div>
                        <span className="font-bold">Social Links: </span>
                        <ul className="list-disc list-inside mt-1">
                          {selectedProfile.social_links.map((link: string, idx: number) => (
                            <li key={idx}>
                              <Link
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {link}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                   
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          Built by{" "}
          <Link
            href="https://www.linkedin.com/in/syed-ahmedd/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Syed
          </Link>{" "}
          :)
        </div>
      </div>
    </div>
  )
}
