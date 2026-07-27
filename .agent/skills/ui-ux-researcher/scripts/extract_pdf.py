import sys
import json

import pdfplumber

def extract_pdf(pdf_path):

    try:
        results = {
            "source": pdf_path,
            "text_sample": "",
            "metadata": {},
            "colors": [],
            "fonts": []
        }
        
        with pdfplumber.open(pdf_path) as pdf:
            results["metadata"] = pdf.metadata
            if len(pdf.pages) > 0:
                first_page = pdf.pages[0]
                results["text_sample"] = first_page.extract_text()[:500] if first_page.extract_text() else ""
                
                # pdfplumber can extract object properties like color (stroking_color, non_stroking_color)
                # This depends heavily on PDF structure.
                # We will do a basic scan of objects on the first page
                
                colors = set()
                fonts = set()
                
                for char in first_page.chars[:200]: # Sample first 200 chars
                    if 'fontname' in char:
                        fonts.add(char['fontname'])
                    if 'non_stroking_color' in char and char['non_stroking_color']:
                        # colors in PDF are often tuples (0.1, 0.2, 0.3) or single numbers
                        colors.add(str(char['non_stroking_color']))
                        
                results["fonts"] = list(fonts)
                results["colors"] = list(colors)

        print(json.dumps(results, indent=2))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    extract_pdf(pdf_path)
