#!/usr/bin/env python3
"""
📺 IPTV Playlist Downloader
📅 Version: 1.1
⚙️ Function: Downloads M3U playlists and EPG guides
🔄 Update Frequency: Daily at 8AM (BRT)
"""

import requests
from datetime import datetime
import os

# 📁 Playlist Configuration
PLAYLISTS = {
    # M3U4U Playlists (Brazil)
    "http://m3u4u.com/m3u/3wk1y24kx7uzdevxygz7": "epgbrasil.m3u",
    "http://m3u4u.com/epg/3wk1y24kx7uzdevxygz7": "epgbrasil.xml.gz",
    
    # M3U4U Playlists (Brazil/Portugal)
    "http://m3u4u.com/m3u/782dyqdrqkh1xegen4zp": "epgbrasilportugal.m3u",
    "http://m3u4u.com/epg/782dyqdrqkh1xegen4zp": "epgbrasilportugal.xml.gz",
    
    # M3U4U Playlists (Portugal)
    "http://m3u4u.com/m3u/jq2zy9epr3bwxmgwyxr5": "epgportugal.m3u",
    "http://m3u4u.com/epg/jq2zy9epr3bwxmgwyxr5": "epgportugal.xml.gz",
    
    # Custom Playlists (GitLab)
    "https://gitlab.com/josieljefferson12/playlists/-/raw/main/playlist.m3u": "playlist.m3u",
    "https://gitlab.com/josielluz/playlists/-/raw/main/playlists.m3u": "playlists.m3u",
    "https://gitlab.com/josieljefferson12/playlists/-/raw/main/pornstars.m3u": "pornstars.m3u"
}

def download_file(url, filename):
    """
    📥 Download a file from URL and save locally
    Args:
        url (str): Remote file URL
        filename (str): Local filename to save
    """
    try:
        # 🔄 Create session with retry logic
        session = requests.Session()
        adapter = requests.adapters.HTTPAdapter(max_retries=3)
        session.mount('http://', adapter)
        session.mount('https://', adapter)
        
        # ⏳ Request with timeout and streaming
        response = session.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        # 💾 Save file in chunks (memory efficient)
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:  # Filter out keep-alive chunks
                    f.write(chunk)
        
        # 📝 Add timestamp footer
        timestamp = datetime.now().strftime("# Atualizado em %d/%m/%Y - %H:%M:%S BRT\n")
        with open(filename, 'a', encoding='utf-8') as f:
            f.write(timestamp)
            
        print(f"✅ {filename} downloaded successfully")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to download {filename}: {str(e)}")
        return False

def generate_file_list():
    """
    📋 Generate a list of downloaded files
    """
    file_list = []
    for filename in os.listdir('.'):
        if filename.endswith(('.m3u', '.xml.gz')):
            file_stats = os.stat(filename)
            file_list.append({
                'name': filename,
                'size': file_stats.st_size,
                'modified': datetime.fromtimestamp(file_stats.st_mtime).isoformat()
            })
    
    with open('downloaded_files.txt', 'w') as f:
        for item in file_list:
            f.write(f"{item['name']}|{item['size']}|{item['modified']}\n")

def main():
    """
    🚀 Main execution function
    """
    print("🔄 Starting playlist update...")
    print(f"⏰ Last update: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    
    # 📥 Download all playlists
    results = [download_file(url, name) for url, name in PLAYLISTS.items()]
    
    # 📊 Generate report
    generate_file_list()
    
    if all(results):
        print("✅ All playlists updated successfully!")
    else:
        print("⚠️ Some playlists failed to update")

if __name__ == "__main__":
    main()
