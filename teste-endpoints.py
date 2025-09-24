#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:5001"

def test_endpoint(method, endpoint, data=None):
    """Testa um endpoint específico"""
    try:
        url = f"{BASE_URL}{endpoint}"
        print(f"\n🧪 Testando: {method} {url}")
        
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Sucesso: {json.dumps(result, indent=2)[:200]}...")
        else:
            print(f"   ❌ Erro: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Erro de conexão - Backend não está rodando")
    except requests.exceptions.Timeout:
        print(f"   ⏰ Timeout - Endpoint demorou para responder")
    except Exception as e:
        print(f"   ❌ Erro: {e}")

def main():
    print("🚀 Testando Endpoints do BetFit Backend")
    print("=" * 50)
    
    # Testar endpoints principais
    endpoints = [
        ("GET", "/api/health"),
        ("GET", "/api/challenges"),
        ("GET", "/api/categories"),
        ("GET", "/api/wallet/jogador@gmail.com"),
        ("GET", "/api/user/profile?email=jogador@gmail.com"),
        ("GET", "/api/test/user/jogador@gmail.com"),
        ("GET", "/api/activities/global?limit=5"),
        ("GET", "/api/admin/dashboard/metrics"),
        ("POST", "/api/auth/login", {"email": "jogador@gmail.com", "password": "123456"})
    ]
    
    for method, endpoint, *data in endpoints:
        test_endpoint(method, endpoint, data[0] if data else None)
    
    print("\n" + "=" * 50)
    print("✅ Teste concluído!")

if __name__ == "__main__":
    main()

