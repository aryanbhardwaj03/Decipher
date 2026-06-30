import httpx

doc_id = "623a8296-7ee0-43ae-884d-1445ba5bf9b2"
query = "dbms"

r = httpx.post(
    f"http://127.0.0.1:8000/api/search/{doc_id}",
    json={"query": query, "mode": "semantic"},
    headers={"X-Guest-Id": "0a0a39f8-09c5-40ec-8dae-e55b6510d76c"} 
)
print("Semantic:", r.status_code, r.text)

r = httpx.post(
    f"http://127.0.0.1:8000/api/search/{doc_id}",
    json={"query": query, "mode": "hybrid"},
    headers={"X-Guest-Id": "0a0a39f8-09c5-40ec-8dae-e55b6510d76c"} 
)
print("Hybrid:", r.status_code, r.text)
