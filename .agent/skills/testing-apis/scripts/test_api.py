import requests
import json
import sys
import os

def test_endpoint(url, method="GET", data=None, headers=None, token=None):
    """
    Test an API endpoint.
    
    Args:
        url (str): The endpoint URL.
        method (str): HTTP method (GET, POST, PUT, DELETE, etc.).
        data (dict): Data to send in the request body (for POST/PUT).
        headers (dict): Additional headers.
        token (str): Bearer token for authentication.
    
    Returns:
        dict: Response status, text, and json (if applicable).
    """
    if headers is None:
        headers = {}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if data and isinstance(data, dict):
        headers["Content-Type"] = "application/json"
        data = json.dumps(data)
    
    try:
        response = requests.request(
            method=method,
            url=url,
            data=data,
            headers=headers,
            timeout=10
        )
        
        result = {
            "status_code": response.status_code,
            "url": url,
            "method": method,
            "response_text": response.text,
        }
        
        try:
            result["response_json"] = response.json()
        except ValueError:
            result["response_json"] = None
            
        return result
    except requests.exceptions.RequestException as e:
        return {
            "error": str(e),
            "url": url,
            "method": method
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "URL is required"}))
        sys.exit(1)
        
    url = sys.argv[1]
    method = sys.argv[2] if len(sys.argv) > 2 else "GET"
    data_str = sys.argv[3] if len(sys.argv) > 3 else None
    token = sys.argv[4] if len(sys.argv) > 4 else None
    
    data = None
    if data_str:
        try:
            data = json.loads(data_str)
        except json.JSONDecodeError:
            data = data_str
            
    result = test_endpoint(url, method, data, token=token)
    print(json.dumps(result, indent=2))
