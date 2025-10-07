#!/usr/bin/env python3
"""
Cronjob para finalizar desafios expirados automaticamente
Executar em background: python finalize_challenges.py &
"""
import schedule
import time
import requests
import sys
import os
from datetime import datetime

# Adicionar path do backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Challenge, SessionLocal

# Configurações
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5001')
CHECK_INTERVAL_HOURS = int(os.getenv('FINALIZE_INTERVAL_HOURS', 1))


def finalize_expired_challenges():
    """Finalizar desafios expirados automaticamente"""
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [CRON] Verificando desafios expirados...")

    session = SessionLocal()
    try:
        # Buscar desafios expirados
        now = datetime.utcnow()
        expired_challenges = session.query(Challenge).filter(
            Challenge.end_date < now,
            Challenge.status == 'active'
        ).all()

        if not expired_challenges:
            print(f"[CRON] ✅ Nenhum desafio expirado encontrado")
            return

        print(f"[CRON] 📊 {len(expired_challenges)} desafio(s) expirado(s) encontrado(s)")

        finalized_count = 0
        error_count = 0

        for challenge in expired_challenges:
            try:
                print(f"[CRON] 🏆 Finalizando desafio: {challenge.id} - {challenge.title}")

                # Chamar endpoint de finalização
                response = requests.post(
                    f'{BACKEND_URL}/api/challenges/{challenge.id}/finalize',
                    timeout=30
                )

                if response.status_code == 200:
                    data = response.json()
                    winners_count = data.get('winners_count', 0)
                    prize_pool = data.get('prize_pool', 0)

                    print(f"[CRON] ✅ Desafio {challenge.id} finalizado com sucesso")
                    print(f"[CRON]    - Vencedores: {winners_count}")
                    print(f"[CRON]    - Pool distribuído: R$ {prize_pool:.2f}")
                    finalized_count += 1
                else:
                    error_msg = response.json().get('error', 'Erro desconhecido')
                    print(f"[CRON] ❌ Erro ao finalizar {challenge.id}: {error_msg}")
                    error_count += 1

            except requests.exceptions.RequestException as e:
                print(f"[CRON] ❌ Erro de conexão ao finalizar {challenge.id}: {e}")
                error_count += 1
            except Exception as e:
                print(f"[CRON] ❌ Erro inesperado ao finalizar {challenge.id}: {e}")
                error_count += 1

        # Resumo da execução
        print(f"\n[CRON] 📊 RESUMO:")
        print(f"[CRON]    - Finalizados com sucesso: {finalized_count}")
        print(f"[CRON]    - Erros: {error_count}")
        print(f"[CRON]    - Total processado: {len(expired_challenges)}")

    except Exception as e:
        print(f"[CRON] ❌ Erro crítico no cronjob: {e}")
    finally:
        session.close()


def main():
    """Função principal do cronjob"""
    print("=" * 60)
    print("🤖 CRONJOB BETFIT - FINALIZADOR DE DESAFIOS")
    print("=" * 60)
    print(f"⏰ Intervalo: A cada {CHECK_INTERVAL_HOURS} hora(s)")
    print(f"🌐 Backend: {BACKEND_URL}")
    print("=" * 60)
    print()

    # Executar imediatamente na primeira vez
    print("[CRON] 🚀 Executando primeira verificação...")
    finalize_expired_challenges()

    # Agendar execução periódica
    schedule.every(CHECK_INTERVAL_HOURS).hours.do(finalize_expired_challenges)

    print(f"\n[CRON] ✅ Cronjob agendado! Próxima execução em {CHECK_INTERVAL_HOURS}h")
    print("[CRON] 💤 Aguardando... (Ctrl+C para parar)\n")

    # Loop infinito
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Verificar a cada minuto
    except KeyboardInterrupt:
        print("\n\n[CRON] 🛑 Cronjob interrompido pelo usuário")
        print("[CRON] 👋 Até logo!")


if __name__ == '__main__':
    main()
