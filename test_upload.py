import requests
import json
import uuid

def main():
    try:
        # Register
        email = f'test_{uuid.uuid4().hex[:6]}@example.com'
        print(f"Registering {email}...")
        res = requests.post('http://localhost:8000/api/auth/register', json={
            'email': email,
            'password': 'password123',
            'name': 'Test User'
        })
        print('Register status:', res.status_code)
        if res.status_code != 200:
            print("Register error:", res.text)
            return

        token = res.json()['access_token']
        print("Token obtained.")

        # Upload
        print('Uploading document...')
        files = {'file': ('test.txt', b'Hello world', 'text/plain')}
        headers = {'Authorization': f'Bearer {token}', 'X-Guest-Id': 'some-guest-id-123'}
        res = requests.post('http://localhost:8000/api/documents/upload', files=files, headers=headers)
        print('Upload status:', res.status_code)
        if res.status_code != 200:
            print("Upload error:", res.text)
        else:
            print("Upload successful:", res.json())
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
