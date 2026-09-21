import httpx
import json
from typing import Dict, Any
from app.utils.config import settings


class LLMService:
    """Groq LLM service for document understanding"""
    
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
    
    @property
    def is_available(self) -> bool:
        return bool(self.api_key) and self.api_key != "your-groq-api-key"
    
    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 2000,
        json_mode: bool = False,
    ) -> Dict[str, Any]:
        """Send chat completion request to Groq"""
        
        if not self.is_available:
            raise Exception("Groq API key not configured. Add GROQ_API_KEY to .env")
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        print(f"[LLM] Calling Groq: model={self.model}, json_mode={json_mode}")
        print(f"[LLM] Prompt length: {len(user_prompt)} chars")
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json=payload,
                )
                
                print(f"[LLM] Response status: {response.status_code}")
                
                if response.status_code != 200:
                    error_text = response.text[:500]
                    print(f"[LLM] Error response: {error_text}")
                    raise Exception(f"Groq API error {response.status_code}: {error_text}")
                
                data = response.json()
                
                # Safely extract content
                choices = data.get("choices", [])
                if not choices:
                    raise Exception(f"No choices in response: {data}")
                
                content = choices[0].get("message", {}).get("content", "")
                
                if not content:
                    raise Exception("Empty content in response")
                
                print(f"[LLM] Content length: {len(content)} chars")
                
                return {
                    "content": content,
                    "usage": data.get("usage", {}),
                    "model": data.get("model", self.model),
                }
                
        except httpx.TimeoutException:
            raise Exception("Groq API timeout - request took too long")
        except httpx.RequestError as e:
            raise Exception(f"Network error: {str(e)}")
        except Exception as e:
            print(f"[LLM] Exception: {e}")
            raise
    
    async def extract_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
    ) -> Dict[str, Any]:
        """Extract structured JSON from LLM"""
        
        result = await self.chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            json_mode=True,
            max_tokens=4000,
        )
        
        content = result.get("content", "")
        
        if not content:
            raise Exception("Empty response from LLM")
        
        print(f"[LLM] Raw response preview: {content[:200]}...")
        
        # Try to parse JSON
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as e:
            print(f"[LLM] JSON parse error: {e}")
            print(f"[LLM] Raw content: {content[:500]}")
            
            # Try to extract JSON from markdown code blocks
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
            if json_match:
                try:
                    parsed = json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    raise Exception(f"Invalid JSON in response: {content[:200]}")
            else:
                raise Exception(f"Could not parse JSON from response: {content[:200]}")
        
        if not isinstance(parsed, dict):
            raise Exception(f"Expected JSON object, got: {type(parsed)}")
        
        return {
            "data": parsed,
            "raw": content,
            "usage": result.get("usage", {}),
        }


llm_service = LLMService()