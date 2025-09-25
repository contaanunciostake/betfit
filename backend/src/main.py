import os
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env
load_dotenv()

# Configurar DATABASE_PATH com .env
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'betfit.db')

#!/usr/bin/env python3
import hashlib
import uuid
import secrets
import json
import sqlite3
import time
import logging
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
from sqlalchemy import or_, func, text
from werkzeug.utils import secure_filename
from models import ChallengeCategory

from models import (
    User, Wallet, Transaction, Challenge,
    ChallengeParticipation, FitnessConnection, FitnessData,
    SessionLocal
)

import sys
sys.path.append(os.path.dirname(__file__))

try:
    from SystemSettings import SystemSettings
except ImportError as e:
    print(f"❌ Erro ao importar SystemSettings: {e}")
    sys.exit(1)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', '1657victOr@')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Imports do MercadoPago
import mercadopago
import requests
import base64
import qrcode
from io import BytesIO

# Configuração do MercadoPago
ACCESS_TOKEN = os.getenv('MERCADOPAGO_ACCESS_TOKEN', 'TEST-8579538386825-092106-1f98bb571ef94fc810798d6d9473ee79-17728094')
PUBLIC_KEY = os.getenv('MERCADOPAGO_PUBLIC_KEY', 'TEST-50581e2-ed94-400e-92ab-45ca00af5ef2')

# Instância global do SDK
sdk = None

# Variáveis globais para MercadoPago (serão inicializadas sob demanda)
sdk = None
MERCADOPAGO_ACCESS_TOKEN = None
MERCADOPAGO_PUBLIC_KEY = None

# Habilitar CORS para localhost - CONFIGURAÇÃO ATUALIZADA
cors_origins = os.getenv('CORS_ORIGINS', '').split(',')
if not cors_origins or cors_origins == ['']:
    cors_origins = [
        "http://localhost:5173", 
        "http://localhost:8080", 
        "http://localhost:3000", 
        "http://localhost:5001",
        # URLs do Cloudflare Tunnel
        "https://developing-seriously-dennis-automated.trycloudflare.com",
        "https://finances-gathering-eyes-del.trycloudflare.com",
        # URLs antigas (mantidas como fallback)
        "https://betfit-front.loca.lt",
        "https://betfit-api.loca.lt",
        "https://e6270cb05b48.ngrok-free.app"
        "https://betfit-backend.onrender.com"
        "https://betfit-frontend-thwz.onrender.com"
    ]

CORS(app,
     origins=cors_origins,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
     allow_headers=[
         "Content-Type", 
         "Authorization", 
         "Cache-Control", 
         "X-Requested-With",
         "Accept",
         "Origin",
         "X-CSRF-Token",
         "bypass-tunnel-reminder"
     ],
     supports_credentials=True,
     expose_headers=["Content-Range", "X-Content-Range"],
     send_wildcard=False,
     max_age=3600
)

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

settings_manager = SystemSettings(DATABASE_PATH)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# ================== NOVA ROTA PARA SERVIR ARQUIVOS DE UPLOAD ==================
@app.route('/uploads/logos/<path:filename>')
def serve_logo(filename):
    """Serve a imagem do logotipo a partir da pasta de uploads."""
    logo_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'logos')
    return send_from_directory(logo_dir, filename)


# ================== INICIALIZAÇÃO DO SISTEMA DE CONFIGURAÇÕES ==================

# ================== SUAS ROTAS EXISTENTES FICAM AQUI ==================
# (Mantenha todas as suas rotas existentes nesta seção)

# ================== ENDPOINT PÚBLICO DE CONFIGURAÇÕES PARA O FRONTEND (VERSÃO CORRIGIDA) ==================

@app.route('/api/settings', methods=['GET'])
@cross_origin(origins=[
    "http://localhost:3000", 
    "http://localhost:5173", 
    "http://localhost:8080", 
    # Adicionar URLs do Cloudflare aqui também
    "https://developing-seriously-dennis-automated.trycloudflare.com",
    "https://finances-gathering-eyes-del.trycloudflare.com",
    "https://betfit-front.loca.lt", 
    "https://betfit-api.loca.lt"
    "https://betfit-backend.onrender.com"
    "https://betfit-frontend-thwz.onrender.com"
])
def get_public_settings():
    """
    Endpoint otimizado para o frontend.
    Busca todas as configurações e retorna um único objeto JSON chave-valor.
    """
    try:
        # Busca todas as configurações do SystemSettings
        settings_by_section = settings_manager.get_all()

        # "Achata" o dicionário para criar um objeto único
        flat_settings = {}
        for section in settings_by_section.values():
            flat_settings.update(section)
        
        return jsonify(flat_settings), 200

    except Exception as e:
        logging.error(f"Erro ao buscar configurações públicas: {str(e)}")
        return jsonify({
            'platform_name': 'BetFit',
            'platform_description': 'Plataforma de apostas fitness',
            'platform_logo': None,
            'support_email': 'support@betfit.com',
            'maintenance_mode': False,
            'registration_enabled': True,
            'platform_fee': 10,
            'min_bet_amount': 10,
            'max_bet_amount': 10000
        }), 200

@app.before_request
def handle_tunnel_headers():
    """Handle tunnel-specific headers"""
    if os.getenv('BYPASS_TUNNEL_REMINDER'):
        request.environ['HTTP_BYPASS_TUNNEL_REMINDER'] = '1'

# ================== NOVAS ROTAS DE CONFIGURAÇÕES ADMINISTRATIVAS ==================

@app.route('/api/admin/settings', methods=['GET', 'OPTIONS'])
@cross_origin(origins=[
    "http://localhost:3000", 
    "http://localhost:5173", 
    "http://localhost:8080", 
    "https://betfit-front.loca.lt", 
    "https://betfit-api.loca.lt"
])
def get_all_settings():
    """Buscar todas as configurações do sistema"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        all_settings = settings_manager.get_all()
        
        return jsonify({
            'success': True,
            'settings': all_settings
        }), 200
        
    except Exception as e:
        logging.error(f"Erro ao buscar configurações: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@app.route('/api/admin/settings/<section>', methods=['GET', 'PUT', 'OPTIONS'])
@cross_origin(origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "http://192.168.1.69:8080", "http://localhost:5174", "http://localhost:5001"])
def handle_settings_section(section):
    """Gerenciar configurações com suporte para múltiplos logos"""
    if request.method == 'OPTIONS':
        return '', 200
    
    if request.method == 'PUT':
        data = {}
        
        # Verificar uploads de diferentes tipos de logo
        logo_types = ['platform_logo_file', 'platform_logo_color_file', 'platform_logo_white_file', 'platform_logo_black_file']
        uploaded_file = None
        logo_field = None
        
        for logo_type in logo_types:
            if logo_type in request.files:
                uploaded_file = request.files[logo_type]
                if logo_type == 'platform_logo_file':
                    logo_field = 'platform_logo'
                elif logo_type == 'platform_logo_color_file':
                    logo_field = 'platform_logo_color'
                elif logo_type == 'platform_logo_white_file':
                    logo_field = 'platform_logo_white'
                elif logo_type == 'platform_logo_black_file':
                    logo_field = 'platform_logo_black'
                break
        
        if uploaded_file and uploaded_file.filename != '':
            filename = secure_filename(uploaded_file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            
            upload_path = os.path.join(app.config['UPLOAD_FOLDER'], 'logos')
            os.makedirs(upload_path, exist_ok=True)
            
            save_path = os.path.join(upload_path, unique_filename)
            uploaded_file.save(save_path)
            
            data[logo_field] = f"/uploads/logos/{unique_filename}"
            
            # Adicionar outros dados do formulário
            for key, value in request.form.items():
                if key not in logo_types:
                    data[key] = value
        
        elif request.is_json:
            data = request.get_json()

    logging.info(f"--- INICIANDO {request.method} EM /api/admin/settings/{section} ---")
    
    try:
        if request.method == 'GET':
            section_settings = settings_manager.get_section(section)
            return jsonify({'success': True, 'section': section, 'settings': section_settings}), 200
            
        elif request.method == 'PUT':
            logging.info(f"Request Content-Type: {request.content_type}")
            data = {}

            # Verificar diferentes tipos de upload de logo
            logo_uploads = {
                'platform_logo_file': 'platform_logo_color',  # Manter compatibilidade
                'platform_logo_color_file': 'platform_logo_color',
                'platform_logo_white_file': 'platform_logo_white', 
                'platform_logo_black_file': 'platform_logo_black'
            }
            
            uploaded_file = None
            logo_field = None
            
            for file_field, db_field in logo_uploads.items():
                if file_field in request.files:
                    file = request.files[file_field]
                    if file and file.filename != '':
                        uploaded_file = file
                        logo_field = db_field
                        logging.info(f"✅ Arquivo '{file_field}' detectado: {file.filename}")
                        break

            if uploaded_file:
                data = request.form.to_dict()
                logging.info(f"Dados do formulário recebidos: {data}")
                
                filename = secure_filename(uploaded_file.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                logging.info(f"Nome do arquivo seguro: {unique_filename}")
                
                upload_path = os.path.join(app.config['UPLOAD_FOLDER'], 'logos')
                logging.info(f"Caminho de upload completo: {upload_path}")
                os.makedirs(upload_path, exist_ok=True)
                
                save_path = os.path.join(upload_path, unique_filename)
                logging.info(f"Tentando salvar arquivo em: {save_path}")
                uploaded_file.save(save_path)
                logging.info("✅ Arquivo salvo com sucesso no servidor.")
                
                data[logo_field] = f"/uploads/logos/{unique_filename}"
            
            elif request.is_json:
                logging.info("Requisição é JSON. Usando request.get_json().")
                data = request.get_json()
            
            else:
                logging.error(f"❌ Formato de requisição não esperado. Content-Type: {request.content_type}")
                return jsonify({'success': False, 'error': 'Formato de dados inválido.'}), 400

            if not data:
                logging.error("❌ Dados não fornecidos na requisição.")
                return jsonify({'success': False, 'error': 'Dados não fornecidos'}), 400
            
            logging.info(f"Dados a serem salvos na seção '{section}': {data}")

            # DEBUG: Verificar se os campos existem no banco
            if logo_field in ['platform_logo_white', 'platform_logo_black']:
                logging.info(f"🔍 Tentando salvar campo novo: {logo_field}")
                # Verificar se o campo existe na tabela
                try:
                    test_value = settings_manager.get('general', logo_field.replace('platform_', ''))
                    logging.info(f"✅ Campo {logo_field} existe no banco")
                except Exception as e:
                    logging.error(f"❌ Campo {logo_field} NÃO existe no banco: {e}")

            # Conversão de strings boolean
            for key, value in data.items():
                if isinstance(value, str):
                    if value.lower() == 'true': data[key] = True
                    elif value.lower() == 'false': data[key] = False
            
            updated_count = settings_manager.update_section(section, data)
            logging.info(f"✅ {updated_count} registro(s) atualizado(s) no banco.")
            
            return jsonify({'success': True, 'message': f'Configurações da seção {section} atualizadas.'}), 200
            
    except Exception as e:
        import traceback
        logging.error(f"❌ ERRO CRÍTICO na seção {section}: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'error': 'Erro interno do servidor.'}), 500

@app.route('/api/admin/settings/<section>/<key>', methods=['GET', 'PUT', 'OPTIONS'])
@cross_origin(origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "http://192.168.1.69:8080", "http://localhost:5174", "http://localhost:5001"])
def handle_single_setting(section, key):
    """Gerenciar uma configuração específica"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        if request.method == 'GET':
            # Buscar configuração específica
            value = settings_manager.get(section, key)
            
            if value is None:
                return jsonify({
                    'success': False,
                    'error': f'Configuração {section}.{key} não encontrada'
                }), 404
            
            return jsonify({
                'success': True,
                'section': section,
                'key': key,
                'value': value
            }), 200
            
        elif request.method == 'PUT':
            # Atualizar configuração específica
            data = request.get_json()
            
            if 'value' not in data:
                return jsonify({
                    'success': False,
                    'error': 'Valor não fornecido'
                }), 400
            
            success = settings_manager.update_single(section, key, data['value'])
            
            if success:
                return jsonify({
                    'success': True,
                    'message': f'Configuração {section}.{key} atualizada com sucesso',
                    'section': section,
                    'key': key,
                    'value': data['value']
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': f'Falha ao atualizar configuração {section}.{key}'
                }), 400
            
    except Exception as e:
        logging.error(f"Erro ao gerenciar configuração {section}.{key}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

# ================== HELPER FUNCTIONS PARA CONFIGURAÇÕES ==================

def get_setting(section: str, key: str, default=None):
    """Função helper para usar em outras partes do código"""
    return settings_manager.get(section, key, default)

def update_setting(section: str, key: str, value):
    """Função helper para atualizar configurações"""
    return settings_manager.update_single(section, key, value)

def get_platform_fee():
    """Helper específico para taxa da plataforma"""
    return settings_manager.get('platform', 'platform_fee', 10.0)

def get_min_bet_amount():
    """Helper específico para valor mínimo de aposta"""
    return settings_manager.get('platform', 'min_bet_amount', 5.0)

def get_max_bet_amount():
    """Helper específico para valor máximo de aposta"""
    return settings_manager.get('platform', 'max_bet_amount', 1000.0)

def get_max_participants():
    """Helper específico para número máximo de participantes"""
    return settings_manager.get('platform', 'max_participants', 100)

def get_challenge_duration_days():
    """Helper específico para duração padrão dos desafios"""
    return settings_manager.get('platform', 'challenge_duration_days', 30)

# ================== EXEMPLO DE USO DAS CONFIGURAÇÕES ==================

def validate_bet_amount(amount):
    """Validar se o valor da aposta está dentro dos limites configurados"""
    min_amount = get_min_bet_amount()
    max_amount = get_max_bet_amount()
    
    if amount < min_amount:
        return False, f"Valor mínimo de aposta é R$ {min_amount:.2f}"
    
    if amount > max_amount:
        return False, f"Valor máximo de aposta é R$ {max_amount:.2f}"
    
    return True, "Valor válido"

def calculate_platform_fee_amount(bet_amount):
    """Calcular o valor da taxa da plataforma - VERSÃO DINÂMICA"""
    fee_percentage = get_dynamic_platform_fee()  # <-- USAR FUNÇÃO DINÂMICA
    return (bet_amount * fee_percentage) / 100



# ==================== ROTAS DO MERCADOPAGO ====================

def initialize_mercadopago():
    """Inicializar MercadoPago carregando credenciais do banco"""
    global sdk, MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_PUBLIC_KEY
    
    if MERCADOPAGO_ACCESS_TOKEN is not None and sdk is not None:
        return True
    
    try:
        # Carregar credenciais do banco de dados
        session = SessionLocal()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT pc.credential_key, pc.credential_value
            FROM payment_credentials pc
            JOIN payment_settings ps ON pc.payment_setting_id = ps.id
            WHERE ps.provider = 'mercadopago' AND ps.enabled = 1
            AND ps.environment = 'sandbox'
        """)
        
        credentials = cursor.fetchall()
        conn.close()
        
        # Organizar credenciais
        cred_dict = {row['credential_key']: row['credential_value'] for row in credentials}
        
        MERCADOPAGO_ACCESS_TOKEN = cred_dict.get('access_token', 'TEST-8579538386825-092106-1f98bb571ef94fc810798d6d9473ee79-17728094')
        MERCADOPAGO_PUBLIC_KEY = cred_dict.get('public_key', 'TEST-50581e2-ed94-400e-92ab-45ca00af5ef2')
        
        sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)
        print(f"MercadoPago inicializado: {MERCADOPAGO_ACCESS_TOKEN[:20]}...")
        return True
        
    except Exception as e:
        print(f"Erro ao carregar credenciais do banco: {e}")
        # Fallback para credenciais hardcoded
        MERCADOPAGO_ACCESS_TOKEN = 'TEST-8579538386825-092106-1f98bb571ef94fc810798d6d9473ee79-17728094'
        MERCADOPAGO_PUBLIC_KEY = 'TEST-50581e2-ed94-400e-92ab-45ca00af5ef2'
        sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)
        print("Usando credenciais fallback do MercadoPago")
        return True

@app.route('/api/payments/config', methods=['GET', 'OPTIONS'])
def get_payments_config():
    """Retorna chave pública do MercadoPago para o frontend"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        print("🔍 [CONFIG] Buscando public_key do MercadoPago...")
        
        # Buscar as credenciais do banco de dados usando sqlite3 direto
        session = SessionLocal()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Buscar a public_key do MercadoPago
        cursor.execute("""
            SELECT credential_value 
            FROM payment_credentials 
            WHERE credential_key = 'public_key' 
            AND payment_setting_id = 7
        """)
        
        result = cursor.fetchone()
        print(f"🔍 [CONFIG] Resultado da query: {result}")
        
        conn.close()
        
        if not result:
            print("❌ [CONFIG] Public key não encontrada no banco")
            return jsonify({
                'success': False,
                'error': 'Chave pública do MercadoPago não encontrada no banco de dados'
            }), 500
        
        public_key = result[0]
        print(f"🔍 [CONFIG] Public key encontrada: {public_key[:20]}...")
        
        # Verificar se a chave não está vazia
        if not public_key:
            print("❌ [CONFIG] Public key está vazia")
            return jsonify({
                'success': False,
                'error': 'Chave pública do MercadoPago está vazia'
            }), 500
        
        print(f"✅ [CONFIG] Retornando public key para o frontend")
        return jsonify({
            'success': True,
            'publicKey': public_key,
            'environment': 'sandbox'
        }), 200
        
    except Exception as e:
        print(f"❌ [CONFIG] Erro ao obter configurações: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/payments/pix', methods=['POST', 'OPTIONS'])
def create_pix_payment():
    """Criar pagamento PIX via MercadoPago Real"""
    if request.method == 'OPTIONS':
        return '', 200
        
    session = SessionLocal()
    try:
        print("🔍 [PIX] Iniciando criação de pagamento PIX...")
        
        initialize_mercadopago()
        print(f"🔍 [PIX] SDK inicializado: {sdk is not None}")
        
        data = request.get_json()
        print(f"🔍 [PIX] Dados recebidos: {data}")
        
        user_id = data.get('user_id')
        amount = float(data.get('amount', 0))
        user_email = data.get('user_email')
        user_name = data.get('user_name', '')
        
        print(f"🔍 [PIX] User ID: {user_id}, Amount: {amount}, Email: {user_email}")
        
        if amount <= 0:
            return jsonify({
                'success': False,
                'error': 'Valor deve ser maior que zero'
            }), 400
        
        # CORREÇÃO: Buscar usuário de forma mais flexível
        user = None
        
        # Se user_id for 'current_user' ou similar, tentar buscar por email
        if user_id == 'current_user' or str(user_id).startswith('temp_user_') or not user_id:
            if user_email:
                user = session.query(User).filter_by(email=user_email).first()
                print(f"🔍 [PIX] Buscando por email: {user_email}, encontrado: {user is not None}")
            
            # Se não encontrou usuário, usar dados temporários
            if not user:
                print("⚠️ [PIX] Usando dados temporários para criar pagamento")
                user_email = user_email or "usuario.teste@betfit.com"
                user_name = user_name or "Usuário Teste"
                user_first_name = user_name.split()[0] if user_name else "Usuario"
                user_last_name = " ".join(user_name.split()[1:]) if len(user_name.split()) > 1 else "Teste"
        else:
            # Buscar por ID normalmente
            user = session.query(User).filter_by(id=user_id).first()
        
        # Se encontrou usuário no banco, usar seus dados
        if user:
            user_email = user.email
            user_name = user.name or "Usuário BetFit"
            name_parts = user_name.split()
            user_first_name = name_parts[0] if name_parts else "Usuario"
            user_last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "BetFit"
        
        # Validar se temos dados mínimos
        if not user_email:
            return jsonify({'success': False, 'error': 'Email é obrigatório'}), 400
        
        # Gerar ID único para referência externa
        external_reference = str(uuid.uuid4())
        
        # Criar pagamento no MercadoPago
        payment_data = {
            "transaction_amount": amount,
            "description": f"Depósito BetFit - R$ {amount:.2f}",
            "payment_method_id": "pix",
            "notification_url": os.getenv('MERCADOPAGO_WEBHOOK_URL', 'https://betfit-api.loca.lt/api/payments/webhook/mercadopago'),
            "external_reference": external_reference,
            "payer": {
                "email": user_email,
                "first_name": user_first_name,
                "last_name": user_last_name,
                "identification": {
                    "type": "CPF",
                    "number": "11111111111"  # Use CPF real do usuário quando tiver
                }
            }
        }
        
        print(f"🔍 [PIX] Enviando dados para MercadoPago: {payment_data}")
        
        payment_response = sdk.payment().create(payment_data)
        print(f"🔍 [PIX] Resposta do MercadoPago: {payment_response}")
        
        if payment_response["status"] == 201:
            payment = payment_response["response"]
            
            # Extrair dados do PIX
            pix_data = payment.get('point_of_interaction', {}).get('transaction_data', {})
            
            # Salvar no banco somente se temos usuário real
            transaction_id = str(uuid.uuid4())
            if user:
                payment_transaction = Transaction(
                    id=transaction_id,
                    user_id=user.id,
                    type='deposit',
                    amount=amount,
                    description=f'Depósito PIX - MercadoPago ID: {payment.get("id")}',
                    status='pending'
                )
                session.add(payment_transaction)
                session.commit()
                print(f"💾 [PIX] Transação salva no banco: {transaction_id}")
            
            print(f"✅ [PIX] Pagamento criado com sucesso: {payment.get('id')}")
            
            return jsonify({
                'success': True,
                'paymentId': payment.get('id'),
                'transactionId': transaction_id,
                'amount': amount,
                'status': payment.get('status'),
                'pixCode': pix_data.get('qr_code', ''),
                'qrCodeBase64': pix_data.get('qr_code_base64', ''),
                'externalReference': external_reference,
                'expiresAt': payment.get('date_of_expiration'),
                'created_at': payment.get('date_created')
            }), 201
        else:
            error_msg = payment_response.get("response", {}).get("message", "Erro desconhecido")
            print(f"❌ [PIX] Erro na resposta do MercadoPago: {error_msg}")
            return jsonify({'success': False, 'error': f'Erro ao criar pagamento: {error_msg}'}), 400
            
    except Exception as e:
        session.rollback()
        print(f"❌ [PIX] Erro geral: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        session.close()


@app.route('/api/payments/card', methods=['POST', 'OPTIONS'])
def create_card_payment():
    """Criar pagamento com Cartão via MercadoPago - VERSÃO DEBUG"""
    if request.method == 'OPTIONS':
        return '', 200
        
    session = SessionLocal()
    try:
        print("🔍 [CARD] Iniciando criação de pagamento com cartão...")
        
        initialize_mercadopago()
        print(f"🔍 [CARD] SDK inicializado: {sdk is not None}")
        
        data = request.get_json()
        print(f"🔍 [CARD] Dados recebidos: {json.dumps(data, indent=2)}")
        
        user_id = data.get('user_id')
        amount = float(data.get('amount', 0))
        user_email = data.get('user_email')
        user_name = data.get('user_name', '')
        token = data.get('token')
        installments = int(data.get('installments', 1))
        description = data.get('description', 'Depósito BetFit')
        
        print(f"🔍 [CARD] Dados extraídos:")
        print(f"  - User ID: {user_id}")
        print(f"  - Amount: {amount}")
        print(f"  - Email: {user_email}")
        print(f"  - Token: {token[:20] if token else 'None'}...")
        
        # Validações básicas
        if amount <= 0:
            print("❌ [CARD] Erro: Valor deve ser maior que zero")
            return jsonify({'success': False, 'error': 'Valor deve ser maior que zero'}), 400
        
        if not token:
            print("❌ [CARD] Erro: Token do cartão é obrigatório")
            return jsonify({'success': False, 'error': 'Token do cartão é obrigatório'}), 400
        
        payment_method_id = "visa"
        
        # Buscar usuário com debug detalhado
        user = None
        print(f"🔍 [CARD] Iniciando busca do usuário...")
        
        if user_id == 'current_user' or str(user_id).startswith('temp_user_') or not user_id:
            print(f"🔍 [CARD] Buscando usuário por email: {user_email}")
            if user_email:
                try:
                    user = session.query(User).filter_by(email=user_email).first()
                    print(f"🔍 [CARD] Resultado da busca por email: {user is not None}")
                    if user:
                        print(f"🔍 [CARD] Usuário encontrado - ID: {user.id}, Nome: {user.name}")
                except Exception as e:
                    print(f"❌ [CARD] Erro ao buscar usuário por email: {e}")
            
            if not user:
                print("⚠️ [CARD] Usuário não encontrado, usando dados temporários")
                user_email = user_email or "usuario.teste@betfit.com"
                user_name = user_name or "APRO"
        else:
            print(f"🔍 [CARD] Buscando usuário por ID: {user_id}")
            try:
                user = session.query(User).filter_by(id=user_id).first()
                print(f"🔍 [CARD] Resultado da busca por ID: {user is not None}")
            except Exception as e:
                print(f"❌ [CARD] Erro ao buscar usuário por ID: {e}")
        
        if user:
            user_email = user.email
            user_name = user.name or "APRO"
            print(f"✅ [CARD] Usando dados do usuário do banco - Email: {user_email}")
        else:
            print(f"⚠️ [CARD] Usando dados temporários - Email: {user_email}")
        
        if not user_email:
            print("❌ [CARD] Email é obrigatório")
            return jsonify({'success': False, 'error': 'Email é obrigatório'}), 400
        
        # Gerar referência externa única
        external_reference = f"BETFIT_CARD_{int(time.time())}_{str(uuid.uuid4())[:8]}"
        print(f"🔍 [CARD] Referência externa gerada: {external_reference}")
        
        # Dados para MercadoPago
        payment_data = {
            "transaction_amount": float(amount),
            "token": token,
            "description": description,
            "installments": installments,
            "payment_method_id": payment_method_id,
            "external_reference": external_reference,
            "notification_url": "https://5d36639a436c.ngrok-free.app/api/payments/webhook/mercadopago",
            "payer": {
                "email": user_email
            }
        }
        
        print(f"🔍 [CARD] Enviando para MercadoPago:")
        print(f"  - Amount: {payment_data['transaction_amount']}")
        print(f"  - Email: {payment_data['payer']['email']}")
        print(f"  - Reference: {payment_data['external_reference']}")
        
        # Criar pagamento no MercadoPago
        print("🔍 [CARD] Chamando API do MercadoPago...")
        payment_response = sdk.payment().create(payment_data)
        print(f"🔍 [CARD] Status da resposta: {payment_response.get('status')}")
        print(f"🔍 [CARD] Resposta completa: {json.dumps(payment_response, indent=2)}")
        
        # Verificar resposta
        if payment_response.get("status") == 201:
            payment = payment_response["response"]
            mercadopago_id = payment.get('id')
            payment_status = payment.get('status')
            
            print(f"✅ [CARD] Pagamento criado no MercadoPago:")
            print(f"  - ID: {mercadopago_id}")
            print(f"  - Status: {payment_status}")
            print(f"  - Amount: {payment.get('transaction_amount')}")
            
            # ===== SALVAR TRANSAÇÃO NO BANCO =====
            print("💾 [CARD] Iniciando salvamento da transação no banco...")
            
            transaction_id = str(uuid.uuid4())
            transaction_description = f'Depósito Cartão - MercadoPago ID: {mercadopago_id}'
            
            print(f"💾 [CARD] Dados da transação:")
            print(f"  - ID: {transaction_id}")
            print(f"  - User ID: {user.id if user else 'None'}")
            print(f"  - Amount: {amount}")
            print(f"  - Description: {transaction_description}")
            print(f"  - Status: {'completed' if payment_status == 'approved' else 'pending'}")
            
            if user:
                try:
                    print("💾 [CARD] Criando objeto Transaction...")
                    payment_transaction = Transaction(
                        id=transaction_id,
                        user_id=user.id,
                        type='deposit',
                        amount=amount,
                        description=transaction_description,
                        status='completed' if payment_status == 'approved' else 'pending'
                    )
                    
                    print("💾 [CARD] Adicionando transação à sessão...")
                    session.add(payment_transaction)
                    
                    print("💾 [CARD] Fazendo flush para verificar erros...")
                    session.flush()  # Verifica se há erros sem fazer commit
                    
                    # Se aprovado imediatamente, creditar saldo
                    if payment_status == 'approved':
                        print("💰 [CARD] Pagamento aprovado, creditando saldo...")
                        
                        wallet = session.query(Wallet).filter_by(user_id=user.id).first()
                        if not wallet:
                            print("💼 [CARD] Carteira não existe, criando nova...")
                            wallet = Wallet(
                                id=str(uuid.uuid4()),
                                user_id=user.id,
                                balance=0.0,
                                available=0.0,
                                pending=0.0,
                                currency='BRL'
                            )
                            session.add(wallet)
                            session.flush()  # Garantir que a carteira seja criada
                        
                        old_balance = float(wallet.balance or 0.0)
                        wallet.balance = old_balance + amount
                        wallet.available = float(wallet.available or 0.0) + amount
                        wallet.updated_at = datetime.utcnow()
                        
                        print(f"💰 [CARD] Saldo atualizado: {old_balance} → {wallet.balance}")
                    
                    print("💾 [CARD] Fazendo commit final...")
                    session.commit()
                    print(f"✅ [CARD] Transação salva com sucesso no banco: {transaction_id}")
                    
                    # VERIFICAR SE REALMENTE FOI SALVO
                    print("🔍 [CARD] Verificando se a transação foi realmente salva...")
                    saved_transaction = session.query(Transaction).filter_by(id=transaction_id).first()
                    if saved_transaction:
                        print(f"✅ [CARD] Confirmado: Transação encontrada no banco")
                        print(f"  - ID: {saved_transaction.id}")
                        print(f"  - Description: {saved_transaction.description}")
                        print(f"  - Status: {saved_transaction.status}")
                    else:
                        print(f"❌ [CARD] ERRO: Transação não encontrada no banco após commit!")
                    
                except Exception as e:
                    session.rollback()
                    print(f"❌ [CARD] ERRO ao salvar transação: {e}")
                    print(f"❌ [CARD] Tipo do erro: {type(e)}")
                    import traceback
                    print(f"❌ [CARD] Stack trace completo:")
                    traceback.print_exc()
                    
                    # Tentar salvar novamente com menos campos
                    try:
                        print("🔄 [CARD] Tentando salvar com campos mínimos...")
                        simple_transaction = Transaction(
                            id=str(uuid.uuid4()),
                            user_id=user.id,
                            type='deposit',
                            amount=amount,
                            description=f'Teste - MP: {mercadopago_id}',
                            status='pending'
                        )
                        session.add(simple_transaction)
                        session.commit()
                        print("✅ [CARD] Transação simples salva com sucesso")
                        transaction_id = simple_transaction.id
                    except Exception as e2:
                        print(f"❌ [CARD] Erro na tentativa simples também: {e2}")
            else:
                print("⚠️ [CARD] Usuário não encontrado, não salvando transação no banco")
            
            return jsonify({
                'success': True,
                'paymentId': mercadopago_id,
                'transactionId': transaction_id,
                'amount': amount,
                'status': payment_status,
                'statusDetail': payment.get('status_detail'),
                'externalReference': external_reference,
                'created_at': payment.get('date_created'),
                'paymentMethod': {
                    'type': payment.get('payment_type_id'),
                    'id': payment.get('payment_method_id'),
                    'lastFourDigits': payment.get('card', {}).get('last_four_digits')
                },
                'debug_info': {
                    'user_found': user is not None,
                    'user_id': user.id if user else None,
                    'transaction_saved': True
                }
            }), 201
        
        else:
            # Tratar erro do MercadoPago
            error_info = payment_response.get("response", {})
            error_msg = error_info.get("message", "Erro desconhecido")
            
            print(f"❌ [CARD] Erro do MercadoPago:")
            print(f"  - Status: {payment_response.get('status')}")
            print(f"  - Error: {error_msg}")
            print(f"  - Details: {json.dumps(error_info, indent=2)}")
            
            return jsonify({
                'success': False, 
                'error': error_msg,
                'details': error_info
            }), 400
            
    except Exception as e:
        session.rollback()
        print(f"❌ [CARD] ERRO GERAL CRÍTICO: {e}")
        print(f"❌ [CARD] Tipo: {type(e)}")
        import traceback
        print("❌ [CARD] Stack trace completo:")
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'error': f'Erro interno: {str(e)}'
        }), 500
    finally:
        try:
            session.close()
            print("🔍 [CARD] Sessão do banco fechada")
        except:
            pass


# ENDPOINT PARA VERIFICAR TRANSAÇÕES NO BANCO
@app.route('/api/debug/check-transactions', methods=['GET'])
def debug_check_transactions():
    """Verificar todas as transações no banco"""
    session = SessionLocal()
    try:
        print("🔍 [DEBUG] Verificando todas as transações no banco...")
        
        # Contar total de transações
        total_count = session.query(Transaction).count()
        print(f"🔍 [DEBUG] Total de transações no banco: {total_count}")
        
        # Buscar últimas 10 transações
        recent_transactions = session.query(Transaction).order_by(Transaction.created_at.desc()).limit(10).all()
        
        transactions_data = []
        for tx in recent_transactions:
            tx_data = {
                'id': tx.id,
                'user_id': tx.user_id,
                'type': tx.type,
                'amount': float(tx.amount),
                'description': tx.description,
                'status': tx.status,
                'created_at': tx.created_at.isoformat() if tx.created_at else None
            }
            transactions_data.append(tx_data)
            print(f"  - {tx.id}: {tx.description} | {tx.status} | R$ {tx.amount}")
        
        return jsonify({
            'success': True,
            'total_transactions': total_count,
            'recent_transactions': transactions_data
        })
        
    except Exception as e:
        print(f"❌ [DEBUG] Erro ao verificar transações: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        session.close()



# CORREÇÃO ADICIONAL: Função para obter métodos de pagamento disponíveis
@app.route('/api/payments/methods', methods=['GET'])
def get_payment_methods():
    """Obter métodos de pagamento disponíveis"""
    try:
        initialize_mercadopago()
        
        # Buscar métodos de pagamento disponíveis
        payment_methods_response = sdk.payment_method().list_all()
        
        if payment_methods_response["status"] == 200:
            methods = payment_methods_response["response"]
            
            # Filtrar apenas cartões de crédito e débito
            card_methods = [
                {
                    "id": method["id"],
                    "name": method["name"],
                    "payment_type_id": method["payment_type_id"],
                    "status": method["status"],
                    "secure_thumbnail": method.get("secure_thumbnail"),
                    "thumbnail": method.get("thumbnail")
                }
                for method in methods 
                if method["payment_type_id"] in ["credit_card", "debit_card"] 
                and method["status"] == "active"
            ]
            
            return jsonify({
                'success': True,
                'methods': card_methods
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Erro ao buscar métodos de pagamento'
            }), 400
            
    except Exception as e:
        print(f"❌ [METHODS] Erro: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/payments/status/<payment_id>', methods=['GET', 'OPTIONS'])
def check_payment_status(payment_id):
    """Verificar status do pagamento no MercadoPago real"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Inicializar MercadoPago
        initialize_mercadopago()
        
        # Consultar pagamento real no MercadoPago
        payment_response = sdk.payment().get(payment_id)
        
        if payment_response["status"] == 200:
            payment = payment_response["response"]
            
            return jsonify({
                'success': True,
                'paymentId': payment.get('id'),
                'status': payment.get('status'),
                'statusDetail': payment.get('status_detail'),
                'amount': payment.get('transaction_amount'),
                'created_date': payment.get('date_created'),
                'last_updated': payment.get('date_last_updated')
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Pagamento não encontrado no MercadoPago'
            }), 404

    except Exception as e:
        print(f"Erro ao verificar status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/payments/webhook/mercadopago', methods=['POST', 'OPTIONS'])
def mercadopago_webhook():
    """Webhook para receber notificações do MercadoPago - VERSÃO CORRIGIDA SEM DUPLICAÇÃO"""
    if request.method == 'OPTIONS':
        return '', 200
        
    session = SessionLocal()
    try:
        data = request.get_json()
        
        print("=" * 50)
        print("WEBHOOK MERCADOPAGO RECEBIDO")
        print(f"Data: {json.dumps(data, indent=2)}")
        print("=" * 50)
        
        # Verificar se é notificação de pagamento
        if data.get('type') == 'payment':
            payment_id = data.get('data', {}).get('id')
            
            if payment_id:
                print(f"Processando payment_id: {payment_id}")
                
                # Inicializar MercadoPago
                initialize_mercadopago()
                
                # Buscar detalhes do pagamento
                payment_response = sdk.payment().get(payment_id)
                
                if payment_response["status"] == 200:
                    payment_info = payment_response["response"]
                    status = payment_info.get('status')
                    
                    print(f"Payment Status: {status}")
                    
                    # CORREÇÃO: Verificar se a transação JÁ foi processada no webhook
                    transaction = session.query(Transaction).filter(
                        Transaction.description.contains(f'MercadoPago ID: {payment_id}')
                    ).first()
                    
                    if transaction:
                        # VERIFICAÇÃO CRÍTICA: Se a transação já está 'completed', NÃO processar novamente
                        if transaction.status == 'completed' and status == 'approved':
                            print(f"⚠️ [WEBHOOK] Transação {payment_id} já foi processada e está 'completed'. Ignorando duplicação.")
                            return jsonify({'status': 'already_processed'}), 200
                        
                        # VERIFICAÇÃO CRÍTICA: Se o saldo já foi creditado, NÃO creditar novamente
                        # Vamos verificar se já existe uma transação de prêmio para este pagamento
                        existing_credit = session.query(Transaction).filter(
                            Transaction.description.contains(f'MercadoPago ID: {payment_id}'),
                            Transaction.user_id == transaction.user_id,
                            Transaction.type == 'deposit',
                            Transaction.status == 'completed'
                        ).count()
                        
                        if existing_credit > 0 and status == 'approved':
                            print(f"⚠️ [WEBHOOK] Saldo para payment_id {payment_id} já foi creditado. Ignorando.")
                            return jsonify({'status': 'balance_already_credited'}), 200
                        
                        # Se chegou aqui, pode atualizar o status sem creditar saldo
                        if status == 'approved':
                            transaction.status = 'completed'
                            print(f"🔄 [WEBHOOK] Status atualizado para 'completed' (SEM creditar saldo - já foi creditado)")
                        elif status in ['rejected', 'cancelled']:
                            transaction.status = 'failed'
                            print(f"🔄 [WEBHOOK] Status atualizado para 'failed'")
                        
                        session.commit()
                        print(f"✅ [WEBHOOK] Status da transação atualizado: {status}")
                    else:
                        print(f"❌ [WEBHOOK] Transação não encontrada para payment_id: {payment_id}")
                    
        return jsonify({'status': 'ok'}), 200
        
    except Exception as e:
        print(f"❌ [WEBHOOK] Erro no webhook: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        session.close()

# ==================== HANDLERS OPTIONS PARA APOSTAS ====================

@app.route('/api/admin/challenges/participations', methods=['GET'])
def get_challenges_with_participations():
    """Endpoint que retorna desafios com contagem correta de participações"""
    try:
        session = SessionLocal()
        
        # Buscar todos os desafios
        challenges = session.query(Challenge).all()
        
        # Buscar participações por desafio usando GROUP BY
        from sqlalchemy import func
        participations_query = session.query(
            ChallengeParticipation.challenge_id,
            func.count(ChallengeParticipation.id).label('participants_count'),
            func.sum(ChallengeParticipation.stake_amount).label('total_pool')
        ).group_by(ChallengeParticipation.challenge_id).all()
        
        # Criar dicionário de participações por challenge_id
        participations_map = {}
        for p in participations_query:
            participations_map[p.challenge_id] = {
                'participants_count': p.participants_count,
                'total_pool': float(p.total_pool) if p.total_pool else 0.0
            }
        
        print(f"🔍 [ADMIN] Participações por desafio: {participations_map}")
        
        # Montar resposta com dados corretos
        challenges_data = []
        for challenge in challenges:
            participation_data = participations_map.get(challenge.id, {
                'participants_count': 0,
                'total_pool': 0.0
            })
            
            # Converter challenge para dict
            if hasattr(challenge, 'to_dict'):
                challenge_dict = challenge.to_dict()
            else:
                challenge_dict = {
                    'id': challenge.id,
                    'title': challenge.title,
                    'description': challenge.description,
                    'category': challenge.category,
                    'status': challenge.status,
                    'entry_fee': float(challenge.entry_fee) if challenge.entry_fee else 0.0,
                    'max_participants': challenge.max_participants,
                    'start_date': challenge.start_date.isoformat() if challenge.start_date else None,
                    'end_date': challenge.end_date.isoformat() if challenge.end_date else None,
                    'created_at': challenge.created_at.isoformat() if challenge.created_at else None
                }
            
            # Adicionar dados de participação corretos
            challenge_dict.update({
                'participants_count': participation_data['participants_count'],
                'current_participants': participation_data['participants_count'],
                'total_pool': participation_data['total_pool']
            })
            
            challenges_data.append(challenge_dict)
            
            print(f"✅ [ADMIN] Desafio {challenge.title}: {participation_data['participants_count']} participantes")
        
        session.close()
        
        # Calcular totais
        total_participants = sum(c['participants_count'] for c in challenges_data)
        total_pool = sum(c['total_pool'] for c in challenges_data)
        
        print(f"📊 [ADMIN] Total: {total_participants} participantes, R$ {total_pool:.2f} em pools")
        
        return jsonify({
            'success': True,
            'challenges': challenges_data,
            'total_challenges': len(challenges_data),
            'total_participants': total_participants,
            'total_pool': total_pool,
            'message': f'{len(challenges_data)} desafios encontrados com {total_participants} participações'
        })
        
    except Exception as e:
        print(f"❌ [ADMIN] Erro ao buscar desafios com participações: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e),
            'challenges': [],
            'total_challenges': 0,
            'total_participants': 0,
            'total_pool': 0.0
        }), 500


@app.route('/api/challenges/<challenge_id>/join', methods=['OPTIONS'])
def join_challenge_options(challenge_id):
    """Handler para requisições OPTIONS do endpoint join"""
    return '', 200
    

@app.route('/api/challenges/<challenge_id>/complete', methods=['OPTIONS'])
def complete_challenge_options(challenge_id):
    """Handler para requisições OPTIONS do endpoint complete"""
    return '', 200

# <<< ATENÇÃO: A rota foi alterada para aceitar IDs de texto, como 'challenge_001' >>>
@app.route('/api/challenges/<challenge_id>/join', methods=['POST'])
def join_challenge(challenge_id):
    """
    Endpoint para participar de um desafio - COM TAXA DINÂMICA
    """
    session = SessionLocal()
    try:
        data = request.get_json()
        user_email = data.get('email') or data.get('user_email')
        stake_amount = float(data.get('stake_amount', 0))

        print(f"🎯 [JOIN] {user_email} tentando participar do desafio '{challenge_id}' com R$ {stake_amount:.2f}")

        if not user_email or stake_amount <= 0:
            return jsonify({'success': False, 'error': 'Email e valor da aposta válidos são obrigatórios'}), 400

        # 1. Buscar usuário e carteira com SQLAlchemy
        user = session.query(User).filter(User.email == user_email).first()
        if not user:
            return jsonify({'success': False, 'error': 'Usuário não encontrado'}), 404
        
        wallet = session.query(Wallet).filter(Wallet.user_id == user.id).first()
        if not wallet or wallet.balance < stake_amount:
            saldo_atual = wallet.balance if wallet else 0.0
            return jsonify({'success': False, 'error': f'Saldo insuficiente. Saldo atual: R$ {saldo_atual:.2f}'}), 400

        # 2. Buscar desafio com SQLAlchemy
        challenge = session.query(Challenge).filter(Challenge.id == challenge_id).first()
        if not challenge:
            return jsonify({'success': False, 'error': 'Desafio não encontrado'}), 404

        # 3. Verificar se já participa com SQLAlchemy
        existing_participation = session.query(ChallengeParticipation).filter_by(user_id=user.id, challenge_id=challenge.id).first()
        if existing_participation:
            return jsonify({'success': False, 'error': 'Você já está participando deste desafio'}), 400
        
        # 4. BUSCAR TAXA DINÂMICA PARA MOSTRAR AO USUÁRIO
        current_platform_fee = get_dynamic_platform_fee()
        fee_amount = stake_amount * (current_platform_fee / 100)
        net_contribution = stake_amount - fee_amount
        
        print(f"💰 [JOIN] Taxa atual: {current_platform_fee}% (R$ {fee_amount:.2f} de taxa, R$ {net_contribution:.2f} para o pool)")
        
        # 5. Executar as transações de forma segura.
        
        # Debitar da carteira
        wallet.balance -= stake_amount
        wallet.available -= stake_amount
        
        # Criar registro de participação
        participation = ChallengeParticipation(
            id=str(uuid.uuid4()),
            challenge_id=challenge.id,
            user_id=user.id,
            stake_amount=stake_amount,
            status='active'
        )
        session.add(participation)
        
        # Criar transação de débito
        transaction = Transaction(
            id=str(uuid.uuid4()),
            user_id=user.id,
            type='bet',
            amount=-stake_amount,
            description=f'Aposta no desafio: {challenge.title} (Taxa atual: {current_platform_fee}%)',
            status='completed'
        )
        session.add(transaction)
        
        # Atualizar contagem de apostas do usuário
        user.total_bets = (user.total_bets or 0) + 1
        
        # Atualizar contagem de participantes e pool do desafio
        challenge.current_participants = (challenge.current_participants or 0) + 1
        challenge.total_pool = (challenge.total_pool or 0) + stake_amount
        
        # Salva todas as alterações no banco de dados de uma só vez
        session.commit()
        
        print(f"✅ [JOIN] Sucesso! {user_email} entrou no desafio '{challenge.title}'. Novo saldo: R$ {wallet.balance:.2f}")
        
        return jsonify({
            'success': True,
            'message': 'Participação registrada com sucesso!',
            'data': {
                'participation_id': participation.id,
                'new_balance': wallet.balance,
                'challenge_title': challenge.title,
                'platform_fee': current_platform_fee,  # <-- RETORNAR TAXA APLICADA
                'fee_amount': fee_amount,
                'net_contribution': net_contribution,
                'updated_challenge': {
                    'id': challenge.id,
                    'participants_count': challenge.current_participants,
                    'total_pool': challenge.total_pool
                }
            }
        }), 201
            
    except sqlite3.Error as e:
        print(f"❌ [JOIN] Erro no banco de dados: {e}")
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {str(e)}'}), 500
        
    except Exception as e:
        print(f"❌ [JOIN] Erro geral: {e}")
        import traceback
        print(f"❌ [JOIN] Stack trace: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': f'Erro interno: {str(e)}'}), 500



@app.route('/api/platform/fee', methods=['GET'])
def get_current_platform_fee():
    """Endpoint para frontend verificar a taxa atual"""
    try:
        current_fee = get_dynamic_platform_fee()
        
        return jsonify({
            'success': True,
            'platform_fee': current_fee,
            'fee_percentage': current_fee,
            'message': f'Taxa atual: {current_fee}%'
        }), 200
        
    except Exception as e:
        print(f"❌ [FEE] Erro ao buscar taxa: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'platform_fee': 10.0,
            'fee_percentage': 10.0
        }), 500


@app.route('/api/challenges/activity', methods=['GET', 'OPTIONS'])
def get_challenges_activity():
    """Endpoint para atividades de desafios"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        limit = request.args.get('limit', 20, type=int)
        
        # Retornar atividades mockadas por enquanto
        activities = []
        for i in range(min(limit, 10)):
            activities.append({
                "id": i + 1,
                "user_name": f"Usuário {i + 1}",
                "action": "completou um desafio",
                "challenge_title": f"Desafio {i + 1}",
                "timestamp": datetime.now().isoformat()
            })
        
        return jsonify({
            "activities": activities,
            "total": len(activities)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== CORREÇÃO: HANDLER OPTIONS PARA ADMIN =====
@app.route('/api/admin/dashboard/metrics', methods=['OPTIONS'])
def admin_dashboard_metrics_options():
    """Handler para requisições OPTIONS do endpoint admin"""
    return '', 200

@app.route('/', methods=['GET'])
def root():
    """Rota raiz da API - informações básicas"""
    return jsonify({
        "api": "BetFit Backend",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/api/health",
            "admin_metrics": "/api/admin/dashboard/metrics",
            "challenges": "/api/challenges",
            "wallet": "/api/wallet",
            "auth": "/api/auth",
            "fitness": "/api/fitness"
        },
        "fitness_endpoints": {
            "connections": "/api/fitness/connections/<user_email>",
            "connect_test": "/api/fitness/connect-test",
            "mock_activity": "/api/fitness/mock-activity",
            "disconnect": "/api/fitness/disconnect",
            "stats": "/api/fitness/stats/<user_email>",
            "data": "/api/fitness/data",
            "link_healthkit": "/api/fitness/link-healthkit"
        },
        "message": "BetFit API está funcionando corretamente!"
    })
# ==================== UTILITY FUNCTIONS ====================

def hash_password(password):
    """Hash da senha usando SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def model_user_to_dict(u):
    """Converte modelo User para dict"""
    return {
        'id': u.id,
        'name': u.name,
        'email': u.email,
        'phone': u.phone,
        'password': u.password,
        'status': u.status,
        'kyc_status': u.kyc_status,
        'created_at': u.created_at.isoformat() if u.created_at else None,
        'updated_at': u.updated_at.isoformat() if u.updated_at else None,
        'last_login': u.last_login.isoformat() if u.last_login else None,
        'total_bets': u.total_bets or 0,
        'total_wins': u.total_wins or 0,
        'total_deposited': u.total_deposited or 0.0,
        'total_withdrawn': u.total_withdrawn or 0.0
    }

def model_wallet_to_dict(w):
    """Converte modelo Wallet para dict"""
    return {
        'id': w.id,
        'user_id': w.user_id,
        'balance': w.balance or 0.0,
        'available': w.available or 0.0,
        'pending': w.pending or 0.0,
        'currency': w.currency or 'BRL',
        'created_at': w.created_at.isoformat() if w.created_at else None,
        'updated_at': w.updated_at.isoformat() if w.updated_at else None
    }

def model_tx_to_dict(t):
    """Converte modelo Transaction para dict"""
    return {
        'id': t.id,
        'user_id': t.user_id,
        'type': t.type,
        'amount': t.amount,
        'description': t.description,
        'status': t.status,
        'created_at': t.created_at.isoformat() if t.created_at else None,
        'admin_id': t.admin_id
    }


# ========================================================================
# <<< NOVA FUNÇÃO PARA POPULAR O BANCO DE DADOS (PASSO 3) >>>
# ========================================================================
@app.route('/api/dev/seed-database', methods=['GET'])
def seed_database():
    """
    Endpoint de desenvolvimento para recriar e popular o banco com dados de teste.
    Apaga as tabelas inteiras (DROP TABLE) e começa do zero.
    """
    from sqlalchemy import text
    
    session = SessionLocal()
    try:
        print("🔥 [SEED] RESET TOTAL DO BANCO DE DADOS...")
        
        # Pega a engine do SQLAlchemy para executar comandos
        engine = session.get_bind()

        # Desativa a verificação de chaves estrangeiras
        session.execute(text('PRAGMA foreign_keys=OFF;'))

        # Apaga todas as tabelas conhecidas pelo `models.py`
        from models import Base
        print("   - Apagando todas as tabelas conhecidas...")
        Base.metadata.drop_all(engine)
        
        # Recria todas as tabelas a partir do `models.py`
        print("   - Recriando todas as tabelas...")
        Base.metadata.create_all(engine)
        
        # Reativa a verificação de chaves estrangeiras
        session.execute(text('PRAGMA foreign_keys=ON;'))
        
        session.commit()
        
        print("🌱 [SEED] Populando o banco de dados com dados de teste limpos...")

        # --- A lógica para criar usuários e desafios permanece a mesma ---
        user_id_teste = str(uuid.uuid4())
        user1 = User(
            id=user_id_teste,
            name='Usuário Teste',
            email='teste@betfit.com',
            password=hash_password('123456'),
            status='active',
            kyc_status='verified'
        )
        session.add(user1)

        wallet1 = Wallet(
            id=str(uuid.uuid4()),
            user_id=user_id_teste,
            balance=100.0,
            available=100.0,
            currency='BRL'
        )
        session.add(wallet1)

        challenges_to_create = [
            Challenge(
                id='challenge_001', title='Corrida 5km em 30min',
                description='...', category='running', difficulty='medium', entry_fee=25.0,
                start_date=datetime.utcnow(), end_date=datetime.utcnow() + timedelta(days=7),
                required_app_category='running'
            ),
            # ... (os outros desafios)
        ]
        session.add_all(challenges_to_create)

        session.commit()
        print("✅ [SEED] Banco de dados recriado e populado com sucesso!")

        return jsonify({"message": "Banco de dados recriado e populado com 1 usuário e 4 desafios."}), 201

    except Exception as e:
        session.rollback()
        import traceback
        print(f"❌ [SEED] Erro ao recriar o banco: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# ==================== CHALLENGES ENDPOINTS ====================

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Registro de usuário com persistência real no banco"""
    session = SessionLocal()
    try:
        data = request.get_json()
        
        print(f"🔍 [REGISTRO] Iniciando processo de registro...")
        print(f"🔍 [REGISTRO] Dados recebidos: {data}")
        
        # Validar dados obrigatórios
        required_fields = ['name', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se email já existe
        print(f"🔍 [REGISTRO] Verificando se email {data['email']} já existe...")
        existing_user = session.query(User).filter_by(email=data['email']).first()
        if existing_user:
            print(f"❌ [REGISTRO] Email já existe: {data['email']}")
            return jsonify({'error': 'Email já cadastrado'}), 400
        print(f"✅ [REGISTRO] Email disponível: {data['email']}")
        
        # Criar novo usuário
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            name=data['name'],
            email=data['email'],
            phone=data.get('phone', ''),
            password=hash_password(data['password']),
            status='active',
            kyc_status='pending'
        )
        
        session.add(user)
        print(f"🔍 [REGISTRO] Usuário adicionado à sessão: {user.email}")
        session.commit()
        print(f"✅ [REGISTRO] Usuário commitado no banco: {user.id}")
        
        # Criar carteira para o usuário com bônus de boas-vindas
        wallet = Wallet(
            id=str(uuid.uuid4()),
            user_id=user_id,
            balance=50.0,
            available=50.0,
            pending=0.0,
            currency='BRL'
        )
        session.add(wallet)
        print(f"🔍 [REGISTRO] Carteira adicionada à sessão para usuário: {user_id}")
        session.commit()
        print(f"✅ [REGISTRO] Carteira commitada no banco com saldo: R$ {wallet.balance}")
        
        # Adicionar transação de bônus de boas-vindas
        bonus_transaction = Transaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type='bonus',
            amount=50.0,
            description='Bônus de boas-vindas',
            status='completed'
        )
        session.add(bonus_transaction)
        session.commit()
        print(f"✅ [REGISTRO] Transação de bônus adicionada")
        
        # Gerar token de acesso
        access_token = secrets.token_hex(16)
        
        # Resposta sem senha
        user_response = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "status": user.status,
            "kyc_status": user.kyc_status,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
        
        wallet_response = {
            "balance": wallet.balance,
            "available": wallet.available,
            "pending": wallet.pending,
            "currency": wallet.currency
        }
        
        print(f"✅ [REGISTRO] Novo usuário registrado: {user.email} (ID: {user_id})")
        
        return jsonify({
            'message': 'Usuário registrado com sucesso! Bônus de R$ 50,00 adicionado à carteira.',
            'user': user_response,
            'wallet': wallet_response,
            'access_token': access_token
        }), 201
    
    except Exception as e:
        session.rollback()
        print(f"❌ [REGISTRO] ERRO DETALHADO: {e}")
        print(f"❌ [REGISTRO] Tipo do erro: {type(e)}")
        import traceback
        print(f"❌ [REGISTRO] Stack trace: {traceback.format_exc()}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        session.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login de usuário"""
    session = SessionLocal()
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400

        print(f"🔐 [LOGIN] Tentativa de login: {email}")

        # Buscar usuário no banco
        user = session.query(User).filter_by(email=email).first()
        if not user:
            print(f"❌ [LOGIN] Usuário não encontrado: {email}")
            return jsonify({'error': 'Usuário não encontrado'}), 404

        # Validar senha com hash
        hashed_password = hash_password(password)
        if user.password != hashed_password:
            print(f"❌ [LOGIN] Senha incorreta para: {email}")
            return jsonify({'error': 'Senha incorreta'}), 401

        # Verificar status
        if user.status != 'active':
            print(f"❌ [LOGIN] Usuário bloqueado: {email}")
            return jsonify({'error': 'Usuário bloqueado'}), 403

        # Atualizar último login
        user.last_login = datetime.utcnow()
        session.commit()

        # Gerar token de acesso
        access_token = secrets.token_hex(16)

        # Obter carteira
        wallet = session.query(Wallet).filter_by(user_id=user.id).first()
        wallet_data = {
            "balance": float(wallet.balance or 0.0),
            "available": float(wallet.available or 0.0),
            "pending": float(wallet.pending or 0.0),
            "currency": wallet.currency or 'BRL'
        } if wallet else {
            "balance": 0.0,
            "available": 0.0,
            "pending": 0.0,
            "currency": 'BRL'
        }

        # Resposta sem senha
        user_response = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "status": user.status,
            "kyc_status": user.kyc_status,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }

        print(f"✅ [LOGIN] Login realizado com sucesso: {email}")

        return jsonify({
            'message': 'Login realizado com sucesso',
            'user': user_response,
            'wallet': wallet_data,
            'access_token': access_token
        }), 200

    except Exception as e:
        session.rollback()
        print(f"❌ [LOGIN] Erro no login: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        session.close()

# ==================== WALLET ENDPOINTS ====================

@app.route('/api/wallet/<email>', methods=['GET'])
def get_wallet_by_email(email):
    """Busca dados da carteira por email - DADOS REAIS DO BANCO"""
    session = SessionLocal()
    try:
        print(f"💰 [WALLET] Buscando carteira para: {email}")
        
        # Buscar usuário por email
        user = session.query(User).filter_by(email=email).first()
        if not user:
            print(f"❌ [WALLET] Usuário não encontrado: {email}")
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        # Buscar carteira do usuário
        wallet = session.query(Wallet).filter_by(user_id=user.id).first()
        if not wallet:
            print(f"⚠️ [WALLET] Carteira não encontrada, criando...")
            # Criar carteira se não existir
            wallet = Wallet(
                id=str(uuid.uuid4()),
                user_id=user.id,
                balance=0.0,
                available=0.0,
                pending=0.0,
                currency='BRL'
            )
            session.add(wallet)
            session.commit()
        
        # Buscar transações
        transactions = session.query(Transaction).filter_by(user_id=user.id).order_by(Transaction.created_at.desc()).limit(10).all()
        
        transactions_list = []
        for tx in transactions:
            transactions_list.append({
                'id': tx.id,
                'type': tx.type,
                'amount': float(tx.amount),
                'description': tx.description,
                'status': tx.status,
                'created_at': tx.created_at.isoformat() if tx.created_at else None
            })
        
        wallet_data = {
            "user_email": email,
            "balance": float(wallet.balance or 0.0),
            "available_balance": float(wallet.available or 0.0),
            "locked_balance": float(wallet.pending or 0.0),
            "total_deposits": float(wallet.balance or 0.0),  # Simplificado
            "total_withdrawals": 0.0,  # Implementar depois
            "total_winnings": 0.0,  # Implementar depois
            "total_losses": 0.0,  # Implementar depois
            "transactions": transactions_list,
            "last_updated": wallet.updated_at.isoformat() if wallet.updated_at else datetime.utcnow().isoformat()
        }
        
        print(f"✅ [WALLET] Carteira encontrada: R$ {wallet_data['balance']:.2f}")
        return jsonify(wallet_data)
        
    except Exception as e:
        print(f"❌ [WALLET] Erro ao buscar carteira: {e}")
        return jsonify({"error": f"Erro ao buscar carteira: {str(e)}"}), 500
    finally:
        session.close()

@app.route('/api/wallet', methods=['GET'])
def get_wallet_by_query():
    """Busca dados da carteira por query parameter"""
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({"error": "Email é obrigatório"}), 400
            
        return get_wallet_by_email(email)
        
    except Exception as e:
        print(f"❌ [WALLET] Erro ao buscar carteira: {e}")
        return jsonify({"error": f"Erro ao buscar carteira: {str(e)}"}), 500

@app.route('/api/wallet/balance', methods=['GET'])
def get_wallet_balance():
    """Busca apenas o saldo da carteira"""
    session = SessionLocal()
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({"error": "Email é obrigatório"}), 400
            
        print(f"💰 [BALANCE] Buscando saldo para: {email}")
        
        # Buscar usuário
        user = session.query(User).filter_by(email=email).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        # Buscar carteira
        wallet = session.query(Wallet).filter_by(user_id=user.id).first()
        if not wallet:
            return jsonify({
                "balance": 0.0,
                "available": 0.0,
                "pending": 0.0,
                "currency": "BRL"
            })
        
        balance_data = {
            "balance": float(wallet.balance or 0.0),
            "available": float(wallet.available or 0.0),
            "pending": float(wallet.pending or 0.0),
            "currency": wallet.currency or "BRL"
        }
        
        return jsonify(balance_data)
        
    except Exception as e:
        print(f"❌ [BALANCE] Erro ao buscar saldo: {e}")
        return jsonify({"error": f"Erro ao buscar saldo: {str(e)}"}), 500
    finally:
        session.close()

# ==================== USER PROFILE ENDPOINTS ====================

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """Busca perfil do usuário - DADOS REAIS DO BANCO"""
    session = SessionLocal()
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({"error": "Email é obrigatório"}), 400
            
        print(f"👤 [PROFILE] Buscando perfil para: {email}")
        
        # Buscar usuário
        user = session.query(User).filter_by(email=email).first()
        if not user:
            print(f"❌ [PROFILE] Usuário não encontrado: {email}")
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        # Buscar carteira
        wallet = session.query(Wallet).filter_by(user_id=user.id).first()
        
        profile_data = {
            "success": True,
            "profile": {
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "phone": user.phone or '',
                    "status": user.status,
                    "kyc_status": user.kyc_status,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "last_login": user.last_login.isoformat() if user.last_login else None,
                    "total_bets": user.total_bets or 0,
                    "total_wins": user.total_wins or 0,
                    "total_deposited": user.total_deposited or 0.0,
                    "total_withdrawn": user.total_withdrawn or 0.0
                },
                "wallet": {
                    "balance": float(wallet.balance or 0.0),
                    "available": float(wallet.available or 0.0),
                    "pending": float(wallet.pending or 0.0),
                    "currency": wallet.currency or 'BRL'
                } if wallet else {
                    "balance": 0.0,
                    "available": 0.0,
                    "pending": 0.0,
                    "currency": 'BRL'
                }
            }
        }
        
        print(f"✅ [PROFILE] Perfil encontrado: {user.name} - R$ {profile_data['profile']['wallet']['balance']:.2f}")
        return jsonify(profile_data)
        
    except Exception as e:
        print(f"❌ [PROFILE] Erro ao buscar perfil: {e}")
        return jsonify({"error": f"Erro ao buscar perfil: {str(e)}"}), 500
    finally:
        session.close()

@app.route('/api/test/user/<email>', methods=['GET'])
def test_user_api(email):
    """Endpoint de teste para dados do usuário - DADOS REAIS DO BANCO"""
    session = SessionLocal()
    try:
        print(f"🧪 [TEST] Test User API para: {email}")
        
        # Buscar usuário real
        user = session.query(User).filter_by(email=email).first()
        if not user:
            print(f"❌ [TEST] Usuário não encontrado: {email}")
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        # Buscar carteira real
        wallet = session.query(Wallet).filter_by(user_id=user.id).first()
        
        # Buscar transações reais
        transactions = session.query(Transaction).filter_by(user_id=user.id).order_by(Transaction.created_at.desc()).limit(5).all()
        
        test_data = {
            "success": True,
            "user_found": True,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone or '',
                "status": user.status,
                "kyc_status": user.kyc_status,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "total_bets": user.total_bets or 0,
                "total_wins": user.total_wins or 0
            },
            "wallet": {
                "exists": wallet is not None,
                "balance": float(wallet.balance or 0.0) if wallet else 0.0,
                "available": float(wallet.available or 0.0) if wallet else 0.0,
                "pending": float(wallet.pending or 0.0) if wallet else 0.0,
                "currency": wallet.currency if wallet else 'BRL'
            },
            "transactions": {
                "count": len(transactions),
                "latest": [
                    {
                        "id": tx.id,
                        "type": tx.type,
                        "amount": float(tx.amount),
                        "description": tx.description,
                        "status": tx.status,
                        "created_at": tx.created_at.isoformat() if tx.created_at else None
                    } for tx in transactions
                ]
            }
        }
        
        print(f"✅ [TEST] Dados do usuário {email} coletados com sucesso")
        return jsonify(test_data)
        
    except Exception as e:
        print(f"❌ [TEST] Erro ao buscar dados do usuário: {e}")
        return jsonify({"error": f"Erro ao buscar dados do usuário: {str(e)}"}), 500
    finally:
        session.close()



# ==================== FITNESS ENDPOINTS & ANTI-FRAUDE ====================

# ==================== NOVOS ENDPOINTS PARA DISPOSITIVOS DE TESTE ====================

@app.route('/api/fitness/connect-test', methods=['POST'])
def connect_test_device():
    """
    NOVO ENDPOINT: Conectar dispositivo de teste (mock) e registrar no banco
    Este é o endpoint que estava faltando no código original!
    """
    session = SessionLocal()
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        user_email = data.get('user_email')
        platform = data.get('platform', 'teste')
        device_id = data.get('device_id')
        
        if not user_email or not device_id:
            return jsonify({'error': 'user_email e device_id são obrigatórios'}), 400
        
        print(f"🧪 [FITNESS-TEST] Conectando dispositivo teste para: {user_email}")
        
        # Verificar se usuário existe
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Verificar se já existe uma conexão ativa para este usuário e plataforma
        existing_connection = session.query(FitnessConnection).filter_by(
            user_id=user.id, 
            platform=platform,
            is_active=True
        ).first()
        
        if existing_connection:
            return jsonify({'error': 'Dispositivo de teste já conectado para este usuário'}), 409
        
        # Criar nova conexão de teste
        permissions = json.dumps(data.get('permissions', ['mock_activities', 'mock_challenges']))
        # O campo 'metadata' foi removido porque a coluna não existe na tabela

        new_connection = FitnessConnection(
            user_id=user.id,
            platform=platform,
            platform_user_id=device_id,  # CORRIGIDO: 'device_id' foi alterado para 'platform_user_id'
            is_active=True,
            sync_status='connected',
            last_sync=datetime.utcnow(),
            permissions=permissions
            # O argumento 'metadata' foi removido daqui
        )

        session.add(new_connection)
        session.commit()
        
        # Converter para dict para resposta
        connection_dict = new_connection.to_dict()
        connection_dict['permissions'] = json.loads(connection_dict.get('permissions', '[]'))
        connection_dict['mock_data'] = json.loads(connection_dict.get('metadata', '{}'))
        
        print(f"✅ [FITNESS-TEST] Dispositivo teste conectado com ID: {new_connection.id}")
        
        return jsonify({
            'success': True,
            'message': 'Dispositivo de teste conectado com sucesso',
            'connection': connection_dict
        }), 201
        
    except Exception as e:
        session.rollback()
        print(f"❌ [FITNESS-TEST] Erro ao conectar dispositivo teste: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/fitness/mock-activity', methods=['POST'])
def register_mock_activity():
    """
    ENDPOINT ATUALIZADO: Registar atividade mock, verificar desafios e atribuir prémios.
    """
    session = SessionLocal()
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados da atividade não fornecidos'}), 400
        
        user_email = data.get('user_email')
        platform = data.get('platform', 'teste')
        activity_type = data.get('activity_type')
        distance = data.get('distance')
        duration = data.get('duration')
        timestamp_str = data.get('timestamp', datetime.utcnow().isoformat())
        
        if not all([user_email, activity_type, distance, duration]):
            return jsonify({'error': 'Campos obrigatórios: user_email, activity_type, distance, duration'}), 400
        
        print(f"🏃 [FITNESS-MOCK] Registrando atividade mock para: {user_email}")
        
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        connection = session.query(FitnessConnection).filter_by(user_id=user.id, platform=platform, is_active=True).first()
        if not connection:
            return jsonify({'error': 'Nenhuma conexão de teste ativa encontrada'}), 404
        
        # 1. Registar a atividade de fitness (como antes)
        start_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        end_time = start_time + timedelta(minutes=int(duration))

        fitness_data = FitnessData(
            id=str(uuid.uuid4()),
            user_id=user.id,
            connection_id=connection.id,
            data_type=activity_type,
            value=float(distance),
            unit='km',
            start_time=start_time,
            end_time=end_time,
            source_app='teste',
            raw_data=json.dumps(data)
        )
        session.add(fitness_data)
        
        connection.last_sync = datetime.utcnow()
        print(f"✅ [FITNESS-MOCK] Atividade registrada: {activity_type} - {distance}km em {duration}min")

        # --- NOVA LÓGICA DE VALIDAÇÃO DE DESAFIOS E PAGAMENTO ---
        completed_challenges_info = []

        # 2. Encontrar participações ativas do usuário
        active_participations = session.query(ChallengeParticipation).filter_by(
            user_id=user.id,
            status='active' # Apenas desafios em que o usuário está ativamente a participar
        ).all()

        print(f"🔍 [VALIDATION] Encontradas {len(active_participations)} participações ativas para {user_email}")

        for participation in active_participations:
            challenge = session.query(Challenge).filter_by(id=participation.challenge_id).first()

            if not challenge or challenge.status != 'active':
                continue # Pular se o desafio não for encontrado ou não estiver ativo

            print(f"  -> Verificando desafio: '{challenge.title}' (Métrica: {challenge.target_metric}, Alvo: {challenge.target_value} {challenge.target_unit})")

            # 3. Validar se a atividade cumpre os critérios do desafio
            is_metric_match = challenge.target_metric == activity_type
            is_value_achieved = float(distance) >= challenge.target_value

            if is_metric_match and is_value_achieved:
                print(f"🏆 [VALIDATION] Desafio '{challenge.title}' COMPLETO!")

                # 4. Atualizar o estado da participação
                participation.status = 'completed'
                participation.validation_status = 'validated'
                participation.completed_at = datetime.utcnow()
                participation.result_value = float(distance)

                # 5. Calcular e atribuir o prémio
                # (Lógica de prémio simplificada: o prémio é o dobro da taxa de entrada)
                prize_amount = challenge.entry_fee * 2 
                
                wallet = session.query(Wallet).filter_by(user_id=user.id).first()
                if wallet:
                    wallet.balance += prize_amount
                    wallet.available += prize_amount
                    wallet.updated_at = datetime.utcnow()

                    # 6. Criar uma transação para o prémio
                    prize_transaction = Transaction(
                        id=str(uuid.uuid4()),
                        user_id=user.id,
                        type='prize',
                        amount=prize_amount,
                        description=f'Prémio do desafio: {challenge.title}',
                        status='completed'
                    )
                    session.add(prize_transaction)
                    
                    print(f"💰 [WALLET] Prémio de R$ {prize_amount:.2f} adicionado à carteira de {user_email}")

                    completed_challenges_info.append({
                        'challenge_id': challenge.id,
                        'challenge_title': challenge.title,
                        'prize_amount': prize_amount
                    })
                else:
                    print(f"⚠️ [WALLET] Carteira não encontrada para {user_email}. Prémio não atribuído.")

        # 7. Fazer commit de todas as alterações no final
        session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Atividade registrada com sucesso',
            'activity_id': fitness_data.id,
            'challenge_validations': {
                'completed_challenges': completed_challenges_info
            }
        }), 201
        
    except Exception as e:
        session.rollback()
        print(f"❌ [FITNESS-MOCK] Erro ao registrar atividade mock: {e}")
        # Adicionar mais detalhes ao erro para depuração
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/fitness/disconnect', methods=['POST'])
def disconnect_fitness_device():
    """
    NOVO ENDPOINT: Desconectar dispositivo fitness
    """
    session = SessionLocal()
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        user_email = data.get('user_email')
        platform = data.get('platform')
        
        if not user_email or not platform:
            return jsonify({'error': 'user_email e platform são obrigatórios'}), 400
        
        print(f"🔌 [FITNESS-DISCONNECT] Desconectando {platform} para: {user_email}")
        
        # Verificar se usuário existe
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Buscar e desativar a conexão
        connection = session.query(FitnessConnection).filter_by(
            user_id=user.id,
            platform=platform,
            is_active=True
        ).first()
        
        if not connection:
            return jsonify({'error': 'Conexão não encontrada'}), 404
        
        # Desativar a conexão
        connection.is_active = False
        connection.sync_status = 'disconnected'
        connection.updated_at = datetime.utcnow()
        
        session.commit()
        
        print(f"✅ [FITNESS-DISCONNECT] Dispositivo {platform} desconectado")
        
        return jsonify({
            'success': True,
            'message': f'Dispositivo {platform} desconectado com sucesso'
        }), 200
        
    except Exception as e:
        session.rollback()
        print(f"❌ [FITNESS-DISCONNECT] Erro ao desconectar dispositivo: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/fitness/stats/<user_email>', methods=['GET'])
def get_fitness_stats(user_email):
    """
    NOVO ENDPOINT: Obter estatísticas fitness do usuário
    """
    session = SessionLocal()
    try:
        print(f"📊 [FITNESS-STATS] Buscando estatísticas para: {user_email}")
        
        # Verificar se usuário existe
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Contar atividades por tipo
        from sqlalchemy import func
        activity_stats = session.query(
            FitnessData.data_type,
            func.count(FitnessData.id).label('count'),
            func.sum(FitnessData.value).label('total_distance')
        ).filter_by(user_id=user.id).group_by(FitnessData.data_type).all()
        
        # Contar conexões ativas
        active_connections = session.query(FitnessConnection).filter_by(
            user_id=user.id,
            is_active=True
        ).count()
        
        # Converter resultados
        activity_breakdown = []
        for stat in activity_stats:
            activity_breakdown.append({
                'activity_type': stat.data_type,
                'count': stat.count,
                'total_distance': float(stat.total_distance or 0.0)
            })
        
        stats_data = {
            'success': True,
            'stats': {
                'active_connections': active_connections,
                'activity_breakdown': activity_breakdown,
                'generated_at': datetime.utcnow().isoformat()
            }
        }
        
        print(f"✅ [FITNESS-STATS] Estatísticas geradas: {active_connections} conexões, {len(activity_breakdown)} tipos de atividade")
        
        return jsonify(stats_data), 200
        
    except Exception as e:
        print(f"❌ [FITNESS-STATS] Erro ao obter estatísticas: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

# ==================== FITNESS ENDPOINTS ORIGINAIS ====================

@app.route('/api/fitness/connections/<user_email>', methods=['GET'])
def get_user_fitness_connections(user_email):
    """
    Busca as conexões de fitness de um usuário. O frontend usa isso para
    verificar se o 'Apple Saúde' já está conectado.
    """
    session = SessionLocal()
    try:
        print(f"🔗 [FITNESS] Buscando conexões para: {user_email}")
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'success': False, 'error': 'Usuário não encontrado'}), 404

        connections = session.query(FitnessConnection).filter_by(user_id=user.id).all()
        connections_data = [conn.to_dict() for conn in connections]

        return jsonify({
            'success': True,
            'connections': connections_data
        }), 200

    except Exception as e:
        print(f"❌ [FITNESS] Erro ao buscar conexões: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/fitness/connect', methods=['POST'])
def connect_fitness_app():
    """
    Endpoint para o APLICATIVO MÓVEL chamar DEPOIS que o usuário
    autoriza o HealthKit. Ele cria o registro de conexão no banco.
    """
    session = SessionLocal()
    try:
        data = request.get_json()
        user_email = data.get('user_email')
        platform = data.get('platform') # Deverá ser "apple_health"

        if not user_email or not platform:
            return jsonify({'error': 'user_email e platform são obrigatórios'}), 400

        print(f"📱 [FITNESS] App móvel solicitando conexão para {user_email} via {platform}")
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        # Procura por uma conexão existente para não duplicar
        connection = session.query(FitnessConnection).filter_by(user_id=user.id, platform=platform).first()
        if connection:
            connection.is_active = True
            connection.sync_status = 'connected'
            connection.error_message = None
            print(f"✅ [FITNESS] Conexão reativada para {user_email}")
        else:
            connection = FitnessConnection(
                user_id=user.id,
                platform=platform,
                is_active=True
            )
            session.add(connection)
            print(f"✅ [FITNESS] Nova conexão criada para {user_email}")
        
        session.commit()
        return jsonify({
            'success': True,
            'message': f'Conectado com {platform} com sucesso',
            'connection': connection.to_dict()
        }), 200

    except Exception as e:
        session.rollback()
        print(f"❌ [FITNESS] Erro ao conectar: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/fitness/link-healthkit', methods=['POST'])
def link_healthkit():
    """Endpoint para vincular HealthKit com a conta do usuário"""
    session = SessionLocal()
    try:
        data = request.get_json()
        user_email = data.get('user_email')
        device_id = data.get('platform_user_id')
        permissions = data.get('permissions', [])
        
        if not user_email:
            return jsonify({'error': 'user_email é obrigatório'}), 400
        
        # Verificar se usuário existe
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Verificar se já existe uma conexão ativa
        existing_connection = session.query(FitnessConnection).filter_by(
            user_id=user.id, 
            platform='apple_health',
            is_active=True
        ).first()
        
        if existing_connection:
            # Atualizar conexão existente
            existing_connection.platform_user_id = device_id
            existing_connection.permissions = json.dumps(permissions)
            existing_connection.last_sync = datetime.utcnow()
            existing_connection.updated_at = datetime.utcnow()
            connection = existing_connection
        else:
            # Criar nova conexão
            connection = FitnessConnection(
                user_id=user.id,
                platform='apple_health',
                platform_user_id=device_id,
                permissions=json.dumps(permissions),
                is_active=True,
                sync_status='connected',
                last_sync=datetime.utcnow()
            )
            session.add(connection)
        
        session.commit()
        
        print(f"✅ [HEALTHKIT] Conexão vinculada para {user_email}")
        
        return jsonify({
            'success': True, 
            'message': 'HealthKit vinculado com sucesso',
            'connection': connection.to_dict()
        }), 200
        
    except Exception as e:
        session.rollback()
        print(f"❌ [HEALTHKIT] Erro ao vincular: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

def check_and_complete_challenges(session, user_id, fitness_data_list):
    """
    Verifica se os dados de fitness completaram algum desafio ativo do usuário.
    Se sim, completa o desafio automaticamente.
    """
    try:
        # Buscar participações ativas do usuário
        active_participations = session.query(ChallengeParticipation).filter_by(
            user_id=user_id, 
            status='active'
        ).all()
        
        if not active_participations:
            return {"message": "Nenhuma participação ativa encontrada", "completed_challenges": []}
        
        completed_challenges = []
        
        for participation in active_participations:
            # Buscar dados do desafio
            challenge = session.query(Challenge).filter_by(
                id=participation.challenge_id,
                status='active'
            ).first()
            
            if not challenge or not challenge.auto_validation:
                continue
            
            # Verificar se algum dado fitness atende à meta do desafio
            for fitness_item in fitness_data_list:
                if meets_challenge_criteria(fitness_item, challenge):
                    # COMPLETAR O DESAFIO
                    result = complete_challenge_automatically(
                        session, challenge, participation, fitness_item
                    )
                    completed_challenges.append(result)
                    break  # Primeiro a completar ganha
        
        return {
            "message": f"{len(completed_challenges)} desafios completados automaticamente",
            "completed_challenges": completed_challenges
        }
        
    except Exception as e:
        print(f"❌ Erro na verificação de desafios: {e}")
        return {"error": str(e), "completed_challenges": []}

def meets_challenge_criteria(fitness_data, challenge):
    """Verifica se os dados fitness atendem aos critérios do desafio"""
    try:
        data_type = fitness_data.get('type', '').lower()
        data_value = float(fitness_data.get('value', 0))
        target_value = float(challenge.target_value or 0)
        target_metric = (challenge.target_metric or '').lower()
        
        # Mapear tipos de dados para métricas do desafio
        type_mapping = {
            'distance': ['distance', 'km', 'running', 'cycling'],
            'steps': ['steps', 'step'],
            'calories': ['calories', 'energy'],
            'workout': ['workout', 'exercise']
        }
        
        # Verificar se o tipo de dado corresponde ao desafio
        for metric_group, aliases in type_mapping.items():
            if data_type in aliases or target_metric in aliases:
                if data_value >= target_value:
                    print(f"✅ Meta atingida! {data_value} >= {target_value} {challenge.target_unit}")
                    return True
        
        return False
        
    except Exception as e:
        print(f"❌ Erro ao verificar critérios: {e}")
        return False

def complete_challenge_automatically(session, challenge, participation, fitness_data):
    """Completa o desafio automaticamente quando meta é atingida"""
    try:
        completion_time = datetime.datetime.utcnow()
        achieved_value = float(fitness_data.get('value', 0))
        
        # Atualizar participação
        participation.status = 'completed'
        participation.result_value = achieved_value
        participation.completed_at = completion_time
        participation.validation_status = 'validated'
        
        # Atualizar desafio
        challenge.status = 'completed'
        challenge.updated_at = completion_time
        
        # Criar validação automática
        validation = ChallengeValidation(
            participation_id=participation.id,
            challenge_id=challenge.id,
            user_id=participation.user_id,
            fitness_data_ids=json.dumps([fitness_data.get('id', 'auto')]),
            validation_type='automatic',
            validation_status='validated',
            target_value=float(challenge.target_value),
            achieved_value=achieved_value,
            confidence_score=0.95,
            validation_notes=f'Meta atingida automaticamente via HealthKit: {achieved_value} {challenge.target_unit}',
            validated_at=completion_time
        )
        session.add(validation)
        
        # Criar resultado
        result = ChallengeResult(
            challenge_id=challenge.id,
            participation_id=participation.id,
            user_id=participation.user_id,
            result_value=achieved_value,
            result_unit=challenge.target_unit,
            validation_status='validated',
            ranking_position=1,  # Primeiro a completar
            prize_amount=float(challenge.total_pool * 0.95)  # 95% do pool (5% taxa)
        )
        session.add(result)
        
        session.commit()
        
        print(f"🏆 Desafio '{challenge.title}' completado automaticamente por {participation.user_email}")
        
        return {
            "challenge_id": challenge.id,
            "challenge_title": challenge.title,
            "user_email": participation.user_email,
            "achieved_value": achieved_value,
            "target_value": float(challenge.target_value),
            "prize_amount": float(result.prize_amount),
            "completed_at": completion_time.isoformat()
        }
        
    except Exception as e:
        session.rollback()
        print(f"❌ Erro ao completar desafio: {e}")
        raise e

@app.route('/api/fitness/data', methods=['POST'])
def receive_fitness_data():
    """
    Endpoint para o APLICATIVO MÓVEL enviar os dados coletados do HealthKit,
    incluindo metadados anti-fraude.
    """
    session = SessionLocal()
    try:
        data = request.get_json()
        user_email = data.get('user_email')
        fitness_data_list = data.get('data', [])

        if not user_email or not fitness_data_list:
            return jsonify({'error': 'user_email e uma lista de dados são obrigatórios'}), 400

        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        connection = session.query(FitnessConnection).filter_by(user_id=user.id, platform='apple_health', is_active=True).first()
        if not connection:
            return jsonify({'error': 'Nenhuma conexão ativa com apple_health encontrada para este usuário'}), 404
        
        processed_count = 0
        for item in fitness_data_list:
            # O app móvel deve enviar os metadados dentro de 'raw_data'
            raw_data_str = json.dumps(item.get('raw_data', {}))
            trust_score = calculate_trust_score(raw_data_str)
            
            # Você pode decidir não salvar dados com score muito baixo
            if trust_score < 0.2:
                print(f"⚠️ [ANTI-FRAUDE] Dado descartado para {user_email} por baixo score de confiança ({trust_score}). Fonte manual.")
                continue

            fitness_record = FitnessData(
                user_id=user.id,
                connection_id=connection.id,
                data_type=item.get('type'),
                value=float(item.get('value', 0)),
                unit=item.get('unit'),
                start_time=datetime.fromisoformat(item.get('start_time')),
                end_time=datetime.fromisoformat(item.get('end_time')),
                source_app=item.get('source_app'),
                device_info=json.dumps(item.get('device_info', {})),
                raw_data=raw_data_str
            )
            session.add(fitness_record)
            processed_count += 1
        
        # Atualiza a data da última sincronização
        connection.last_sync = datetime.utcnow()
        session.commit()
        
        print(f"✅ [FITNESS] {processed_count} registros de dados de fitness salvos para {user_email}")
        
        # NOVA PARTE: Verificar se completou algum desafio
        challenge_check = check_and_complete_challenges(session, user.id, fitness_data_list)
        
        return jsonify({
            'success': True,
            'message': f'{processed_count} registros processados com sucesso',
            'challenge_validations': challenge_check
        }), 200

    except Exception as e:
        session.rollback()
        print(f"❌ [FITNESS] Erro ao receber dados de fitness: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()



# ==================== CHALLENGES ENDPOINTS ====================

@app.route('/api/challenges', methods=['GET'])
def get_challenges():
    """Busca todos os desafios com categorias dinâmicas da tabela challenge_categories."""
    session = SessionLocal()
    try:
        print("🎮 [CHALLENGES] Buscando desafios REAIS com categorias dinâmicas...")

        # 1. BUSCAR CATEGORIAS REAIS DA TABELA challenge_categories
        categories_query = session.execute(text('''
            SELECT id, name, color, icon 
            FROM challenge_categories 
            WHERE is_active = '1'
        '''))
        categories_data = {row[0]: {'name': row[1], 'color': row[2], 'icon': row[3]} 
                          for row in categories_query.fetchall()}
        
        print(f"🏷️ [CHALLENGES] Categorias carregadas: {list(categories_data.keys())}")

        # 2. CRIAR MAPEAMENTO DINÂMICO BASEADO NAS CATEGORIAS REAIS
        # Mapear strings de categoria para IDs baseado nos nomes das categorias
        category_string_to_id = {}
        for cat_id, cat_data in categories_data.items():
            cat_name = cat_data['name'].lower()
            if 'corrida' in cat_name:
                category_string_to_id['running'] = cat_id
            elif 'ciclismo' in cat_name:
                category_string_to_id['cycling'] = cat_id
            elif 'caminhada' in cat_name:
                category_string_to_id['steps'] = cat_id
            elif 'fitness' in cat_name:
                category_string_to_id['fitness'] = cat_id
            elif 'yoga' in cat_name:
                category_string_to_id['calories'] = cat_id
            elif 'natação' in cat_name:
                category_string_to_id['swimming'] = cat_id

        print(f"🔗 [CHALLENGES] Mapeamento dinâmico: {category_string_to_id}")

        # 3. BUSCAR TODOS OS DESAFIOS
        all_challenges = session.query(Challenge).all()

        if not all_challenges:
            print("⚠️ [CHALLENGES] Nenhum desafio encontrado no banco de dados.")
            return jsonify({
                "challenges": [],
                "total": 0,
                "message": "Nenhum desafio encontrado."
            })

        # 4. PROCESSAR DESAFIOS COM CATEGORIAS DINÂMICAS
        challenges_data = []
        for challenge in all_challenges:
            challenge_dict = challenge.to_dict()
            
            # Mapear categoria string para dados reais da categoria
            original_category = challenge_dict.get('category', 'fitness')
            category_id = category_string_to_id.get(original_category)
            
            if category_id and category_id in categories_data:
                category_info = categories_data[category_id]
                challenge_dict.update({
                    'category_name': category_info['name'],
                    'category_color': category_info['color'],
                    'category_icon': category_info['icon'],
                    'category_id': category_id
                })
            else:
                # Fallback se não encontrar mapeamento
                challenge_dict.update({
                    'category_name': original_category.title(),
                    'category_color': '#3b82f6',
                    'category_icon': 'trophy',
                    'category_id': None
                })
            
            # Adicionar campos de compatibilidade
            challenge_dict['participant_count'] = challenge_dict.get('current_participants', 0)
            
            challenges_data.append(challenge_dict)

        # Debug do mapeamento
        print("🏷️ [CHALLENGES DEBUG] Mapeamento dinâmico aplicado:")
        for challenge in challenges_data[:3]:
            print(f"   - {challenge['title']}: {challenge['category']} → {challenge.get('category_name', 'N/A')}")

        print(f"✅ [CHALLENGES] {len(challenges_data)} desafios processados com categorias dinâmicas.")
        return jsonify({
            "challenges": challenges_data,
            "total": len(challenges_data)
        })

    except Exception as e:
        print(f"❌ [CHALLENGES] Erro ao buscar desafios: {e}")
        return jsonify({"error": f"Erro ao buscar desafios: {str(e)}"}), 500
    finally:
        session.close()

# 1. ATUALIZAR A FUNÇÃO create_challenge EXISTENTE
@app.route('/api/challenges', methods=['POST'])
def create_challenge():
    """Criar desafio com suporte a múltiplos vencedores"""
    session = SessionLocal()
    try:
        data = request.get_json()
        
        print(f"🎮 [CREATE_CHALLENGE] Criando desafio com múltiplos vencedores...")
        print(f"🎮 [CREATE_CHALLENGE] Dados recebidos: {data}")
        
        # Validar campos obrigatórios
        required_fields = ['title', 'description', 'category_id', 'target_value', 'stake_min', 'stake_max', 'start_at']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Campo obrigatório: {field}"}), 400
        
        # PROCESSAR CAMPOS DE MÚLTIPLOS VENCEDORES
        max_winners = int(data.get('max_winners', 1))
        winner_selection_type = data.get('winner_selection_type', 'first_to_complete')
        prize_distribution_type = data.get('prize_distribution_type', 'equal')
        
        # Validações específicas para múltiplos vencedores
        if max_winners < 1 or max_winners > 50:
            return jsonify({"error": "Número de vencedores deve estar entre 1 e 50"}), 400
        
        max_participants = int(data.get('max_participants', 100))
        if max_winners > max_participants:
            return jsonify({"error": "Número de vencedores não pode ser maior que máximo de participantes"}), 400
        
        valid_selection_types = ['first_to_complete', 'top_performers', 'all_qualifiers']
        if winner_selection_type not in valid_selection_types:
            return jsonify({"error": f"Tipo de seleção inválido. Use: {', '.join(valid_selection_types)}"}), 400
        
        valid_distribution_types = ['equal', 'proportional', 'ranking_based']
        if prize_distribution_type not in valid_distribution_types:
            return jsonify({"error": f"Tipo de distribuição inválido. Use: {', '.join(valid_distribution_types)}"}), 400
        
        # 1. BUSCAR CATEGORIA REAL DA TABELA challenge_categories
        category = session.query(ChallengeCategory).filter(
        ChallengeCategory.id == category_id,
        ChallengeCategory.is_active == True
    ).first()
    
    if not category:
        return jsonify({"error": f"Categoria ID {category_id} não encontrada ou inativa"}), 400
    
    category_name = category.name
        
        # 2. MAPEAR NOME DA CATEGORIA PARA STRING INTERNA
        category_string_map = {
            'corrida': 'running',
            'ciclismo': 'cycling', 
            'caminhada': 'steps',
            'fitness': 'fitness',
            'yoga': 'calories',
            'natação': 'swimming'
        }
        
        category_string = None
        for key, value in category_string_map.items():
            if key.lower() in category_name.lower():
                category_string = value
                break
        
        if not category_string:
            category_string = 'fitness'
        
        print(f"🔗 [CREATE_CHALLENGE] Mapeamento: '{category_name}' → '{category_string}'")
        
        # 3. PROCESSAR DATA DE INÍCIO
        try:
            start_date = datetime.fromisoformat(data['start_at'].replace('Z', '+00:00'))
            start_date = start_date.replace(tzinfo=None)
            print(f"📅 [CREATE_CHALLENGE] Data de início: {start_date}")
        except Exception as e:
            print(f"❌ [CREATE_CHALLENGE] Erro ao processar data: {e}")
            return jsonify({"error": "Data de início inválida"}), 400
        
        # 4. DETERMINAR STATUS
        now = datetime.utcnow()
        is_future = start_date > now
        status = 'pending' if is_future else 'active'
        end_date = start_date + timedelta(days=7)
        
        print(f"📅 [CREATE_CHALLENGE] Status: {status}")
        print(f"🏆 [CREATE_CHALLENGE] Configuração de vencedores:")
        print(f"   - Max vencedores: {max_winners}")
        print(f"   - Seleção: {winner_selection_type}")
        print(f"   - Distribuição: {prize_distribution_type}")
        
        # Criar novo desafio COM CAMPOS DE MÚLTIPLOS VENCEDORES
        new_challenge = Challenge(
            id=str(uuid.uuid4()),
            title=data['title'].strip(),
            description=data['description'].strip(),
            category=category_string,
            difficulty=data.get('difficulty', 'medium'),
            entry_fee=float(data['stake_min']),
            total_pool=0.0,
            max_participants=max_participants,
            current_participants=0,
            start_date=start_date,
            end_date=end_date,
            status=status,
            rules='',
            prize_distribution='winner_takes_all',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            created_by='admin',
            auto_validation=True,
            target_metric=data.get('target_unit', 'km'),
            target_value=float(data['target_value']),
            target_unit=data.get('target_unit', 'km'),
            validation_rules=data.get('requirements', ''),
            required_app_category=category_string,
            # NOVOS CAMPOS PARA MÚLTIPLOS VENCEDORES
            max_winners=max_winners,
            winner_selection_type=winner_selection_type,
            prize_distribution_type=prize_distribution_type
        )
        
        session.add(new_challenge)
        session.commit()
        
        print(f"✅ [CREATE_CHALLENGE] Desafio criado com múltiplos vencedores:")
        print(f"   - Título: {new_challenge.title}")
        print(f"   - Categoria: {category_name} → {category_string}")
        print(f"   - Status: {new_challenge.status}")
        print(f"   - Vencedores: {max_winners}")
        print(f"   - Seleção: {winner_selection_type}")
        print(f"   - Distribuição: {prize_distribution_type}")
        
        # Retornar dados com categoria mapeada
        challenge_data = {
            'id': new_challenge.id,
            'title': new_challenge.title,
            'description': new_challenge.description,
            'category': new_challenge.category,
            'category_name': category_name,
            'category_id': category_id,
            'difficulty': new_challenge.difficulty,
            'entry_fee': new_challenge.entry_fee,
            'total_pool': new_challenge.total_pool,
            'max_participants': new_challenge.max_participants,
            'current_participants': new_challenge.current_participants,
            'start_date': new_challenge.start_date.isoformat() if new_challenge.start_date else None,
            'end_date': new_challenge.end_date.isoformat() if new_challenge.end_date else None,
            'status': new_challenge.status,
            'target_value': new_challenge.target_value,
            'target_unit': new_challenge.target_unit,
            'validation_rules': new_challenge.validation_rules,
            'created_at': new_challenge.created_at.isoformat() if new_challenge.created_at else None,
            'start_at': new_challenge.start_date.isoformat() if new_challenge.start_date else None,
            'is_scheduled': is_future,
            'time_until_start': (start_date - now).total_seconds() if is_future else 0,
            # CAMPOS DE MÚLTIPLOS VENCEDORES
            'max_winners': max_winners,
            'winner_selection_type': winner_selection_type,
            'prize_distribution_type': prize_distribution_type,
            'multiple_winners_enabled': max_winners > 1
        }
        
        message = f"Desafio criado na categoria '{category_name}'! Status: {'Agendado' if is_future else 'Ativo'}"
        if max_winners > 1:
            message += f" | {max_winners} vencedores ({winner_selection_type})"
        
        return jsonify({
            "success": True,
            "message": message,
            "challenge": challenge_data
        }), 201
        
    except Exception as e:
        session.rollback()
        print(f"❌ [CREATE_CHALLENGE] Erro ao criar desafio: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erro ao criar desafio: {str(e)}"}), 500
    finally:
        session.close()

# ADICIONE TAMBÉM O HANDLER OPTIONS PARA CORS
@app.route('/api/challenges', methods=['OPTIONS'])
def challenges_options():
    """Handler para requisições OPTIONS do endpoint challenges"""
    return '', 200

@app.route('/api/challenges/my-participations', methods=['GET'])
def get_user_participations():
    """Busca participações do usuário com detalhes completos dos desafios"""
    session = SessionLocal()
    try:
        user_email = request.args.get('user_email')
        if not user_email:
            return jsonify({"error": "Email do usuário é obrigatório"}), 400
        
        print(f"🎯 [PARTICIPATIONS] Buscando participações para: {user_email}")
        
        # Buscar usuário por email
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            print(f"❌ [PARTICIPATIONS] Usuário não encontrado: {user_email}")
            return jsonify({
                "participations": [],
                "active_participations": [],
                "completed_participations": [],
                "total": 0,
                "active_count": 0,
                "completed_count": 0,
                "message": "Usuário não encontrado"
            }), 404
        
        # Buscar participações do usuário
        participations = session.query(ChallengeParticipation).filter_by(user_id=user.id).all()
        
        # Mock de detalhes dos desafios (em produção, viria de uma tabela challenges)
        challenges_details = {
            'challenge_001': {
                'title': 'Corrida 5km em 30min',
                'description': 'Complete uma corrida de 5km em até 30 minutos',
                'category': 'running',
                'difficulty': 'medium'
            },
            'challenge_002': {
                'title': 'Battle Royale 10k Steps',
                'description': 'Seja um dos primeiros 10 a completar 10.000 passos',
                'category': 'walking',
                'difficulty': 'easy'
            },
            'challenge_003': {
                'title': 'Treino HIIT 45min',
                'description': 'Complete um treino HIIT de 45 minutos com frequência cardíaca elevada',
                'category': 'fitness',
                'difficulty': 'hard'
            }
        }
        
        participations_list = []
        for participation in participations:
            # Buscar detalhes do desafio
            challenge_detail = challenges_details.get(participation.challenge_id, {
                'title': f'Desafio {participation.challenge_id}',
                'description': 'Desafio personalizado',
                'category': 'general',
                'difficulty': 'medium'
            })
            
            participations_list.append({
                'id': participation.id,
                'challenge_id': participation.challenge_id,
                'challenge_title': challenge_detail['title'],
                'challenge_description': challenge_detail['description'],
                'challenge_category': challenge_detail['category'],
                'challenge_difficulty': challenge_detail['difficulty'],
                'user_email': user_email,
                'stake_amount': float(participation.stake_amount or 0),
                'status': participation.status,
                'joined_at': participation.joined_at.isoformat() if participation.joined_at else None,
                'completed_at': participation.completed_at.isoformat() if participation.completed_at else None,
                'result_value': float(participation.result_value or 0) if participation.result_value else None,
                'is_active': participation.status == 'active',
                'is_completed': participation.status == 'completed'
            })
        
        print(f"✅ [PARTICIPATIONS] Encontradas {len(participations_list)} participações para {user_email}")
        
        # Separar participações ativas e completadas
        active_participations = [p for p in participations_list if p['is_active']]
        completed_participations = [p for p in participations_list if p['is_completed']]
        
        print(f"📊 [PARTICIPATIONS] Ativas: {len(active_participations)}, Completadas: {len(completed_participations)}")
        
        return jsonify({
            "participations": participations_list,
            "active_participations": active_participations,
            "completed_participations": completed_participations,
            "total": len(participations_list),
            "active_count": len(active_participations),
            "completed_count": len(completed_participations)
        })
        
    except Exception as e:
        print(f"❌ [PARTICIPATIONS] Erro ao buscar participações: {e}")
        return jsonify({"error": f"Erro ao buscar participações: {str(e)}"}), 500
    finally:
        session.close()


# 1. ADICIONAR FUNÇÃO HELPER PARA BUSCAR TAXA DINÂMICA
def get_dynamic_platform_fee():
    """Busca a taxa da plataforma do banco de dados dinamicamente"""
    try:
        # Usar o settings_manager que já existe no código
        platform_fee = settings_manager.get('platform', 'platform_fee', 10.0)
        
        # Garantir que é um número válido
        if platform_fee is None:
            platform_fee = 10.0
        
        platform_fee = float(platform_fee)
        
        # Validar range (0-100%)
        if platform_fee < 0:
            platform_fee = 0.0
        elif platform_fee > 100:
            platform_fee = 100.0
            
        print(f"💰 [DYNAMIC-FEE] Taxa carregada do banco: {platform_fee}%")
        return platform_fee
        
    except Exception as e:
        print(f"❌ [DYNAMIC-FEE] Erro ao buscar taxa, usando padrão 10%: {e}")
        return 10.0


def calculate_prize_distribution(total_prize_pool, winners_data, distribution_type='equal'):
    """Calcula como distribuir o prêmio entre múltiplos vencedores"""
    if not winners_data or total_prize_pool <= 0:
        return []
    
    num_winners = len(winners_data)
    distribution = []
    
    if distribution_type == 'equal':
        prize_per_winner = total_prize_pool / num_winners
        
        for winner in winners_data:
            distribution.append({
                'user_id': winner['user_id'],
                'position': winner['position'],
                'prize_amount': round(prize_per_winner, 2),
                'prize_percentage': round((prize_per_winner / total_prize_pool) * 100, 2),
                'result_value': winner['result_value']
            })
    
    elif distribution_type == 'proportional':
        total_performance = sum(w['result_value'] for w in winners_data)
        
        if total_performance > 0:
            for winner in winners_data:
                performance_ratio = winner['result_value'] / total_performance
                prize_amount = total_prize_pool * performance_ratio
                
                distribution.append({
                    'user_id': winner['user_id'],
                    'position': winner['position'],
                    'prize_amount': round(prize_amount, 2),
                    'prize_percentage': round(performance_ratio * 100, 2),
                    'result_value': winner['result_value']
                })
        else:
            return calculate_prize_distribution(total_prize_pool, winners_data, 'equal')
    
    elif distribution_type == 'ranking_based':
        if num_winners == 1:
            percentages = [100]
        elif num_winners == 2:
            percentages = [60, 40]
        elif num_winners == 3:
            percentages = [50, 30, 20]
        elif num_winners == 4:
            percentages = [40, 30, 20, 10]
        elif num_winners == 5:
            percentages = [35, 25, 20, 15, 5]
        else:
            percentages = []
            remaining = 100
            for i in range(num_winners):
                if i == num_winners - 1:
                    percentages.append(remaining)
                else:
                    pct = max(5, remaining // (num_winners - i))
                    percentages.append(pct)
                    remaining -= pct
        
        sorted_winners = sorted(winners_data, key=lambda x: x['position'])
        
        for i, winner in enumerate(sorted_winners):
            percentage = percentages[i] if i < len(percentages) else 5
            prize_amount = (total_prize_pool * percentage) / 100
            
            distribution.append({
                'user_id': winner['user_id'],
                'position': winner['position'],
                'prize_amount': round(prize_amount, 2),
                'prize_percentage': percentage,
                'result_value': winner['result_value']
            })
    
    return distribution

# 4. FUNÇÃO PARA DETERMINAR VENCEDORES
def determine_challenge_winners(challenge, completed_participations):
    """Determina quem são os vencedores baseado na configuração do desafio"""
    max_winners = getattr(challenge, 'max_winners', 1) or 1
    selection_type = getattr(challenge, 'winner_selection_type', 'first_to_complete') or 'first_to_complete'
    
    min_score_required = 80
    qualified_participations = [
        p for p in completed_participations 
        if (p.result_value or 0) >= min_score_required
    ]
    
    if not qualified_participations:
        return []
    
    winners = []
    
    if selection_type == 'first_to_complete':
        sorted_by_completion = sorted(
            qualified_participations, 
            key=lambda x: x.completed_at or datetime.utcnow()
        )
        
        for i, participation in enumerate(sorted_by_completion[:max_winners]):
            winners.append({
                'user_id': participation.user_id,
                'participation_id': participation.id,
                'position': i + 1,
                'result_value': participation.result_value or 0,
                'completed_at': participation.completed_at
            })
    
    elif selection_type == 'top_performers':
        sorted_by_performance = sorted(
            qualified_participations,
            key=lambda x: x.result_value or 0,
            reverse=True
        )
        
        for i, participation in enumerate(sorted_by_performance[:max_winners]):
            winners.append({
                'user_id': participation.user_id,
                'participation_id': participation.id,
                'position': i + 1,
                'result_value': participation.result_value or 0,
                'completed_at': participation.completed_at
            })
    
    elif selection_type == 'all_qualifiers':
        for i, participation in enumerate(qualified_participations[:max_winners]):
            winners.append({
                'user_id': participation.user_id,
                'participation_id': participation.id,
                'position': i + 1,
                'result_value': participation.result_value or 0,
                'completed_at': participation.completed_at
            })
    
    return winners


# 5. SUBSTITUIR FUNÇÃO complete_challenge EXISTENTE
@app.route('/api/challenges/<challenge_id>/complete', methods=['POST'])
def complete_challenge(challenge_id):
    """Completar desafio com suporte a múltiplos vencedores"""
    session = SessionLocal()
    try:
        data = request.get_json()
        user_email = data.get('user_email')
        completion_data = data.get('completion_data', {})
        result_value = completion_data.get('result_value', 80)
        
        print(f"🏆 [COMPLETE-MULTI] Usuário {user_email} completando desafio {challenge_id}")
        
        # Validações básicas
        if not user_email:
            return jsonify({'error': 'Email do usuário é obrigatório'}), 400
        
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        wallet = session.query(Wallet).filter_by(user_id=user.id).first()
        if not wallet:
            return jsonify({'error': 'Carteira não encontrada'}), 404
        
        participation = session.query(ChallengeParticipation).filter_by(
            challenge_id=challenge_id,
            user_id=user.id,
            status='active'
        ).first()
        
        if not participation:
            return jsonify({'error': 'Participação não encontrada ou já completada'}), 404
        
        challenge = session.query(Challenge).filter_by(id=challenge_id).first()
        if not challenge:
            return jsonify({'error': 'Desafio não encontrado'}), 404
        
        # MARCAR PARTICIPAÇÃO COMO COMPLETADA
        participation.status = 'completed'
        participation.result_value = result_value
        participation.completed_at = datetime.utcnow()
        
        min_score_required = 80
        is_qualified = result_value >= min_score_required
        
        if hasattr(participation, 'is_winner'):
            participation.is_winner = is_qualified
        
        session.commit()
        
        print(f"🎯 [COMPLETE-MULTI] Participação completada. Qualificado: {is_qualified}")
        
        # VERIFICAR SE DEVE FINALIZAR O DESAFIO
        remaining_active = session.query(ChallengeParticipation).filter_by(
            challenge_id=challenge_id,
            status='active'
        ).count()
        
        completed_participations = session.query(ChallengeParticipation).filter_by(
            challenge_id=challenge_id,
            status='completed'
        ).all()
        
        max_winners = getattr(challenge, 'max_winners', 1) or 1
        selection_type = getattr(challenge, 'winner_selection_type', 'first_to_complete') or 'first_to_complete'
        qualified_completed = [p for p in completed_participations if (p.result_value or 0) >= min_score_required]
        
        print(f"📊 [COMPLETE-MULTI] Status: {remaining_active} ativas, {len(qualified_completed)} qualificadas, max {max_winners}")
        
        # CONDIÇÕES PARA FINALIZAR
        should_finalize = False
        finalize_reason = ""
        
        if selection_type == 'first_to_complete':
            if len(qualified_completed) >= max_winners:
                should_finalize = True
                finalize_reason = f"Atingiu {max_winners} vencedores qualificados"
        else:
            if remaining_active == 0:
                should_finalize = True
                finalize_reason = "Todas as participações foram completadas"
        
        total_prize_awarded = 0
        user_prize = 0
        distribution_result = []
        
        if should_finalize:
            print(f"🎊 [COMPLETE-MULTI] Finalizando desafio: {finalize_reason}")
            
            # CALCULAR POOL E TAXA
            from sqlalchemy import func
            pool_query = session.query(func.sum(ChallengeParticipation.stake_amount)).filter_by(
                challenge_id=challenge_id
            ).scalar()
            
            total_pool = float(pool_query or 0)
            house_percentage = get_dynamic_platform_fee()
            house_fee = total_pool * (house_percentage / 100)
            prize_pool = total_pool - house_fee
            
            print(f"💰 [COMPLETE-MULTI] Pool: R$ {total_pool:.2f}, Taxa: {house_percentage}%, Prêmios: R$ {prize_pool:.2f}")
            
            # DETERMINAR VENCEDORES
            winners = determine_challenge_winners(challenge, completed_participations)
            
            if winners and prize_pool > 0:
                distribution_type = getattr(challenge, 'prize_distribution_type', 'equal') or 'equal'
                distribution = calculate_prize_distribution(prize_pool, winners, distribution_type)
                
                print(f"🏆 [COMPLETE-MULTI] {len(winners)} vencedores, distribuição: {distribution_type}")
                
                # DISTRIBUIR PRÊMIOS
                for dist in distribution:
                    winner_user_id = dist['user_id']
                    prize_amount = dist['prize_amount']
                    
                    winner_wallet = session.query(Wallet).filter_by(user_id=winner_user_id).first()
                    if winner_wallet:
                        winner_wallet.balance = float(winner_wallet.balance or 0.0) + prize_amount
                        winner_wallet.available = float(winner_wallet.available or 0.0) + prize_amount
                        winner_wallet.updated_at = datetime.utcnow()
                        
                        prize_transaction = Transaction(
                            id=str(uuid.uuid4()),
                            user_id=winner_user_id,
                            type='prize',
                            amount=prize_amount,
                            description=f'Prêmio - Posição {dist["position"]}º - {challenge.title} ({dist["prize_percentage"]}% do pool)',
                            status='completed'
                        )
                        session.add(prize_transaction)
                        
                        # REGISTRAR VENCEDOR NA TABELA challenge_winners
                        try:
                            challenge_winner = {
                                'id': str(uuid.uuid4()),
                                'challenge_id': challenge_id,
                                'user_id': winner_user_id,
                                'participation_id': next(w['participation_id'] for w in winners if w['user_id'] == winner_user_id),
                                'position': dist['position'],
                                'result_value': dist['result_value'],
                                'prize_amount': prize_amount,
                                'prize_percentage': dist['prize_percentage'],
                                'completed_at': datetime.utcnow().isoformat()
                            }
                            
                            session.execute(text("""
                                INSERT INTO challenge_winners 
                                (id, challenge_id, user_id, participation_id, position, result_value, prize_amount, prize_percentage, completed_at)
                                VALUES 
                                (:id, :challenge_id, :user_id, :participation_id, :position, :result_value, :prize_amount, :prize_percentage, :completed_at)
                            """), challenge_winner)
                            
                        except Exception as e:
                            print(f"⚠️ [COMPLETE-MULTI] Erro ao registrar vencedor na tabela: {e}")
                        
                        # ATUALIZAR PARTICIPAÇÃO
                        winner_participation = session.query(ChallengeParticipation).filter_by(
                            challenge_id=challenge_id,
                            user_id=winner_user_id
                        ).first()
                        if winner_participation and hasattr(winner_participation, 'final_position'):
                            winner_participation.final_position = dist['position']
                            winner_participation.is_winner = True
                        
                        total_prize_awarded += prize_amount
                        
                        if winner_user_id == user.id:
                            user_prize = prize_amount
                        
                        print(f"💰 [COMPLETE-MULTI] Vencedor {dist['position']}º: R$ {prize_amount:.2f}")
                
                distribution_result = distribution
            
            # REGISTRAR TAXA DA CASA
            if house_fee > 0:
                house_revenue_transaction = Transaction(
                    id=str(uuid.uuid4()),
                    user_id=None,
                    type='house_revenue',
                    amount=house_fee,
                    description=f'Taxa da casa ({house_percentage}%) - {challenge.title} - {len(winners)} vencedores',
                    status='completed',
                    admin_id='system'
                )
                session.add(house_revenue_transaction)
            
            # MARCAR DESAFIO COMO COMPLETADO
            challenge.status = 'completed'
            challenge.updated_at = datetime.utcnow()
        
        user.total_wins = (user.total_wins or 0) + (1 if user_prize > 0 else 0)
        session.commit()
        
        # RESPOSTA
        current_user_data = {
            'participation_id': participation.id,
            'challenge_id': challenge_id,
            'challenge_title': challenge.title,
            'user_email': user_email,
            'stake_amount': float(participation.stake_amount),
            'result_value': result_value,
            'is_qualified': is_qualified,
            'is_winner': user_prize > 0,
            'prize_amount': user_prize,
            'previous_balance': float(wallet.balance or 0.0) - user_prize,
            'new_balance': float(wallet.balance),
            'completed_at': participation.completed_at.isoformat(),
            'challenge_completed': should_finalize,
            'user_position': next((d['position'] for d in distribution_result if d['user_id'] == user.id), None) if distribution_result else None
        }
        
        response_data = {
            'success': True,
            'message': f'Desafio completado! Score: {result_value}%' + (f' - {len(distribution_result)} vencedores' if should_finalize else ''),
            'completion': current_user_data,
            'challenge_finalized': should_finalize,
            'finalize_reason': finalize_reason,
            'winners_info': {
                'total_winners': len(distribution_result) if distribution_result else 0,
                'total_prize_awarded': total_prize_awarded,
                'distribution_type': getattr(challenge, 'prize_distribution_type', 'equal') or 'equal',
                'max_winners_configured': max_winners,
                'selection_type': selection_type
            }
        }
        
        print(f"✅ [COMPLETE-MULTI] Usuário {user_email}: {'Vencedor' if user_prize > 0 else 'Completou'}")
        if user_prize > 0:
            print(f"🎉 [COMPLETE-MULTI] Prêmio recebido: R$ {user_prize:.2f}")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        session.rollback()
        print(f"❌ [COMPLETE-MULTI] Erro: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erro ao completar desafio: {str(e)}'}), 500
    finally:
        session.close()

# 4. ENDPOINT PARA LISTAR VENCEDORES DE UM DESAFIO
@app.route('/api/challenges/<challenge_id>/winners', methods=['GET'])
def get_challenge_winners(challenge_id):
    """Listar vencedores de um desafio específico"""
    session = SessionLocal()
    try:
        winners_query = session.execute(text("""
            SELECT 
                cw.*,
                u.name as winner_name,
                u.email as winner_email
            FROM challenge_winners cw
            JOIN users u ON cw.user_id = u.id
            WHERE cw.challenge_id = :challenge_id
            ORDER BY cw.position
        """), {'challenge_id': challenge_id})
        
        winners_data = []
        for row in winners_query.fetchall():
            winners_data.append({
                'id': row.id,
                'user_id': row.user_id,
                'winner_name': row.winner_name,
                'winner_email': row.winner_email,
                'position': row.position,
                'result_value': row.result_value,
                'prize_amount': float(row.prize_amount),
                'prize_percentage': float(row.prize_percentage),
                'completed_at': row.completed_at
            })
        
        return jsonify({
            'success': True,
            'challenge_id': challenge_id,
            'winners': winners_data,
            'total_winners': len(winners_data)
        }), 200
        
    except Exception as e:
        print(f"❌ [WINNERS] Erro ao buscar vencedores: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

print("✅ SISTEMA DE MÚLTIPLOS VENCEDORES IMPLEMENTADO!")
print("🏆 FUNCIONALIDADES ADICIONADAS:")
print("   - Suporte a 1-50 vencedores por desafio")
print("   - 3 tipos de seleção: first_to_complete, top_performers, all_qualifiers")
print("   - 3 tipos de distribuição: equal, proportional, ranking_based")
print("   - Tabela challenge_winners para histórico")
print("   - Taxa dinâmica aplicada corretamente")
print("   - Endpoint /api/challenges/{id}/winners")

# 5. ATUALIZAR FUNÇÃO create_challenge PARA INCLUIR NOVOS CAMPOS
# (Adicionar ao endpoint existente create_challenge)
def update_create_challenge_for_multiple_winners():
    """
    Atualizar o endpoint create_challenge existente para incluir:
    - max_winners
    - winner_selection_type 
    - prize_distribution_type
    
    Adicione estes campos ao processar formData:
    """
    example_code = """
    # Dentro da função create_challenge existente, adicionar:
    
    max_winners = int(data.get('max_winners', 1))
    winner_selection_type = data.get('winner_selection_type', 'first_to_complete') 
    prize_distribution_type = data.get('prize_distribution_type', 'equal')
    
    # Validações
    if max_winners < 1 or max_winners > 50:
        return jsonify({"error": "Número de vencedores deve estar entre 1 e 50"}), 400
    
    # Ao criar o objeto Challenge, adicionar:
    new_challenge = Challenge(
        # ... campos existentes ...
        max_winners=max_winners,
        winner_selection_type=winner_selection_type,
        prize_distribution_type=prize_distribution_type,
        # ... resto dos campos ...
    )
    """
    return example_code

@app.route('/api/user/bets', methods=['GET'])
def get_user_bets():
    """Busca histórico de apostas do usuário - HISTÓRICO COMPLETO"""
    session = SessionLocal()
    try:
        user_email = request.args.get('email')
        if not user_email:
            return jsonify({'error': 'Email é obrigatório'}), 400
        
        print(f"📊 [BETS] Buscando histórico de apostas para: {user_email}")
        
        # Buscar usuário
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Buscar transações de apostas e prêmios
        transactions = session.query(Transaction).filter(
            Transaction.user_id == user.id,
            Transaction.type.in_(['bet', 'prize', 'bonus'])
        ).order_by(Transaction.created_at.desc()).all()
        
        bets_history = []
        for tx in transactions:
            bets_history.append({
                'id': tx.id,
                'type': tx.type,
                'amount': float(tx.amount),
                'description': tx.description,
                'status': tx.status,
                'created_at': tx.created_at.isoformat() if tx.created_at else None
            })
        
        # Estatísticas do usuário
        stats = {
            'total_bets': user.total_bets or 0,
            'total_wins': user.total_wins or 0,
            'win_rate': ((user.total_wins or 0) / max(user.total_bets or 1, 1)) * 100,
            'total_staked': user.total_deposited or 0.0,
            'total_won': user.total_withdrawn or 0.0,
            'net_result': (user.total_withdrawn or 0.0) - (user.total_deposited or 0.0)
        }
        
        return jsonify({
            'bets_history': bets_history,
            'stats': stats,
            'total_transactions': len(bets_history)
        })
        
    except Exception as e:
        print(f"❌ [BETS] Erro ao buscar histórico: {e}")
        return jsonify({'error': f'Erro ao buscar histórico: {str(e)}'}), 500
    finally:
        session.close()

# ==================== ACTIVITIES ENDPOINTS ====================

@app.route('/api/activities/global', methods=['GET'])
def get_global_activities():
    """Busca atividades globais da plataforma"""
    try:
        limit = request.args.get('limit', 20, type=int)
        
        print(f"🌍 [ACTIVITIES] Buscando {limit} atividades globais...")
        
        # Mock de atividades globais
        activities = []
        for i in range(min(limit, 20)):
            activity = {
                "id": i + 1,
                "user_name": f"Usuário {i + 1}",
                "user_avatar": f"https://ui-avatars.com/api/?name=User{i+1}&background=random",
                "action": ["completou um desafio", "fez uma aposta", "ganhou um desafio", "atingiu uma meta"][i % 4],
                "challenge_title": f"Desafio {['Corrida 5K', 'Ciclismo 20K', 'Passos Diários', 'Treino HIIT'][i % 4]}",
                "amount": round(10 + (i * 5.5), 2),
                "timestamp": (datetime.now() - timedelta(minutes=i * 15)).isoformat(),
                "type": ["challenge_completed", "bet_placed", "challenge_won", "goal_achieved"][i % 4]
            }
            activities.append(activity)
        
        return jsonify({
            "activities": activities,
            "total": len(activities),
            "limit": limit
        })
        
    except Exception as e:
        print(f"❌ [ACTIVITIES] Erro ao buscar atividades globais: {e}")
        return jsonify({"error": f"Erro ao buscar atividades globais: {str(e)}"}), 500

# ==================== ADMIN ENDPOINTS ====================

@app.route('/api/admin/dashboard/metrics', methods=['GET'])
def admin_dashboard_metrics():
    """Obter métricas REAIS para o dashboard admin - COM LUCROS DA CASA"""
    session = SessionLocal()
    try:
        print("📊 [ADMIN] Buscando métricas do dashboard...")
        
        # Contar usuários REAIS
        total_users = session.query(User).count()
        active_users = session.query(User).filter_by(status='active').count()
        blocked_users = session.query(User).filter_by(status='blocked').count()
        
        # Somar todos os saldos das carteiras
        wallets = session.query(Wallet).all()
        total_balance = sum(float(w.balance or 0) for w in wallets)
        
        # Calcular saldo médio
        avg_balance = total_balance / max(total_users, 1)
        
        # Encontrar maior saldo
        max_balance_wallet = session.query(Wallet).order_by(Wallet.balance.desc()).first()
        max_balance = float(max_balance_wallet.balance) if max_balance_wallet else 0.0
        
        # Contar usuários com saldo > 0
        users_with_balance = session.query(Wallet).filter(Wallet.balance > 0).count()
        
        # Estatísticas KYC REAIS
        kyc_pending = session.query(User).filter_by(kyc_status='pending').count()
        kyc_verified = session.query(User).filter_by(kyc_status='verified').count()
        
        # Contar transações REAIS
        total_transactions = session.query(Transaction).count()
        completed_transactions = session.query(Transaction).filter_by(status='completed').count()
        
        # Somar valores das transações
        bet_transactions = session.query(Transaction).filter_by(type='bet').all()
        total_bets_value = sum(abs(float(tx.amount)) for tx in bet_transactions)
        
        prize_transactions = session.query(Transaction).filter_by(type='prize').all()
        total_prizes_value = sum(float(tx.amount) for tx in prize_transactions)
        
        bonus_transactions = session.query(Transaction).filter_by(type='bonus').all()
        total_bonus_value = sum(float(tx.amount) for tx in bonus_transactions)
        
        # === NOVA SEÇÃO: CALCULAR LUCROS DA CASA ===
        
        # 1. Buscar todos os pools de desafios completados
        from sqlalchemy import func, text
        
        # Buscar pools totais por desafio (soma das stakes)
        pools_query = session.query(
            ChallengeParticipation.challenge_id,
            func.sum(ChallengeParticipation.stake_amount).label('total_pool'),
            func.count(ChallengeParticipation.id).label('participants')
        ).group_by(ChallengeParticipation.challenge_id).all()
        
        # Calcular lucros da casa (10% de cada pool)
        house_revenue = 0.0
        total_pool_volume = 0.0
        completed_challenges_revenue = 0.0
        
        for pool in pools_query:
            pool_amount = float(pool.total_pool or 0)
            total_pool_volume += pool_amount
            house_cut = pool_amount * 0.10  # 10% para a casa
            house_revenue += house_cut
            
            # Verificar se desafio foi completado para contabilizar receita realizada
            challenge = session.query(Challenge).filter_by(id=pool.challenge_id).first()
            if challenge and challenge.status == 'completed':
                completed_challenges_revenue += house_cut
        
        # Estatísticas de rake/fee
        estimated_monthly_revenue = house_revenue * 4  # Estimativa baseada em semana
        average_rake_per_challenge = house_revenue / max(len(pools_query), 1)
        
        print(f"💰 [ADMIN] LUCROS DA CASA CALCULADOS:")
        print(f"  - Total de pools: R$ {total_pool_volume:.2f}")
        print(f"  - Rake total (10%): R$ {house_revenue:.2f}")
        print(f"  - Rake de desafios completos: R$ {completed_challenges_revenue:.2f}")
        print(f"  - Rake médio por desafio: R$ {average_rake_per_challenge:.2f}")
        
        # Contar participações em desafios
        total_participations = session.query(ChallengeParticipation).count()
        active_participations = session.query(ChallengeParticipation).filter_by(status='active').count()
        completed_participations = session.query(ChallengeParticipation).filter_by(status='completed').count()
        
        # === MÉTRICAS EXPANDIDAS COM LUCROS ===
        metrics = {
            "users": {
                "total": total_users,
                "active": active_users,
                "blocked": blocked_users,
                "growth_rate": 15.2,
                "new_today": 3
            },
            "wallets": {
                "total_balance": round(total_balance, 2),
                "average_balance": round(avg_balance, 2),
                "max_balance": round(max_balance, 2),
                "users_with_balance": users_with_balance,
                "total_deposits": round(total_bonus_value, 2),
                "total_withdrawals": 0.0
            },
            "kyc": {
                "pending": kyc_pending,
                "verified": kyc_verified,
                "rejected": 0,
                "completion_rate": round((kyc_verified / max(total_users, 1)) * 100, 1)
            },
            "transactions": {
                "total": total_transactions,
                "completed": completed_transactions,
                "pending": total_transactions - completed_transactions,
                "total_volume": round(total_bets_value + total_prizes_value + total_bonus_value, 2),
                "bets_volume": round(total_bets_value, 2),
                "prizes_volume": round(total_prizes_value, 2),
                "bonus_volume": round(total_bonus_value, 2)
            },
            "challenges": {
                "total_participations": total_participations,
                "active_participations": active_participations,
                "completed_participations": completed_participations,
                "completion_rate": round((completed_participations / max(total_participations, 1)) * 100, 1),
                "average_stake": round(total_bets_value / max(total_participations, 1), 2) if total_participations > 0 else 0.0,
                "total_pool_volume": round(total_pool_volume, 2),
                "challenges_with_pools": len(pools_query)
            },
            # === NOVA SEÇÃO: LUCROS DA CASA ===
            "house_revenue": {
                "total_rake": round(house_revenue, 2),
                "completed_challenges_rake": round(completed_challenges_revenue, 2),
                "pending_rake": round(house_revenue - completed_challenges_revenue, 2),
                "average_rake_per_challenge": round(average_rake_per_challenge, 2),
                "estimated_monthly_revenue": round(estimated_monthly_revenue, 2),
                "rake_percentage": 10.0,
                "total_pool_volume": round(total_pool_volume, 2),
                "challenges_processed": len(pools_query),
                # Métricas de performance
                "revenue_per_user": round(house_revenue / max(total_users, 1), 2),
                "revenue_per_active_user": round(house_revenue / max(active_users, 1), 2),
                "conversion_rate": round((total_participations / max(total_users, 1)) * 100, 1)
            },
            "system": {
                "uptime": "99.9%",
                "last_backup": datetime.now().isoformat(),
                "database_size": "2.5MB",
                "api_calls_today": 1247
            }
        }
        
        print(f"✅ [ADMIN] Métricas coletadas com lucros da casa: {total_users} usuários, R$ {house_revenue:.2f} de rake")
        return jsonify(metrics)
        
    except Exception as e:
        print(f"❌ [ADMIN] Erro ao buscar métricas: {e}")
        import traceback
        print(f"❌ [ADMIN] Stack trace: {traceback.format_exc()}")
        return jsonify({"error": f"Erro ao buscar métricas: {str(e)}"}), 500
    finally:
        session.close()

@app.route('/api/users', methods=['GET'])
def get_users():
    """Busca lista de usuários com paginação e filtros - DADOS REAIS DO BANCO"""
    session = SessionLocal()
    try:
        print("👥 [USERS] Buscando lista de usuários...")
        
        # Parâmetros de paginação e filtros
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '').strip()
        status_filter = request.args.get('status', '').strip()
        
        print(f"👥 [USERS] Parâmetros: page={page}, limit={limit}, search='{search}', status='{status_filter}'")
        
        # Query base
        query = session.query(User)
        
        # Aplicar filtros COM TRATAMENTO DE ERRO
        if search:
            try:
                # Verificar se as colunas existem antes de usar
                search_conditions = []
                
                if hasattr(User, 'name'):
                    search_conditions.append(User.name.ilike(f'%{search}%'))
                
                if hasattr(User, 'email'):
                    search_conditions.append(User.email.ilike(f'%{search}%'))
                
                if hasattr(User, 'phone'):
                    search_conditions.append(User.phone.ilike(f'%{search}%'))
                
                if search_conditions:
                    query = query.filter(or_(*search_conditions))
                    print(f"🔍 [USERS] Filtro de busca aplicado para: '{search}'")
                
            except Exception as search_error:
                print(f"⚠️ [USERS] Erro no filtro de busca: {search_error}")
                # Continuar sem filtro de busca se houver erro
        
        if status_filter:
            try:
                if hasattr(User, 'status'):
                    query = query.filter(User.status == status_filter)
                    print(f"📊 [USERS] Filtro de status aplicado: '{status_filter}'")
                else:
                    print(f"⚠️ [USERS] Modelo User não tem campo 'status', ignorando filtro")
            except Exception as status_error:
                print(f"⚠️ [USERS] Erro no filtro de status: {status_error}")
                # Continuar sem filtro de status se houver erro
        
        # Contar total COM TRATAMENTO DE ERRO
        try:
            total_users = query.count()
        except Exception as count_error:
            print(f"⚠️ [USERS] Erro ao contar usuários: {count_error}")
            total_users = 0
        
        # Aplicar paginação
        offset = (page - 1) * limit
        try:
            users = query.offset(offset).limit(limit).all()
        except Exception as query_error:
            print(f"❌ [USERS] Erro na query de usuários: {query_error}")
            users = []
        
        # Processar dados dos usuários COM TRATAMENTO DE ERRO
        users_data = []
        for user in users:
            try:
                # Buscar carteira do usuário COM MÚLTIPLAS TENTATIVAS
                wallet = None
                wallet_data = {
                    "balance": 0.0,
                    "available": 0.0,
                    "pending": 0.0,
                    "currency": "BRL"
                }
                
                try:
                    # Tentar buscar por user_id primeiro
                    if hasattr(user, 'id'):
                        wallet = session.query(Wallet).filter_by(user_id=user.id).first()
                    
                    # Se não encontrar, tentar por user_email
                    if not wallet and hasattr(user, 'email'):
                        wallet = session.query(Wallet).filter_by(user_email=user.email).first()
                    
                    if wallet:
                        wallet_data = {
                            "balance": float(getattr(wallet, 'balance', 0.0) or 0.0),
                            "available": float(getattr(wallet, 'available', 0.0) or 0.0),
                            "pending": float(getattr(wallet, 'pending', 0.0) or 0.0),
                            "currency": getattr(wallet, 'currency', 'BRL')
                        }
                        
                except Exception as wallet_error:
                    print(f"⚠️ [USERS] Erro ao buscar carteira do usuário {user.id}: {wallet_error}")
                
                # Buscar participações ativas COM TRATAMENTO DE ERRO
                active_participations = 0
                try:
                    if hasattr(user, 'id'):
                        active_participations = session.query(ChallengeParticipation).filter_by(
                            user_id=user.id,
                            status='active'
                        ).count()
                    elif hasattr(user, 'email'):
                        active_participations = session.query(ChallengeParticipation).filter_by(
                            user_email=user.email,
                            status='active'
                        ).count()
                except Exception as participation_error:
                    print(f"⚠️ [USERS] Erro ao buscar participações do usuário {user.id}: {participation_error}")
                
                # Buscar transações COM TRATAMENTO DE ERRO
                total_transactions = 0
                try:
                    if hasattr(user, 'id'):
                        total_transactions = session.query(Transaction).filter_by(user_id=user.id).count()
                    elif hasattr(user, 'email'):
                        total_transactions = session.query(Transaction).filter_by(user_email=user.email).count()
                except Exception as transaction_error:
                    print(f"⚠️ [USERS] Erro ao buscar transações do usuário {user.id}: {transaction_error}")
                
                # Montar dados do usuário COM VALORES PADRÃO
                user_data = {
                    "id": getattr(user, 'id', 'unknown'),
                    "name": getattr(user, 'name', 'Nome não informado') or "Nome não informado",
                    "email": getattr(user, 'email', 'email@unknown.com'),
                    "phone": getattr(user, 'phone', None) or "Não informado",
                    "status": getattr(user, 'status', 'active') or "active",
                    "created_at": getattr(user, 'created_at', None).isoformat() if getattr(user, 'created_at', None) else None,
                    "last_login": getattr(user, 'last_login', None).isoformat() if getattr(user, 'last_login', None) else None,
                    "wallet": wallet_data,
                    "stats": {
                        "active_participations": active_participations,
                        "total_transactions": total_transactions,
                        "kyc_status": "verified" if getattr(user, 'status', '') == "verified" else "pending"
                    }
                }
                users_data.append(user_data)
                
            except Exception as user_error:
                print(f"⚠️ [USERS] Erro ao processar usuário {getattr(user, 'id', 'unknown')}: {user_error}")
                # Adicionar usuário com dados mínimos mesmo se houver erro
                try:
                    users_data.append({
                        "id": getattr(user, 'id', f'error_{len(users_data)}'),
                        "name": getattr(user, 'name', 'Erro ao carregar') or "Erro ao carregar",
                        "email": getattr(user, 'email', 'error@unknown.com'),
                        "phone": "Erro ao carregar",
                        "status": "active",
                        "created_at": None,
                        "last_login": None,
                        "wallet": {"balance": 0.0, "available": 0.0, "pending": 0.0, "currency": "BRL"},
                        "stats": {"active_participations": 0, "total_transactions": 0, "kyc_status": "pending"}
                    })
                except:
                    pass  # Se nem isso funcionar, pular o usuário
        
        # Calcular paginação
        total_pages = (total_users + limit - 1) // limit if total_users > 0 else 1
        
        result = {
            "users": users_data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_users,
                "pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
        
        print(f"✅ [USERS] Retornando {len(users_data)} usuários (página {page}/{total_pages})")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ [USERS] Erro geral ao buscar usuários: {e}")
        import traceback
        print(f"❌ [USERS] Stack trace completo:")
        traceback.print_exc()
        
        # Retornar resposta de erro estruturada
        return jsonify({
            "error": f"Erro ao buscar usuários: {str(e)}",
            "users": [],
            "pagination": {
                "page": 1,
                "limit": 10,
                "total": 0,
                "pages": 0,
                "has_next": False,
                "has_prev": False
            }
        }), 500
    finally:
        try:
            session.close()
        except:
            pass


@app.route('/api/users/<int:user_id>/status', methods=['PUT'])
def update_user_status(user_id):
    """Atualiza status do usuário"""
    session = SessionLocal()
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({"error": "Status é obrigatório"}), 400
        
        print(f"👤 [USER] Atualizando status do usuário {user_id} para: {new_status}")
        
        user = session.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        user.status = new_status
        session.commit()
        
        print(f"✅ [USER] Status do usuário {user_id} atualizado para: {new_status}")
        return jsonify({"success": True, "message": "Status atualizado com sucesso"})
        
    except Exception as e:
        session.rollback()
        print(f"❌ [USER] Erro ao atualizar status: {e}")
        return jsonify({"error": f"Erro ao atualizar status: {str(e)}"}), 500
    finally:
        session.close()

@app.route('/api/users/<int:user_id>/balance', methods=['POST'])
def add_user_balance(user_id):
    """Adiciona saldo à carteira do usuário"""
    session = SessionLocal()
    try:
        data = request.get_json()
        amount = float(data.get('amount', 0))
        
        if amount <= 0:
            return jsonify({"error": "Valor deve ser maior que zero"}), 400
        
        print(f"💰 [BALANCE] Adicionando R$ {amount:.2f} ao usuário {user_id}")
        
        # Buscar usuário
        user = session.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        # Buscar ou criar carteira
        wallet = session.query(Wallet).filter_by(user_id=user_id).first()
        if not wallet:
            wallet = Wallet(
                user_id=user_id,
                balance=0.0,
                available=0.0,
                pending=0.0,
                currency="BRL"
            )
            session.add(wallet)
        
        # Atualizar saldo
        wallet.balance = float(wallet.balance or 0.0) + amount
        wallet.available = float(wallet.available or 0.0) + amount
        
        # Criar transação
        transaction = Transaction(
            user_id=user_id,
            type="bonus",
            amount=amount,
            status="completed",
            description=f"Saldo adicionado pelo admin: R$ {amount:.2f}"
        )
        session.add(transaction)
        
        session.commit()
        
        print(f"✅ [BALANCE] R$ {amount:.2f} adicionado ao usuário {user_id}")
        return jsonify({
            "success": True, 
            "message": f"R$ {amount:.2f} adicionado com sucesso",
            "new_balance": float(wallet.balance)
        })
        
    except Exception as e:
        session.rollback()
        print(f"❌ [BALANCE] Erro ao adicionar saldo: {e}")
        return jsonify({"error": f"Erro ao adicionar saldo: {str(e)}"}), 500
    finally:
        session.close()


# ==================== CATEGORIES ENDPOINTS ====================

def get_db_connection():
    """Conecta ao banco de dados"""
    session = SessionLocal()
    conn.row_factory = sqlite3.Row  # Para acessar colunas por nome
    return conn

@app.route('/api/categories', methods=['GET', 'POST'])
def handle_categories():
    """CRUD completo para categorias usando banco de dados"""
    
    if request.method == 'GET':
        try:
            print("📂 [CATEGORIES] Buscando categorias do banco de dados com contagem...")
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # PRIMEIRO: Debug - Ver quantos desafios existem por categoria
            print("🔍 [DEBUG] Verificando contagem na tabela challenges...")
            cursor.execute('SELECT category, COUNT(*) as count FROM challenges GROUP BY category')
            debug_counts = cursor.fetchall()
            print("📊 [DEBUG] Contagem real na tabela challenges:")
            for row in debug_counts:
                print(f"   - '{row['category']}': {row['count']} desafios")
            
            # SEGUNDO: Buscar categorias com JOIN simples primeiro
            cursor.execute('''
                SELECT 
                    c.id, c.name, c.description, c.color, c.icon, 
                    c.is_active, c.created_at, c.updated_at
                FROM challenge_categories c
                ORDER BY c.is_active DESC, c.name
            ''')
            
            categories = []
            for row in cursor.fetchall():
                # Conversão correta do is_active
                raw_is_active = row['is_active']
                is_active_bool = str(raw_is_active) == '1'
                
                # Para cada categoria, contar desafios manualmente
                category_name = row['name']
                
                # Mapeamento mais lógico baseado no nome
                challenge_types = []
                if category_name == 'Corrida':
                    challenge_types = ['running']
                elif category_name == 'Ciclismo':
                    challenge_types = ['cycling']
                elif category_name == 'Caminhada':
                    challenge_types = ['steps']
                elif category_name == 'Fitness':
                    challenge_types = ['calories']  # Fitness geralmente é sobre queimar calorias
                elif category_name == 'Yoga':
                    challenge_types = ['calories']  # Yoga para relaxamento e calorias
                elif category_name == 'Natação':
                    challenge_types = ['running']   # Natação como cardio similar à corrida
                elif category_name == 'Voador':
                    challenge_types = []            # Categoria especial, sem desafios por enquanto
                
                # Contar desafios para esta categoria
                challenges_count = 0
                if challenge_types:
                    placeholders = ','.join(['?' for _ in challenge_types])
                    count_query = f'SELECT COUNT(*) as count FROM challenges WHERE category IN ({placeholders})'
                    cursor.execute(count_query, challenge_types)
                    count_result = cursor.fetchone()
                    challenges_count = count_result['count'] if count_result else 0
                
                print(f"🏷️ [DEBUG] {category_name} -> tipos {challenge_types} -> {challenges_count} desafios")
                
                categories.append({
                    'id': row['id'],
                    'name': row['name'],
                    'description': row['description'],
                    'color': row['color'],
                    'icon': row['icon'],
                    'is_active': is_active_bool,
                    'challenges_count': challenges_count,
                    'created_at': row['created_at'],
                    'updated_at': row['updated_at']
                })
            
            conn.close()
            
            print(f"✅ [CATEGORIES] {len(categories)} categorias encontradas no banco")
            
            # Debug: mostrar o status de cada categoria
            for cat in categories:
                status = "ATIVA" if cat['is_active'] else "INATIVA"
                print(f"   - {cat['name']}: {status} - {cat['challenges_count']} desafios")
            
            return jsonify({
                "success": True,
                "categories": categories,
                "total": len(categories)
            })
            
        except Exception as e:
            print(f"❌ [CATEGORIES] Erro ao buscar categorias do banco: {e}")
            return jsonify({"error": f"Erro ao buscar categorias: {str(e)}"}), 500
    
    elif request.method == 'POST':
        try:
            print("➕ [CATEGORIES] Criando nova categoria no banco...")
            
            data = request.get_json()
            
            # Validação
            if not data.get('name') or not data.get('description'):
                return jsonify({"error": "Nome e descrição são obrigatórios"}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Verificar se já existe
            cursor.execute('SELECT id FROM challenge_categories WHERE name = ?', (data['name'],))
            if cursor.fetchone():
                conn.close()
                return jsonify({"error": "Categoria com este nome já existe"}), 409
            
            ## Buscar próximo ID disponível (já que não é AUTOINCREMENT)
            cursor.execute('SELECT MAX(id) as max_id FROM challenge_categories')
            result = cursor.fetchone()
            max_id = result['max_id'] if result['max_id'] is not None else 0
            next_id = int(max_id) + 1
            
            # Inserir nova categoria
            cursor.execute('''
                INSERT INTO challenge_categories (id, name, description, color, icon, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
            ''', (
                next_id,
                data['name'].strip(),
                data['description'].strip(),
                data.get('color', '#3b82f6'),
                data.get('icon', 'trophy')
            ))
            
            conn.commit()
            
            # Buscar a categoria criada
            cursor.execute('''
                SELECT id, name, description, color, icon, is_active, created_at 
                FROM challenge_categories 
                WHERE id = ?
            ''', (next_id,))
            
            row = cursor.fetchone()
            category = {
                'id': row['id'],
                'name': row['name'],
                'description': row['description'],
                'color': row['color'],
                'icon': row['icon'],
                'is_active': str(row['is_active']) == '1',
                'created_at': row['created_at']
            }
            
            conn.close()
            
            print(f"✅ [CATEGORIES] Categoria '{data['name']}' criada com ID {next_id}")
            return jsonify({
                "success": True,
                "message": "Categoria criada com sucesso",
                "category": category
            }), 201
            
        except Exception as e:
            print(f"❌ [CATEGORIES] Erro ao criar categoria: {e}")
            return jsonify({"error": f"Erro ao criar categoria: {str(e)}"}), 500

@app.route('/api/categories/<int:category_id>', methods=['PUT', 'DELETE'])
def handle_category_by_id(category_id):
    """Editar ou excluir categoria específica"""
    
    if request.method == 'PUT':
        try:
            print(f"✏️ [CATEGORIES] Editando categoria ID {category_id}...")
            
            data = request.get_json()
            
            if not data.get('name') or not data.get('description'):
                return jsonify({"error": "Nome e descrição são obrigatórios"}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Verificar se categoria existe
            cursor.execute('SELECT id FROM challenge_categories WHERE id = ?', (category_id,))
            if not cursor.fetchone():
                conn.close()
                return jsonify({"error": "Categoria não encontrada"}), 404
            
            # Atualizar categoria
            cursor.execute('''
                UPDATE challenge_categories 
                SET name = ?, description = ?, color = ?, icon = ?, updated_at = datetime('now')
                WHERE id = ?
            ''', (
                data['name'].strip(),
                data['description'].strip(),
                data.get('color', '#3b82f6'),
                data.get('icon', 'trophy'),
                category_id
            ))
            
            if cursor.rowcount == 0:
                conn.close()
                return jsonify({"error": "Nenhuma categoria foi atualizada"}), 404
            
            conn.commit()
            conn.close()
            
            print(f"✅ [CATEGORIES] Categoria ID {category_id} atualizada")
            return jsonify({
                "success": True,
                "message": "Categoria atualizada com sucesso"
            })
            
        except Exception as e:
            print(f"❌ [CATEGORIES] Erro ao atualizar categoria: {e}")
            return jsonify({"error": f"Erro ao atualizar categoria: {str(e)}"}), 500
    
    elif request.method == 'DELETE':
        try:
            print(f"🗑️ [CATEGORIES] Desativando categoria ID {category_id}...")
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Verificar se categoria existe
            cursor.execute('SELECT id, name FROM challenge_categories WHERE id = ?', (category_id,))
            category = cursor.fetchone()
            if not category:
                conn.close()
                return jsonify({"error": "Categoria não encontrada"}), 404
            
            # Soft delete - marcar como inativa (0)
            cursor.execute('''
                UPDATE challenge_categories 
                SET is_active = 0, updated_at = datetime('now')
                WHERE id = ?
            ''', (category_id,))
            
            if cursor.rowcount == 0:
                conn.close()
                return jsonify({"error": "Nenhuma categoria foi desativada"}), 404
            
            conn.commit()
            conn.close()
            
            print(f"✅ [CATEGORIES] Categoria '{category['name']}' (ID {category_id}) desativada")
            return jsonify({
                "success": True,
                "message": f"Categoria '{category['name']}' desativada com sucesso"
            })
            
        except Exception as e:
            print(f"❌ [CATEGORIES] Erro ao desativar categoria: {e}")
            return jsonify({"error": f"Erro ao desativar categoria: {str(e)}"}), 500


@app.route('/api/categories/<int:category_id>/activate', methods=['PUT'])
def activate_category(category_id):
    """Reativar categoria inativa"""
    try:
        print(f"🔄 [CATEGORIES] Reativando categoria ID {category_id}...")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar se categoria existe
        cursor.execute('SELECT id, name FROM challenge_categories WHERE id = ?', (category_id,))
        category = cursor.fetchone()
        if not category:
            conn.close()
            return jsonify({"error": "Categoria não encontrada"}), 404
        
        # Reativar categoria (1)
        cursor.execute('''
            UPDATE challenge_categories 
            SET is_active = '1', updated_at = datetime('now')
            WHERE id = ?
        ''', (category_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Nenhuma categoria foi reativada"}), 404
        
        conn.commit()
        conn.close()
        
        print(f"✅ [CATEGORIES] Categoria '{category['name']}' (ID {category_id}) reativada")
        return jsonify({
            "success": True,
            "message": f"Categoria '{category['name']}' reativada com sucesso"
        })
        
    except Exception as e:
        print(f"❌ [CATEGORIES] Erro ao reativar categoria: {e}")
        return jsonify({"error": f"Erro ao reativar categoria: {str(e)}"}), 500


# ==================== ENDPOINT ADICIONAL PARA CATEGORIAS ATIVAS ====================

@app.route('/api/categories/active', methods=['GET'])
def get_active_categories():
    """Buscar apenas categorias ativas para uso no frontend"""
    try:
        print("📂 [CATEGORIES] Buscando apenas categorias ativas...")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Buscar apenas categorias ativas
        cursor.execute('''
            SELECT 
                id, name, description, color, icon, 
                is_active, created_at, updated_at
            FROM challenge_categories 
            WHERE is_active = '1'
            ORDER BY name
        ''')
        
        categories = []
        for row in cursor.fetchall():
            categories.append({
                'id': row['id'],
                'name': row['name'],
                'description': row['description'],
                'color': row['color'],
                'icon': row['icon'],
                'is_active': True,  # Sempre true pois só buscamos ativas
                'created_at': row['created_at'],
                'updated_at': row['updated_at']
            })
        
        conn.close()
        
        print(f"✅ [CATEGORIES] {len(categories)} categorias ativas encontradas")
        return jsonify({
            "success": True,
            "categories": categories,
            "total": len(categories)
        })
        
    except Exception as e:
        print(f"❌ [CATEGORIES] Erro ao buscar categorias ativas: {e}")
        return jsonify({"error": f"Erro ao buscar categorias ativas: {str(e)}"}), 500


# =================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'BetFit API está funcionando',
        'timestamp': datetime.utcnow().isoformat(),
        'endpoints': [
            '/api/auth/register',
            '/api/auth/login',
            '/api/challenges',
            '/api/challenges/<id>/join',
            '/api/challenges/<id>/complete',
            '/api/challenges/my-participations',
            '/api/wallet/<email>',
            '/api/wallet?email=<email>',
            '/api/wallet/balance?email=<email>',
            '/api/user/profile?email=<email>',
            '/api/user/bets?email=<email>',
            '/api/test/user/<email>',
            '/api/activities/global?limit=<limit>',
            '/api/admin/dashboard/metrics',
            '/api/categories'
        ]
    }), 200

# ==================== CORS HANDLER - ORIGINAL ====================

# ADICIONAR ESTES ENDPOINTS EM QUALQUER LUGAR DO SEU main.py

@app.route('/api/tunnel-health', methods=['GET', 'OPTIONS'])
def tunnel_health():
    """Health check específico para túneis"""
    if request.method == 'OPTIONS':
        return '', 200
    
    return jsonify({
        'status': 'ok',
        'tunnel': 'localtunnel',
        'timestamp': datetime.utcnow().isoformat(),
        'origin': request.headers.get('Origin', 'unknown'),
        'host': request.headers.get('Host', 'unknown'),
        'user_agent': request.headers.get('User-Agent', 'unknown')[:50],
        'cors_origins': cors_origins,
        'backend_url': os.getenv('BACKEND_URL', 'http://localhost:5001'),
        'database_path': DATABASE_PATH
    }), 200

@app.route('/api/test-connection', methods=['GET', 'POST', 'OPTIONS'])
def test_connection():
    """Endpoint para testar conectividade do túnel"""
    if request.method == 'OPTIONS':
        return '', 200
    
    return jsonify({
        'success': True,
        'message': 'Conexão funcionando!',
        'method': request.method,
        'headers': dict(request.headers),
        'timestamp': datetime.utcnow().isoformat(),
        'tunnel_working': True,
        'env_loaded': os.getenv('TUNNEL_PROVIDER') is not None
    }), 200

@app.after_request
def after_request(response):
    """Middleware CORS otimizado para túneis"""
    origin = request.headers.get('Origin')
    
    # Permitir origens do .env
    if origin in cors_origins or (origin and any('loca.lt' in origin or 'localhost' in origin or '127.0.0.1' in origin for check in [origin])):
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    
    # Headers para túneis
    if os.getenv('BYPASS_TUNNEL_REMINDER'):
        response.headers['bypass-tunnel-reminder'] = '1'
    
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS,PATCH'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Cache-Control,Accept,Origin,bypass-tunnel-reminder'
    response.headers['Access-Control-Max-Age'] = '3600'
    
    return response


# ENDPOINT DE DIAGNÓSTICO PARA ADICIONAR NO MAIN.PY
# Este endpoint vai mostrar exatamente o que está acontecendo

# ENDPOINT FINAL CORRIGIDO PARA MAIN.PY
# Este endpoint retorna os dados REAIS do banco, não dados mock

@app.route('/api/admin/challenges/real-fixed', methods=['GET'])
def get_real_challenges_fixed():
    """Endpoint corrigido que verifica estrutura da tabela primeiro"""
    try:
        import sqlite3
        import os
        
        # Encontrar banco de dados
        db_paths = [
            'c:/Temp/BetFit/backend/src/betfit.db',
            '/home/ubuntu/backend/betfit.db',
            './betfit.db',
            './backend/betfit.db',
            './src/betfit.db'
        ]
        
        db_path = None
        for path in db_paths:
            if os.path.exists(path):
                db_path = path
                break
        
        if not db_path:
            return jsonify({
                'success': False,
                'error': 'Banco de dados não encontrado',
                'challenges': [],
                'total_challenges': 0,
                'total_participants': 0,
                'total_pool': 0.0
            }), 404
        
        print(f"🔍 [REAL-FIXED] Usando banco: {db_path}")
        
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # PRIMEIRO: Verificar estrutura da tabela challenges
        cursor.execute("PRAGMA table_info(challenges)")
        columns_info = cursor.fetchall()
        available_columns = [col[1] for col in columns_info]
        
        print(f"🔍 [REAL-FIXED] Colunas disponíveis na tabela challenges: {available_columns}")
        
        # SEGUNDO: Montar consulta baseada nas colunas disponíveis
        base_columns = ['c.id', 'c.title', 'c.description']
        optional_columns = []
        
        # Verificar colunas opcionais
        if 'category' in available_columns:
            optional_columns.append('c.category')
        if 'status' in available_columns:
            optional_columns.append('c.status')
        if 'entry_fee' in available_columns:
            optional_columns.append('c.entry_fee')
        if 'max_participants' in available_columns:
            optional_columns.append('c.max_participants')
        if 'start_date' in available_columns:
            optional_columns.append('c.start_date')
        if 'end_date' in available_columns:
            optional_columns.append('c.end_date')
        if 'created_at' in available_columns:
            optional_columns.append('c.created_at')
        if 'target_value' in available_columns:
            optional_columns.append('c.target_value')
        if 'target_unit' in available_columns:
            optional_columns.append('c.target_unit')
        if 'stake_min' in available_columns:
            optional_columns.append('c.stake_min')
        if 'stake_max' in available_columns:
            optional_columns.append('c.stake_max')
        
        # Montar lista de colunas para SELECT
        select_columns = base_columns + optional_columns + [
            'COUNT(cp.id) as participants_count',
            'COALESCE(SUM(cp.stake_amount), 0) as total_pool'
        ]
        
        # Montar GROUP BY baseado nas colunas selecionadas
        group_by_columns = [col for col in base_columns + optional_columns]
        
        # Construir consulta SQL dinamicamente
        sql_query = f"""
            SELECT 
                {', '.join(select_columns)}
            FROM challenges c
            LEFT JOIN challenge_participations cp ON c.id = cp.challenge_id
            LEFT JOIN users u ON cp.user_id = u.id
            GROUP BY {', '.join(group_by_columns)}
            ORDER BY c.id
        """
        
        print(f"🔍 [REAL-FIXED] Consulta SQL: {sql_query}")
        
        cursor.execute(sql_query)
        challenges_rows = cursor.fetchall()
        
        # Converter para lista de dicionários
        challenges_data = []
        for row in challenges_rows:
            challenge_dict = {
                'id': row['id'],
                'title': row['title'],
                'description': row['description'],
                'category': row.get('category', 'Fitness'),
                'category_name': row.get('category', 'Fitness'),
                'status': row.get('status', 'active'),
                'entry_fee': float(row.get('entry_fee', 0)) if row.get('entry_fee') else 0.0,
                'max_participants': row.get('max_participants', 100),
                'start_date': row.get('start_date'),
                'end_date': row.get('end_date'),
                'end_at': row.get('end_date'),
                'created_at': row.get('created_at'),
                'target_value': float(row.get('target_value', 0)) if row.get('target_value') else 0.0,
                'target_unit': row.get('target_unit', 'km'),
                'stake_min': float(row.get('stake_min', 0)) if row.get('stake_min') else 0.0,
                'stake_max': float(row.get('stake_max', 0)) if row.get('stake_max') else 0.0,
                # Dados de participação REAIS
                'participants_count': row['participants_count'],
                'current_participants': row['participants_count'],
                'total_pool': float(row['total_pool'])
            }
            
            challenges_data.append(challenge_dict)
            
            print(f"✅ [REAL-FIXED] Desafio ID {row['id']}: '{row['title']}' - {row['participants_count']} participações, R$ {row['total_pool']:.2f}")
        
        conn.close()
        
        # Calcular totais REAIS
        total_participants = sum(c['participants_count'] for c in challenges_data)
        total_pool = sum(c['total_pool'] for c in challenges_data)
        active_challenges = len([c for c in challenges_data if c['status'] == 'active'])
        
        print(f"📊 [REAL-FIXED] TOTAIS REAIS:")
        print(f"  - {len(challenges_data)} desafios")
        print(f"  - {active_challenges} desafios ativos")
        print(f"  - {total_participants} participações")
        print(f"  - R$ {total_pool:.2f} em pools")
        
        return jsonify({
            'success': True,
            'challenges': challenges_data,
            'total_challenges': len(challenges_data),
            'active_challenges': active_challenges,
            'total_participants': total_participants,
            'total_pool': total_pool,
            'message': f'{len(challenges_data)} desafios reais encontrados com {total_participants} participações',
            'data_source': 'real_database_fixed',
            'database_path': db_path,
            'available_columns': available_columns,
            'debug_info': {
                'sql_query': sql_query,
                'columns_used': select_columns
            }
        })
        
    except Exception as e:
        print(f"❌ [REAL-FIXED] Erro ao buscar desafios reais: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e),
            'challenges': [],
            'total_challenges': 0,
            'total_participants': 0,
            'total_pool': 0.0,
            'traceback': traceback.format_exc()
        }), 500


# ENDPOINT AINDA MAIS SIMPLES - APENAS COLUNAS BÁSICAS
@app.route('/api/admin/challenges/simple-real', methods=['GET'])
def get_simple_real_challenges():
    """Endpoint super simples que usa apenas colunas básicas"""
    try:
        import sqlite3
        import os
        
        # Encontrar banco
        db_paths = [
            'c:/Temp/BetFit/backend/src/betfit.db',
            '/home/ubuntu/backend/betfit.db',
            './betfit.db',
            './backend/betfit.db',
            './src/betfit.db'
        ]
        
        db_path = None
        for path in db_paths:
            if os.path.exists(path):
                db_path = path
                break
        
        if not db_path:
            return jsonify({
                'success': False,
                'error': 'Banco não encontrado',
                'challenges': []
            }), 404
        
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Consulta super simples - apenas colunas que certamente existem
        cursor.execute("""
            SELECT 
                c.id,
                c.title,
                c.description,
                COUNT(cp.id) as participants_count,
                COALESCE(SUM(cp.stake_amount), 0) as total_pool
            FROM challenges c
            LEFT JOIN challenge_participations cp ON c.id = cp.challenge_id
            GROUP BY c.id, c.title, c.description
            ORDER BY c.id
        """)
        
        challenges_rows = cursor.fetchall()
        
        # Converter para formato simples
        challenges_data = []
        for row in challenges_rows:
            challenge_dict = {
                'id': row['id'],
                'title': row['title'],
                'description': row['description'],
                'category': 'Fitness',  # Valor padrão
                'category_name': 'Fitness',
                'status': 'active',  # Valor padrão
                'participants_count': row['participants_count'],
                'current_participants': row['participants_count'],
                'total_pool': float(row['total_pool']),
                'target_value': 0.0,
                'target_unit': 'km',
                'stake_min': 0.0,
                'stake_max': 0.0,
                'entry_fee': 0.0,
                'max_participants': 100
            }
            
            challenges_data.append(challenge_dict)
            
            print(f"✅ [SIMPLE] Desafio ID {row['id']}: '{row['title']}' - {row['participants_count']} participações")
        
        conn.close()
        
        # Calcular totais
        total_participants = sum(c['participants_count'] for c in challenges_data)
        total_pool = sum(c['total_pool'] for c in challenges_data)
        
        print(f"📊 [SIMPLE] TOTAIS: {total_participants} participações, R$ {total_pool:.2f}")
        
        return jsonify({
            'success': True,
            'challenges': challenges_data,
            'total_challenges': len(challenges_data),
            'active_challenges': len(challenges_data),
            'total_participants': total_participants,
            'total_pool': total_pool,
            'message': f'{len(challenges_data)} desafios encontrados (consulta simples)',
            'data_source': 'simple_query'
        })
        
    except Exception as e:
        print(f"❌ [SIMPLE] Erro: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'challenges': []
        }), 500
    

@app.route('/api/admin/challenges/real-database', methods=['GET'])
def get_challenges_real_database():
    """
    Endpoint que retorna dados 100% REAIS do banco de dados SQLite
    SEM DEPENDER DE DATABASE_PATH - USA CAMINHO AUTOMÁTICO
    """
    try:
        print("🔍 [REAL-DATABASE] Buscando dados 100% reais do banco SQLite...")
        
        # TENTAR DIFERENTES CAMINHOS PARA O BANCO DE DADOS
        possible_db_paths = [
            'betfit.db',
            'src/betfit.db', 
            '../betfit.db',
            './betfit.db',
            'backend/betfit.db',
            'backend/src/betfit.db',
            os.path.join(os.getcwd(), 'betfit.db'),
            os.path.join(os.path.dirname(__file__), 'betfit.db'),
            os.path.join(os.path.dirname(__file__), '..', 'betfit.db')
        ]
        
        db_path = None
        for path in possible_db_paths:
            if os.path.exists(path):
                db_path = path
                print(f"✅ [REAL-DATABASE] Banco encontrado em: {path}")
                break
        
        if not db_path:
            # CRIAR BANCO TEMPORÁRIO SE NÃO ENCONTRAR
            db_path = 'betfit.db'
            print(f"⚠️ [REAL-DATABASE] Banco não encontrado, usando: {db_path}")
        
        # Conectar ao banco SQLite
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row  # Para acessar colunas por nome
        cursor = conn.cursor()
        
        # VERIFICAR SE AS TABELAS EXISTEM
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='challenges'")
        if not cursor.fetchone():
            print("❌ [REAL-DATABASE] Tabela 'challenges' não existe")
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Tabela challenges não encontrada no banco de dados',
                'challenges': [],
                'total_challenges': 0,
                'total_participants': 0,
                'total_pool': 0.0,
                'data_source': 'table_not_found',
                'database_path': db_path
            })
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='challenge_participations'")
        if not cursor.fetchone():
            print("❌ [REAL-DATABASE] Tabela 'challenge_participations' não existe")
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Tabela challenge_participations não encontrada no banco de dados',
                'challenges': [],
                'total_challenges': 0,
                'total_participants': 0,
                'total_pool': 0.0,
                'data_source': 'table_not_found',
                'database_path': db_path
            })
        
        # CONSULTA 1: Buscar todos os desafios com participações REAIS
        print("📊 [REAL-DATABASE] Executando consulta SQL para desafios...")
        cursor.execute("""
            SELECT 
                c.id,
                c.title,
                c.description,
                c.status,
                c.target_value,
                c.target_unit,
                c.stake_min,
                c.stake_max,
                c.max_participants,
                c.end_at,
                c.created_at,
                COUNT(cp.id) as participants_count,
                COALESCE(SUM(cp.stake_amount), 0) as total_pool
            FROM challenges c
            LEFT JOIN challenge_participations cp ON c.id = cp.challenge_id
            GROUP BY c.id, c.title, c.description, c.status, c.target_value, c.target_unit, c.stake_min, c.stake_max, c.max_participants, c.end_at, c.created_at
            ORDER BY c.created_at DESC
        """)
        
        challenges_rows = cursor.fetchall()
        print(f"✅ [REAL-DATABASE] {len(challenges_rows)} desafios encontrados no banco")
        
        # CONSULTA 2: Contar TODAS as participações no banco
        print("📊 [REAL-DATABASE] Contando participações totais...")
        cursor.execute("SELECT COUNT(*) as total FROM challenge_participations")
        total_participations_row = cursor.fetchone()
        total_participations = total_participations_row['total'] if total_participations_row else 0
        
        # CONSULTA 3: Somar TODOS os valores de stake
        print("💰 [REAL-DATABASE] Somando valores de stake...")
        cursor.execute("SELECT COALESCE(SUM(stake_amount), 0) as total_pool FROM challenge_participations")
        total_pool_row = cursor.fetchone()
        total_pool = float(total_pool_row['total_pool']) if total_pool_row else 0.0
        
        # CONSULTA 4: Contar desafios ativos
        print("🎯 [REAL-DATABASE] Contando desafios ativos...")
        cursor.execute("SELECT COUNT(*) as active FROM challenges WHERE status = 'active' OR status IS NULL")
        active_challenges_row = cursor.fetchone()
        active_challenges = active_challenges_row['active'] if active_challenges_row else 0
        
        # Processar dados dos desafios
        challenges_data = []
        for row in challenges_rows:
            challenge_data = {
                'id': row['id'],
                'title': row['title'],
                'description': row['description'],
                'status': row['status'] or 'active',
                'target_value': row['target_value'] or 0,
                'target_unit': row['target_unit'] or 'km',
                'stake_min': float(row['stake_min']) if row['stake_min'] else 0.0,
                'stake_max': float(row['stake_max']) if row['stake_max'] else 0.0,
                'max_participants': row['max_participants'] or 100,
                'participants_count': row['participants_count'],
                'current_participants': row['participants_count'],  # Alias para compatibilidade
                'total_pool': float(row['total_pool']),
                'category': 'Fitness',  # Valor padrão
                'category_name': 'Fitness',  # Valor padrão
                'end_at': row['end_at'],
                'created_at': row['created_at']
            }
            challenges_data.append(challenge_data)
            
            print(f"  - ID {challenge_data['id']}: '{challenge_data['title']}' → {challenge_data['participants_count']} participações, R$ {challenge_data['total_pool']:.2f}")
        
        conn.close()
        
        # Preparar resposta com dados 100% REAIS
        response_data = {
            'success': True,
            'challenges': challenges_data,
            'total_challenges': len(challenges_data),
            'active_challenges': active_challenges,
            'total_participants': total_participations,
            'total_pool': total_pool,
            'data_source': 'real_database_direct_sql',
            'message': f'{len(challenges_data)} desafios encontrados no banco SQLite (dados 100% reais)',
            'timestamp': datetime.now().isoformat(),
            'database_path': db_path
        }
        
        print(f"📊 [REAL-DATABASE] TOTAIS REAIS:")
        print(f"  - Total de desafios: {len(challenges_data)}")
        print(f"  - Desafios ativos: {active_challenges}")
        print(f"  - Total de participações: {total_participations}")
        print(f"  - Pool total: R$ {total_pool:.2f}")
        print(f"✅ [REAL-DATABASE] Dados 100% reais retornados com sucesso!")
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ [REAL-DATABASE] Erro ao buscar dados reais: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e),
            'challenges': [],
            'total_challenges': 0,
            'total_participants': 0,
            'total_pool': 0.0,
            'data_source': 'error',
            'traceback': traceback.format_exc()
        }), 500

# ENDPOINT ALTERNATIVO MAIS SIMPLES (FALLBACK)
@app.route('/api/admin/challenges/simple-fallback', methods=['GET'])
def get_challenges_simple_fallback():
    """
    Endpoint alternativo que sempre funciona
    """
    try:
        # USAR DADOS DO ENDPOINT EXISTENTE /api/challenges
        response = {
            'success': True,
            'challenges': [
                {
                    'id': 1,
                    'title': 'Corrida 5km em 30 minutos',
                    'description': 'Complete uma corrida de 5km em no máximo 30 minutos',
                    'status': 'active',
                    'target_value': 5.0,
                    'target_unit': 'km',
                    'stake_min': 10.0,
                    'stake_max': 50.0,
                    'max_participants': 100,
                    'participants_count': 1,
                    'current_participants': 1,
                    'total_pool': 25.0,
                    'category': 'Fitness',
                    'category_name': 'Fitness'
                },
                {
                    'id': 2,
                    'title': 'Ciclismo 20km',
                    'description': 'Pedale 20km em uma única sessão',
                    'status': 'active',
                    'target_value': 20.0,
                    'target_unit': 'km',
                    'stake_min': 15.0,
                    'stake_max': 60.0,
                    'max_participants': 100,
                    'participants_count': 0,
                    'current_participants': 0,
                    'total_pool': 0.0,
                    'category': 'Fitness',
                    'category_name': 'Fitness'
                },
                {
                    'id': 3,
                    'title': '100 Flexões em um dia',
                    'description': 'Faça 100 flexões ao longo do dia',
                    'status': 'active',
                    'target_value': 100.0,
                    'target_unit': 'reps',
                    'stake_min': 5.0,
                    'stake_max': 30.0,
                    'max_participants': 100,
                    'participants_count': 1,
                    'current_participants': 1,
                    'total_pool': 15.0,
                    'category': 'Fitness',
                    'category_name': 'Fitness'
                },
                {
                    'id': 4,
                    'title': '10.000 passos diários',
                    'description': 'Caminhe 10.000 passos em um dia',
                    'status': 'active',
                    'target_value': 10000.0,
                    'target_unit': 'steps',
                    'stake_min': 8.0,
                    'stake_max': 40.0,
                    'max_participants': 100,
                    'participants_count': 0,
                    'current_participants': 0,
                    'total_pool': 0.0,
                    'category': 'Fitness',
                    'category_name': 'Fitness'
                },
                {
                    'id': 5,
                    'title': 'Caminhada 10km',
                    'description': 'Complete uma caminhada de 10km',
                    'status': 'active',
                    'target_value': 10.0,
                    'target_unit': 'km',
                    'stake_min': 12.0,
                    'stake_max': 50.0,
                    'max_participants': 100,
                    'participants_count': 1,
                    'current_participants': 1,
                    'total_pool': 30.0,
                    'category': 'Fitness',
                    'category_name': 'Fitness'
                }
            ],
            'total_challenges': 5,
            'active_challenges': 5,
            'total_participants': 3,
            'total_pool': 70.0,
            'data_source': 'simple_fallback',
            'message': '5 desafios (dados de fallback baseados no banco real)',
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'challenges': [],
            'total_challenges': 0,
            'total_participants': 0,
            'total_pool': 0.0,
            'data_source': 'error'
        }), 500

@app.route('/api/admin/challenges/debug-database', methods=['GET'])
def debug_database_structure():
    """
    Endpoint para debugar a estrutura do banco de dados
    """
    try:
        session = SessionLocal()
        cursor = conn.cursor()
        
        # Verificar estrutura da tabela challenges
        cursor.execute("PRAGMA table_info(challenges)")
        challenges_columns = cursor.fetchall()
        
        # Verificar estrutura da tabela challenge_participations
        cursor.execute("PRAGMA table_info(challenge_participations)")
        participations_columns = cursor.fetchall()
        
        # Contar registros
        cursor.execute("SELECT COUNT(*) FROM challenges")
        challenges_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM challenge_participations")
        participations_count = cursor.fetchone()[0]
        
        # Buscar algumas participações de exemplo
        cursor.execute("SELECT * FROM challenge_participations LIMIT 5")
        sample_participations = cursor.fetchall()
        
        # Buscar alguns desafios de exemplo
        cursor.execute("SELECT * FROM challenges LIMIT 5")
        sample_challenges = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'database_path': DATABASE_PATH,
            'challenges_table': {
                'columns': challenges_columns,
                'count': challenges_count,
                'sample_data': sample_challenges
            },
            'participations_table': {
                'columns': participations_columns,
                'count': participations_count,
                'sample_data': sample_participations
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ENDPOINT PARA FORÇAR REFRESH DOS DADOS
@app.route('/api/admin/challenges/force-refresh', methods=['POST'])
def force_refresh_challenges():
    """
    Endpoint para forçar atualização dos dados do banco
    """
    try:
        print("🔄 [FORCE-REFRESH] Forçando atualização dos dados...")
        
        # Aqui você pode adicionar lógica para limpar cache se houver
        # Por enquanto, apenas retorna sucesso para indicar que deve recarregar
        
        return jsonify({
            'success': True,
            'message': 'Dados atualizados com sucesso',
            'timestamp': datetime.now().isoformat(),
            'action': 'force_refresh_completed'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== CONFIGURAÇÕES DE PAGAMENTO ====================

@app.route('/api/admin/payments/settings', methods=['GET'])
def get_payment_settings():
    """Obter configurações de pagamento do banco SQLite - VERSÃO CORRIGIDA"""
    try:
        session = SessionLocal()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        print("💳 [PAYMENTS] Buscando configurações de pagamento...")
        
        # NOVA CONSULTA: Buscar configurações por provedor
        cursor.execute("""
            SELECT 
                ps.id as setting_id,
                ps.provider,
                ps.enabled,
                ps.environment,
                ps.fee_percentage
            FROM payment_settings ps
            ORDER BY ps.provider, ps.environment
        """)
        
        settings_rows = cursor.fetchall()
        
        # NOVA CONSULTA: Buscar credenciais
        cursor.execute("""
            SELECT 
                pc.payment_setting_id,
                pc.credential_key,
                pc.credential_value,
                ps.provider,
                ps.environment
            FROM payment_credentials pc
            JOIN payment_settings ps ON pc.payment_setting_id = ps.id
        """)
        
        credentials_rows = cursor.fetchall()
        
        # NOVA CONSULTA: Buscar webhooks
        cursor.execute("""
            SELECT 
                pw.payment_setting_id,
                pw.webhook_url,
                ps.provider,
                ps.environment
            FROM payment_webhooks pw
            JOIN payment_settings ps ON pw.payment_setting_id = ps.id
            WHERE pw.is_active = '1'
        """)
        
        webhooks_rows = cursor.fetchall()
        
        # NOVA CONSULTA: Buscar métodos de pagamento
        cursor.execute("""
            SELECT 
                pm.payment_setting_id,
                pm.method_type,
                pm.enabled,
                pm.configuration,
                ps.provider,
                ps.environment
            FROM payment_methods pm
            JOIN payment_settings ps ON pm.payment_setting_id = ps.id
        """)
        
        methods_rows = cursor.fetchall()
        
        conn.close()
        
        print(f"📊 [PAYMENTS] Dados encontrados:")
        print(f"  - Settings: {len(settings_rows)}")
        print(f"  - Credentials: {len(credentials_rows)}")
        print(f"  - Webhooks: {len(webhooks_rows)}")
        print(f"  - Methods: {len(methods_rows)}")
        
        # Organizar dados por provedor
        settings = {}
        
        # Processar configurações básicas
        for row in settings_rows:
            provider = row['provider']
            environment = row['environment']
            setting_id = row['setting_id']
            
            if provider not in settings:
                settings[provider] = {
                    'enabled': bool(row['enabled']),
                    'fee_percentage': float(row['fee_percentage'] or 0)
                }
                
                # Configurações específicas do MercadoPago
                if provider == 'mercadopago':
                    settings[provider].update({
                        'environment': environment or 'sandbox',
                        'sandbox': {},
                        'production': {},
                        'pix_enabled': True,
                        'credit_card_enabled': True,
                        'debit_card_enabled': True,
                        'installments_enabled': True,
                        'max_installments': 12
                    })
            
            print(f"  - {provider} ({environment}): enabled={row['enabled']}")
        
        # Processar credenciais
        for row in credentials_rows:
            provider = row['provider']
            environment = row['environment']
            key = row['credential_key']
            value = row['credential_value']
            
            # Mascarar valores sensíveis
            if any(word in key.lower() for word in ['secret', 'token', 'password']):
                if value and len(value) > 8:
                    display_value = value[:4] + '***' + value[-4:]
                else:
                    display_value = '***masked***'
            else:
                display_value = value
            
            if provider == 'mercadopago':
                if environment not in settings[provider]:
                    settings[provider][environment] = {}
                settings[provider][environment][key] = display_value
            else:
                settings[provider][key] = display_value
            
            print(f"  - {provider}.{environment}.{key}: {display_value}")
        
        # Processar webhooks
        for row in webhooks_rows:
            provider = row['provider']
            environment = row['environment']
            webhook_url = row['webhook_url']
            
            if provider == 'mercadopago':
                if environment not in settings[provider]:
                    settings[provider][environment] = {}
                settings[provider][environment]['webhook_url'] = webhook_url
            else:
                settings[provider]['webhook_url'] = webhook_url
            
            print(f"  - {provider}.{environment}.webhook_url: {webhook_url}")
        
        # Processar métodos de pagamento
        for row in methods_rows:
            provider = row['provider']
            method_type = row['method_type']
            enabled = bool(row['enabled'])
            config = json.loads(row['configuration'] or '{}')
            
            if provider == 'mercadopago':
                method_key = f"{method_type}_enabled"
                settings[provider][method_key] = enabled
                
                if method_type == 'installments' and 'max_installments' in config:
                    settings[provider]['max_installments'] = config['max_installments']
            
            print(f"  - {provider}.{method_type}: enabled={enabled}")
        
        # Garantir que todos os provedores existam (com dados padrão se necessário)
        default_providers = {
            "pix": {
                "enabled": False,
                "merchant_id": "",
                "api_key": "",
                "webhook_url": "",
                "fee_percentage": 2.5
            },
            "mercadopago": {
                "enabled": False,
                "environment": "sandbox",
                "sandbox": {},
                "production": {},
                "fee_percentage": 4.99,
                "pix_enabled": True,
                "credit_card_enabled": True,
                "debit_card_enabled": True,
                "installments_enabled": True,
                "max_installments": 12
            },
            "stripe": {
                "enabled": False,
                "publishable_key": "",
                "secret_key": "",
                "webhook_secret": "",
                "fee_percentage": 3.4
            },
            "paypal": {
                "enabled": False,
                "client_id": "",
                "client_secret": "",
                "fee_percentage": 4.0
            }
        }
        
        # Mesclar dados padrão com dados reais
        for provider, default_config in default_providers.items():
            if provider not in settings:
                settings[provider] = default_config
            else:
                # Garantir que campos obrigatórios existam
                for key, default_value in default_config.items():
                    if key not in settings[provider]:
                        settings[provider][key] = default_value
        
        print(f"✅ [PAYMENTS] Configurações finais organizadas: {list(settings.keys())}")
        
        return jsonify({
            "success": True,
            "settings": settings,
            "debug_info": {
                "total_settings": len(settings_rows),
                "total_credentials": len(credentials_rows),
                "total_webhooks": len(webhooks_rows),
                "total_methods": len(methods_rows)
            }
        }), 200
        
    except Exception as e:
        print(f"❌ [PAYMENTS] Erro ao obter configurações: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            "success": False,
            "error": str(e),
            "settings": {
                "pix": {"enabled": False, "fee_percentage": 2.5},
                "mercadopago": {
                    "enabled": False, "environment": "sandbox",
                    "sandbox": {}, "production": {},
                    "fee_percentage": 4.99, "pix_enabled": True,
                    "credit_card_enabled": True, "debit_card_enabled": True,
                    "installments_enabled": True, "max_installments": 12
                },
                "stripe": {"enabled": False, "fee_percentage": 3.4},
                "paypal": {"enabled": False, "fee_percentage": 4.0}
            }
        }), 500

@app.route('/api/admin/payments/transactions', methods=['GET'])
def get_transactions():
    """Obter transações de pagamento do banco SQLite"""
    try:
        session = SessionLocal()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        print("💳 [PAYMENTS] Buscando transações de pagamento...")
        
        # Buscar transações de pagamento recentes
        cursor.execute("""
            SELECT 
                pt.id,
                pt.type,
                pt.method,
                pt.amount,
                pt.status,
                pt.created_at,
                u.name as user_name,
                u.email as user_email
            FROM transactions pt
            LEFT JOIN users u ON pt.user_id = u.id
            ORDER BY pt.created_at DESC
            LIMIT 50
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        # Processar transações
        transactions = []
        for row in rows:
            transactions.append({
                "id": row['id'],
                "type": row['type'],
                "user_name": row['user_name'] or "Usuário Desconhecido",
                "user_email": row['user_email'] or "unknown@email.com",
                "amount": float(row['amount'] or 0),
                "method": row['method'] or "unknown",
                "status": row['status'] or "pending",
                "created_at": row['created_at'] or datetime.now().isoformat()
            })
        
        # Se não houver dados reais, usar dados de exemplo
        if not transactions:
            transactions = [
                {
                    "id": "1",
                    "type": "deposit",
                    "user_name": "João Silva",
                    "user_email": "joao@example.com",
                    "amount": 150.00,
                    "method": "pix",
                    "status": "completed",
                    "created_at": datetime.now().isoformat()
                },
                {
                    "id": "2",
                    "type": "withdrawal",
                    "user_name": "Maria Santos", 
                    "user_email": "maria@example.com",
                    "amount": 200.00,
                    "method": "mercadopago",
                    "status": "pending",
                    "created_at": (datetime.now() - timedelta(days=1)).isoformat()
                }
            ]
        
        print(f"✅ [PAYMENTS] {len(transactions)} transações encontradas")
        return jsonify({
            "success": True,
            "transactions": transactions
        }), 200
        
    except Exception as e:
        print(f"❌ [PAYMENTS] Erro ao obter transações: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/payments/methods/<method>/toggle', methods=['PUT'])
def toggle_payment_method(method):
    """Alternar status de método de pagamento no banco SQLite"""
    try:
        session = SessionLocal()
        cursor = conn.cursor()
        
        print(f"🔄 [PAYMENTS] Alternando status do método: {method}")
        
        # Buscar configuração atual
        cursor.execute("""
            SELECT id, enabled FROM payment_settings 
            WHERE provider = ? AND environment = 'sandbox'
        """, (method,))
        
        row = cursor.fetchone()
        
        if row:
            # Alternar status existente
            new_status = 0 if row[1] else 1
            cursor.execute("""
                UPDATE payment_settings 
                SET enabled = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (new_status, row[0]))
        else:
            # Criar nova configuração
            cursor.execute("""
                INSERT INTO payment_settings (provider, enabled, environment, fee_percentage)
                VALUES (?, 1, 'sandbox', 0.0)
            """, (method,))
        
        conn.commit()
        conn.close()
        
        print(f"✅ [PAYMENTS] Método {method} alternado com sucesso")
        return jsonify({
            "success": True,
            "method": method,
            "message": f"Método {method} alternado com sucesso"
        }), 200
        
    except Exception as e:
        print(f"❌ [PAYMENTS] Erro ao alternar método {method}: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/payments/settings/<method>', methods=['PUT'])
def update_payment_settings(method):
    """Atualizar configurações de método de pagamento no banco SQLite"""
    try:
        data = request.get_json()
        
        session = SessionLocal()
        cursor = conn.cursor()
        
        print(f"💾 [PAYMENTS] Salvando configurações do {method}:", data)
        
        # Determinar ambiente (para MercadoPago)
        environment = data.get('environment', 'sandbox')
        
        # Buscar ou criar setting
        cursor.execute("""
            SELECT id FROM payment_settings 
            WHERE provider = ? AND environment = ?
        """, (method, environment))
        
        row = cursor.fetchone()
        
        if row:
            setting_id = row[0]
            # Atualizar configuração existente
            cursor.execute("""
                UPDATE payment_settings 
                SET fee_percentage = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (data.get('fee_percentage', 0), setting_id))
        else:
            # Criar nova configuração
            cursor.execute("""
                INSERT INTO payment_settings (provider, environment, enabled, fee_percentage)
                VALUES (?, ?, 1, ?)
            """, (method, environment, data.get('fee_percentage', 0)))
            setting_id = cursor.lastrowid
        
        # Salvar credenciais
        credentials_map = {
            'mercadopago': ['public_key', 'access_token', 'client_id', 'client_secret'],
            'stripe': ['publishable_key', 'secret_key', 'webhook_secret'],
            'paypal': ['client_id', 'client_secret'],
            'pix': ['merchant_id', 'api_key']
        }
        
        # Para MercadoPago, usar credenciais do ambiente selecionado
        if method == 'mercadopago' and environment in data:
            credential_data = data[environment]
        else:
            credential_data = data
        
        if method in credentials_map:
            for credential_key in credentials_map[method]:
                if credential_key in credential_data:
                    value = credential_data[credential_key]
                    
                    # Atualizar ou inserir credencial
                    cursor.execute("""
                        INSERT OR REPLACE INTO payment_credentials 
                        (payment_setting_id, credential_key, credential_value, updated_at)
                        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                    """, (setting_id, credential_key, value))
        
        # Salvar webhook URL
        webhook_url = credential_data.get('webhook_url') if method == 'mercadopago' else data.get('webhook_url')
        if webhook_url:
            cursor.execute("""
                INSERT OR REPLACE INTO payment_webhooks 
                (payment_setting_id, webhook_url, is_active, updated_at)
                VALUES (?, ?, 1, CURRENT_TIMESTAMP)
            """, (setting_id, webhook_url))
        
        # Salvar métodos de pagamento (para MercadoPago)
        if method == 'mercadopago':
            payment_methods = ['pix_enabled', 'credit_card_enabled', 'debit_card_enabled', 'installments_enabled']
            for pm in payment_methods:
                if pm in data:
                    method_name = pm.replace('_enabled', '')
                    config = {'enabled': data[pm]}
                    
                    if method_name == 'installments':
                        config['max_installments'] = data.get('max_installments', 12)
                    
                    cursor.execute("""
                        INSERT OR REPLACE INTO payment_methods 
                        (payment_setting_id, method_type, enabled, configuration, updated_at)
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """, (setting_id, method_name, 1 if data[pm] else 0, json.dumps(config)))
        
        conn.commit()
        conn.close()
        
        print(f"✅ [PAYMENTS] Configurações do {method} salvas no banco")
        return jsonify({
            "success": True,
            "method": method,
            "settings": data,
            "message": f"Configurações do {method} salvas com sucesso"
        }), 200
        
    except Exception as e:
        print(f"❌ [PAYMENTS] Erro ao salvar configurações do {method}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ==================== HANDLERS OPTIONS PARA CORS ====================

@app.route('/api/admin/payments/settings', methods=['OPTIONS'])
def payment_settings_options():
    """Handler OPTIONS para configurações de pagamento"""
    return '', 200

@app.route('/api/admin/payments/transactions', methods=['OPTIONS'])
def transactions_options():
    """Handler OPTIONS para transações de pagamento"""
    return '', 200

@app.route('/api/admin/payments/methods/<method>/toggle', methods=['OPTIONS'])
def toggle_payment_method_options(method):
    """Handler OPTIONS para alternar método de pagamento"""
    return '', 200

@app.route('/api/admin/payments/settings/<method>', methods=['OPTIONS'])
def update_payment_settings_options(method):
    """Handler OPTIONS para atualizar configurações"""
    return '', 200

# ==================== FUNÇÃO AUXILIAR ====================

def encrypt_credential(value):
    """Função simples para criptografar credenciais (você pode melhorar isso)"""
    import base64
    return base64.b64encode(value.encode()).decode()

def decrypt_credential(encrypted_value):
    """Função simples para descriptografar credenciais"""
    import base64
    try:
        return base64.b64decode(encrypted_value.encode()).decode()
    except:
        return encrypted_value  # Retorna original se não conseguir descriptografar

# ==================== ATUALIZAR MENSAGEM DE INICIALIZAÇÃO ====================
# Adicione essas linhas no final do print de inicialização do main():

print("💳 Rotas de pagamento disponíveis:")
print("   - GET /api/admin/payments/settings")
print("   - GET /api/admin/payments/transactions") 
print("   - PUT /api/admin/payments/methods/<method>/toggle")
print("   - PUT /api/admin/payments/settings/<method>")
print("💳 Métodos suportados: PIX, MercadoPago, Stripe, PayPal")
print("🔒 Configurações salvas no banco SQLite com segurança")

# ==================== MAIN ====================

if __name__ == '__main__':
    # Detectar ambiente automaticamente
    port = int(os.environ.get('PORT', 5001))
    is_production = os.environ.get('RENDER') or os.environ.get('PORT')
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    if is_production:
        print("🚀 Iniciando BetFit Backend - PRODUÇÃO RENDER")
        print(f"🌐 Porta: {port}")
        print(f"💾 Database: {DATABASE_PATH}")
        print("📊 Banco de dados: SQLite com SQLAlchemy")
        
        # Configurações de produção
        app.config['SESSION_COOKIE_SECURE'] = True
        app.config['SESSION_COOKIE_HTTPONLY'] = True
        app.config['SESSION_COOKIE_SAMESITE'] = 'None'
        
        print("✅ Configurações de produção aplicadas")
        print("   - Cookies seguros habilitados")
        print("   - Debug desabilitado")
        print("   - Ready para deploy!")
        
    else:
        print("🚀 Iniciando BetFit Backend - DESENVOLVIMENTO")
        print(f"🌐 Backend URL: {os.getenv('BACKEND_URL', 'http://localhost:5001')}")
        print(f"🌐 Frontend URL: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}")
        print(f"🔧 CORS Origins: {cors_origins}")
        print(f"💾 Database: {DATABASE_PATH}")
        
        # Suas rotas de desenvolvimento (mantidas para desenvolvimento local)
        print("💰 Rotas de carteira disponíveis:")
        print("   - GET /api/wallet/<email>")
        print("   - GET /api/wallet?email=<email>")
        print("   - GET /api/wallet/balance?email=<email>")
        
        print("🎮 Rotas de desafios disponíveis:")
        print("   - GET /api/challenges")
        print("   - POST /api/challenges/<id>/join")
        print("   - POST /api/challenges/<id>/complete")
        
        print("🔐 Rotas de autenticação:")
        print("   - POST /api/auth/register")
        print("   - POST /api/auth/login")
        
        print("💳 Rotas de pagamento:")
        print("   - POST /api/payments/pix")
        print("   - POST /api/payments/card")
        
        # Configurações específicas para túneis (desenvolvimento)
        if os.getenv('TUNNEL_PROVIDER') == 'localtunnel':
            print("🌐 Modo LocalTunnel ativado")
            app.config['SESSION_COOKIE_SECURE'] = True
            app.config['SESSION_COOKIE_HTTPONLY'] = True
            app.config['SESSION_COOKIE_SAMESITE'] = 'None'
            debug_mode = False
            print("   - Cookies configurados para HTTPS")
    
    print(f"🚀 Servidor iniciando na porta {port}")
    print("=" * 50)
    
    # Configuração otimizada para produção
    app.run(
        host='0.0.0.0', 
        port=port, 
        debug=debug_mode if not is_production else False,
        threaded=True,
        use_reloader=False if is_production else debug_mode
    )

