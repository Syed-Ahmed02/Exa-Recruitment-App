import os
import json
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
from exa_py import Exa

load_dotenv()

EXA_API_KEY = os.getenv("EXA_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL")
if not EXA_API_KEY or not OPENROUTER_API_KEY:
    print("Error: EXA_API_KEY or OPENROUTER_API_KEY is not set")


exa = Exa(api_key = EXA_API_KEY)
client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=OPENROUTER_API_KEY,
)

app = FastAPI(title="Exa Recruiting API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

UNIVERSITY_MAP = {
    "Guelph": "University of Guelph",
    "Conestoga": "Conestoga College",
    "Laurier": "Wilfrid Laurier University",
    "Waterloo": "University of Waterloo"
}

DEGREE_MAP = {
    "Bachelor's": "Bachelor's student",
    "Master's": "Master's student",
    "PhD": "PhD student",
    "Alumni": "Alumni"
}

class SearchRequest(BaseModel):
    name: str
    university: str 
    degree_status: str  

class ProfileDetailsRequest(BaseModel):
    linkedin_url: str

class LinkedinResult(BaseModel):
    url: str
    title: str

class ProfileDetails(BaseModel):
    summary: str
    social_links: Optional[List[str]]
    
def get_openai_response(prompt: str) -> str:
    response = client.chat.completions.create(
        model="x-ai/grok-4-fast:free", #Grok 4 fast because its free right now and fast :) 
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.0 # no randomness
    )
    return response.choices[0].message.content

@app.post("/search-linkedin", response_model=List[LinkedinResult])
async def search_linkedin(request: SearchRequest):
    

    university_full = UNIVERSITY_MAP[request.university]
    degree_term = DEGREE_MAP[request.degree_status]
    query = f'"{request.name}" "{university_full}" {degree_term}'

    try:
        search = exa.search(
            query=query,
            num_results=5,
            type="keyword",
            include_domains=["linkedin.com"]
        )
        results = [
            LinkedinResult(url=result.url, title=result.title)
            for result in search.results if "linkedin.com/in/" in result.url
        ]
        return results[:5]  
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Exa search failed: {str(e)}")
    
@app.post("/profile-details", response_model=ProfileDetails)
async def get_profile_details(request: ProfileDetailsRequest):
    try:
        li_search = exa.search_and_contents(
            query=f'"{request.linkedin_url}"',
            num_results=1,
            type="keyword",
            include_domains=["linkedin.com"],
            text={"include_html_tags": False}
        )
        if not li_search.results:
            raise ValueError("Could not fetch LinkedIn contents")
        contents = li_search.results[0].text or ""
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch LinkedIn: {str(e)}")

    summary_prompt = f"""Summarize this person's professional experience, education, and skills based on their LinkedIn profile. Keep it concise (3-5 sentences). Focus on AI/relevance if present. Contents: {contents}"""
    summary = get_openai_response(summary_prompt)

    name_prompt = f"""Extract the full name of the person from this LinkedIn content. Return only the name (e.g., 'John Doe') or 'Not sure' if unclear. Contents: {contents}"""
    name = get_openai_response(name_prompt).strip()
    #Not optimal, use structured output to extract social media links in future
    social_links = get_openai_response(f"""Extract the links of this users social media accounts from this LinkedIn. Return only the links as a list (e.g., ['https://github.com/Syed-Ahmed02',"syedd.com"]..etc) or '[]' if unclear. Contents: {contents}""")
    if "not sure" in name.lower():
        name = ""
        
    if "not sure" in social_links.lower():
        social_links = []
    else:
        social_links = json.loads(social_links)

    ### Inaccurate response from personal site and github url search, extract social media links from linkedin content instead
    # university_from_input = "" 
 
    # github_query = f'"{name}" site:github.com' if name else ""
    # github_url = None
    # if github_query:
    #     try:
    #         gh_search = exa.search(
    #             query=github_query,
    #             num_results=1,
    #             type="keyword",
    #             include_domains=["github.com"]
    #         )
    #         if gh_search.results:
    #             github_url = gh_search.results[0].url
    #     except:
    #         pass  


    # personal_query = f'"{name}"' if name else ""
    # personal_url = None
    # if personal_query:
    #     try:
    #         personal_search = exa.search_and_contents(
    #             query=personal_query,
    #             num_results=1,
    #             type="keyword",
    #             exclude_domains=["linkedin.com", "github.com", "twitter.com", "x.com"],
    #             text={"include_html_tags": False}
    #         )
    #         if personal_search.results:
    #             personal_url = personal_search.results[0].url
    #     except:
    #         pass  # Silently fail

    return ProfileDetails(
        summary=summary or "Summary not available",
        social_links=social_links,

    )    
    

