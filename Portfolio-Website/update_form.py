import re
import os

content_md_path = r'C:\Users\xthomk\.gemini\antigravity\brain\2e54ff69-41ed-4eeb-a2e4-b3d00e698e33\.system_generated\steps\2462\content.md'
target_html_path = r'Z:\My Drive\Antigravity\Monetization\Portfolio-Website\index.html'

with open(content_md_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Extract HTML content
match = re.search(r'<!DOCTYPE html>.*</html>', text, re.DOTALL)
if not match:
    print('HTML not found')
    exit(1)

html_content = match.group(0)

# The replacement form
new_form = '''<form class="contact-form" action="https://api.web3forms.com/submit" method="POST">
    <input type="hidden" name="access_key" value="fff4db53-8ee0-4143-884b-cdad8baf4852">
    <input type="hidden" name="redirect" value="https://pract.eu">

    <div class="form-group">
        <label for="name">Name / Company</label>
        <input type="text" id="name" name="name" required placeholder="John Doe">
    </div>
    
    <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required placeholder="john@pharma.com">
    </div>
    
    <div class="form-group">
        <label for="message">Message / Opportunity Details</label>
        <textarea id="message" name="message" rows="4" required placeholder="I'd love to connect regarding an opportunity at..."></textarea>
    </div>
    
    <button type="submit" class="btn-primary" style="width:100%;">Send Message</button>
</form>'''

# Replace the old form
old_form_pattern = r'<form class="contact-form".*?</form>'
new_html = re.sub(old_form_pattern, new_form, html_content, flags=re.DOTALL)

with open(target_html_path, 'w', encoding='utf-8') as f:
    f.write(new_html)

print('Successfully updated index.html')
