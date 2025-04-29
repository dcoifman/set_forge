import json
import time
import subprocess
import re
import random

def search_youtube(query):
    """Search for videos on YouTube using curl and parse the results."""
    # Format the query for URL
    formatted_query = query.replace(' ', '+')
    
    # Use curl to get search results
    cmd = f'curl -s "https://www.youtube.com/results?search_query={formatted_query}+exercise+tutorial"'
    try:
        result = subprocess.check_output(cmd, shell=True).decode('utf-8')
        
        # Extract video IDs using regex
        video_ids = re.findall(r'watch\?v=(\S{11})', result)
        
        # Return the first unique video ID found
        if video_ids:
            return f"https://www.youtube.com/watch?v={video_ids[0]}"
        return None
    except Exception as e:
        print(f"Error searching for {query}: {e}")
        return None

def update_exercise_videos():
    # Load exercises from JSON file
    with open('exercises.json', 'r') as f:
        exercises = json.load(f)
    
    updated_count = 0
    
    # Iterate through exercises and update video URLs
    for i, exercise in enumerate(exercises):
        # Only update if URL is a placeholder or empty
        if "example.com" in exercise.get("videoUrl", "") or not exercise.get("videoUrl"):
            print(f"Searching for video: {exercise['name']}")
            
            # Search for a video tutorial
            query = f"{exercise['name']} exercise tutorial"
            video_url = search_youtube(query)
            
            if video_url:
                exercises[i]["videoUrl"] = video_url
                updated_count += 1
                print(f"Updated: {exercise['name']} -> {video_url}")
            else:
                print(f"Could not find video for {exercise['name']}")
            
            # Add a delay to avoid rate limiting
            time.sleep(random.uniform(1.5, 3))
    
    # Write updated exercises back to the JSON file
    with open('exercises.json', 'w') as f:
        json.dump(exercises, f, indent=2)
    
    print(f"Updated {updated_count} exercise videos")

if __name__ == "__main__":
    update_exercise_videos() 