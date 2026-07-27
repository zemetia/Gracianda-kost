import sys
import requests
from bs4 import BeautifulSoup
import json
import re

def extract_colors(css_text):
    # simple regex for hex codes
    hex_colors = re.findall(r'#(?:[0-9a-fA-F]{3}){1,2}', css_text)
    return list(set(hex_colors))

def extract_from_url(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # This is a very basic extractor. 
        # In reality, getting "computed" styles from static HTML is hard without a browser.
        # We try to look for inline styles or style tags.
        
        styles = []
        for style in soup.find_all('style'):
            if style.string:
                styles.append(style.string)
        
        # Also look for link rel=stylesheet (we won't easier verify external css in this simple script, but we can list them)
        stylesheets = [link.get('href') for link in soup.find_all('link', rel='stylesheet')]
        
        # Extract potential colors from the inline styles we found
        all_css = "\n".join(styles)
        colors = extract_colors(all_css)
        
        # Extract fonts (simple search)
        fonts = re.findall(r'font-family:\s*([^;]+)', all_css)
        
        result = {
            "source": url,
            "stylesheets": stylesheets,
            "found_colors": colors[:10], # limit to 10
            "found_fonts": list(set(fonts))[:5],
            "title": soup.title.string if soup.title else "No Title",
            "headings": [h.get_text().strip() for h in soup.find_all(['h1', 'h2'])[:5]]
        }
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_web.py <url>")
        sys.exit(1)
    
    url = sys.argv[1]
    extract_from_url(url)
