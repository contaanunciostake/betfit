# ==================== NOVOS ENDPOINTS - COPIAR PARA main.py ====================
# Adicionar estes endpoints ao arquivo main.py após os endpoints existentes

# ==================== ENDPOINTS DE PERFIL ====================

@app.route('/api/user/profile', methods=['PUT'])
def update_user_profile():
    """Atualizar perfil do usuário"""
    session = SessionLocal()
    try:
        data = request.get_json()
        user_email = data.get('user_email')

        if not user_email:
            return jsonify({'error': 'user_email é obrigatório'}), 400

        # Buscar usuário
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        # Atualizar campos permitidos
        if 'name' in data:
            user.name = data['name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'bio' in data:
            user.bio = data['bio']
        if 'location' in data:
            user.location = data['location']
        if 'birthdate' in data and data['birthdate']:
            user.birthdate = datetime.datetime.fromisoformat(data['birthdate'])
        if 'theme_preference' in data:
            user.theme_preference = data['theme_preference']
        if 'pix_key' in data:
            user.pix_key = data['pix_key']

        user.updated_at = datetime.datetime.utcnow()
        session.commit()

        print(f"[OK] [PROFILE] Perfil atualizado para {user_email}")

        return jsonify({
            'success': True,
            'message': 'Perfil atualizado com sucesso',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        session.rollback()
        print(f"[ERROR] [PROFILE] Erro ao atualizar perfil: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@app.route('/api/user/upload-avatar', methods=['POST'])
def upload_avatar():
    """Upload de foto de perfil"""
    session = SessionLocal()
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400

        file = request.files['file']
        user_email = request.form.get('user_email')

        if not user_email:
            return jsonify({'error': 'user_email é obrigatório'}), 400

        if file.filename == '':
            return jsonify({'error': 'Arquivo vazio'}), 400

        # Validar extensão
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif'}
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        if ext not in allowed_extensions:
            return jsonify({'error': 'Formato não permitido. Use: jpg, jpeg, png, gif'}), 400

        # Validar tamanho (max 5MB)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > 5242880:  # 5MB
            return jsonify({'error': 'Arquivo muito grande. Máximo: 5MB'}), 400

        # Buscar usuário
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        # Gerar nome único
        filename = f"{user.id}_{secrets.token_hex(8)}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'avatars', filename)

        # Criar diretório se não existir
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        # Salvar arquivo
        file.save(filepath)

        # Atualizar URL no banco
        avatar_url = f"/uploads/avatars/{filename}"
        user.profile_picture = avatar_url
        user.updated_at = datetime.datetime.utcnow()
        session.commit()

        print(f"[OK] [AVATAR] Foto salva para {user_email}: {avatar_url}")

        return jsonify({
            'success': True,
            'message': 'Avatar atualizado com sucesso',
            'avatar_url': avatar_url
        }), 200

    except Exception as e:
        session.rollback()
        print(f"[ERROR] [AVATAR] Erro ao fazer upload: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


# ==================== ENDPOINTS DE DEPÓSITO ====================

@app.route('/api/wallet/deposit/pix', methods=['POST'])
def deposit_pix():
    """Criar depósito via PIX"""
    session = SessionLocal()
    try:
        data = request.get_json()
        user_email = data.get('user_email')
        amount = float(data.get('amount', 0))

        if not user_email or amount <= 0:
            return jsonify({'error': 'user_email e amount são obrigatórios'}), 400

        if amount < 10:
            return jsonify({'error': 'Valor mínimo para depósito: R$10'}), 400

        # Buscar usuário
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        # Buscar carteira
        wallet = session.query(Wallet).filter_by(user_id=user.id).first()
        if not wallet:
            # Criar carteira se não existir
            wallet = Wallet(user_id=user.id, balance=0.0)
            session.add(wallet)
            session.commit()

        # Criar pagamento no MercadoPago
        sdk_mp = mercadopago.SDK(ACCESS_TOKEN)

        payment_data = {
            "transaction_amount": amount,
            "description": f"Depósito BetFit - {user.name}",
            "payment_method_id": "pix",
            "payer": {
                "email": user_email,
                "first_name": user.name.split()[0] if user.name else "Usuário",
                "last_name": user.name.split()[-1] if user.name and len(user.name.split()) > 1 else "BetFit"
            }
        }

        payment_response = sdk_mp.payment().create(payment_data)
        payment = payment_response["response"]

        if payment_response["status"] != 201:
            return jsonify({'error': 'Erro ao criar pagamento no MercadoPago'}), 500

        # Criar transação no banco
        transaction = Transaction(
            user_id=user.id,
            wallet_id=wallet.id,
            type='deposit',
            amount=amount,
            status='pending',
            description=f'Depósito PIX - Aguardando pagamento',
            payment_method='pix',
            payment_id=str(payment['id'])
        )
        session.add(transaction)
        session.commit()

        # Extrair QR Code
        qr_code = payment['point_of_interaction']['transaction_data']['qr_code']
        qr_code_base64 = payment['point_of_interaction']['transaction_data']['qr_code_base64']

        print(f"[OK] [DEPOSIT] PIX gerado para {user_email}: R${amount} - ID: {payment['id']}")

        return jsonify({
            'success': True,
            'message': 'QR Code gerado com sucesso',
            'payment_id': payment['id'],
            'transaction_id': transaction.id,
            'amount': amount,
            'qr_code': qr_code,
            'qr_code_base64': qr_code_base64,
            'expires_at': payment['date_of_expiration']
        }), 200

    except Exception as e:
        session.rollback()
        print(f"[ERROR] [DEPOSIT] Erro ao criar depósito PIX: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@app.route('/api/wallet/deposit/credit-card', methods=['POST'])
def deposit_credit_card():
    """Depósito via cartão de crédito"""
    session = SessionLocal()
    try:
        data = request.get_json()
        user_email = data.get('user_email')
        amount = float(data.get('amount', 0))
        card_data = data.get('card_data', {})

        if not user_email or amount <= 0:
            return jsonify({'error': 'user_email e amount são obrigatórios'}), 400

        if amount < 10:
            return jsonify({'error': 'Valor mínimo para depósito: R$10'}), 400

        # Buscar usuário e carteira
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        wallet = session.query(Wallet).filter_by(user_id=user.id).first()
        if not wallet:
            wallet = Wallet(user_id=user.id, balance=0.0)
            session.add(wallet)
            session.commit()

        # Processar pagamento via MercadoPago
        sdk_mp = mercadopago.SDK(ACCESS_TOKEN)

        payment_data = {
            "transaction_amount": amount,
            "token": card_data.get('token'),  # Token gerado pelo Checkout Pro
            "description": f"Depósito BetFit - {user.name}",
            "installments": 1,
            "payment_method_id": card_data.get('payment_method_id', 'visa'),
            "payer": {
                "email": user_email
            }
        }

        payment_response = sdk_mp.payment().create(payment_data)
        payment = payment_response["response"]

        # Criar transação
        transaction = Transaction(
            user_id=user.id,
            wallet_id=wallet.id,
            type='deposit',
            amount=amount,
            status='pending',
            description=f'Depósito Cartão de Crédito',
            payment_method='credit_card',
            payment_id=str(payment['id'])
        )
        session.add(transaction)

        # Se aprovado imediatamente, creditar
        if payment['status'] == 'approved':
            wallet.balance += amount
            user.total_deposited += amount
            transaction.status = 'completed'
            print(f"[OK] [DEPOSIT] Cartão aprovado: R${amount} creditado para {user_email}")

        session.commit()

        return jsonify({
            'success': True,
            'message': 'Pagamento processado',
            'payment_id': payment['id'],
            'status': payment['status'],
            'status_detail': payment.get('status_detail', ''),
            'amount': amount
        }), 200

    except Exception as e:
        session.rollback()
        print(f"[ERROR] [DEPOSIT] Erro ao processar cartão: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


# ==================== ENDPOINTS DE SAQUE ====================

@app.route('/api/wallet/withdraw/pix', methods=['POST'])
def withdraw_pix():
    """Saque via PIX"""
    session = SessionLocal()
    try:
        data = request.get_json()
        user_email = data.get('user_email')
        amount = float(data.get('amount', 0))
        pix_key = data.get('pix_key')

        if not all([user_email, amount, pix_key]):
            return jsonify({'error': 'user_email, amount e pix_key são obrigatórios'}), 400

        if amount < float(os.getenv('WITHDRAWAL_MIN_AMOUNT', 20)):
            return jsonify({'error': f'Valor mínimo para saque: R${os.getenv("WITHDRAWAL_MIN_AMOUNT", 20)}'}), 400

        # Buscar usuário e carteira
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        wallet = session.query(Wallet).filter_by(user_id=user.id).first()
        if not wallet:
            return jsonify({'error': 'Carteira não encontrada'}), 404

        # Calcular taxa
        fee_percent = float(os.getenv('WITHDRAWAL_FEE_PERCENT', 2)) / 100
        fee_amount = max(amount * fee_percent, 5.0)  # Mínimo R$5
        total_amount = amount + fee_amount

        # Validar saldo
        if wallet.balance < total_amount:
            return jsonify({
                'error': 'Saldo insuficiente',
                'balance': wallet.balance,
                'required': total_amount,
                'fee': fee_amount
            }), 400

        # Descontar do saldo
        wallet.balance -= total_amount
        user.total_withdrawn += amount

        # Criar transação
        transaction = Transaction(
            user_id=user.id,
            wallet_id=wallet.id,
            type='withdrawal',
            amount=amount,
            fee=fee_amount,
            status='processing',
            description=f'Saque PIX - Chave: {pix_key[:10]}...',
            payment_method='pix',
            pix_key=pix_key
        )
        session.add(transaction)
        session.commit()

        # Auto-aprovar se menor que limite
        auto_approve_limit = float(os.getenv('WITHDRAWAL_AUTO_APPROVE_LIMIT', 1000))
        if amount < auto_approve_limit:
            transaction.status = 'completed'
            session.commit()
            print(f"[OK] [WITHDRAW] Auto-aprovado: R${amount} para {pix_key}")
        else:
            print(f"[INFO] [WITHDRAW] Aguardando aprovação manual: R${amount}")

        return jsonify({
            'success': True,
            'message': 'Saque solicitado com sucesso',
            'transaction_id': transaction.id,
            'amount': amount,
            'fee': fee_amount,
            'total': total_amount,
            'status': transaction.status,
            'estimated_time': '1-2 dias úteis' if amount >= auto_approve_limit else 'Imediato'
        }), 200

    except Exception as e:
        session.rollback()
        print(f"[ERROR] [WITHDRAW] Erro ao processar saque: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@app.route('/api/wallet/withdraw/history', methods=['GET'])
def withdraw_history():
    """Histórico de saques"""
    session = SessionLocal()
    try:
        user_email = request.args.get('user_email')

        if not user_email:
            return jsonify({'error': 'user_email é obrigatório'}), 400

        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        # Buscar transações de saque
        withdrawals = session.query(Transaction).filter_by(
            user_id=user.id,
            type='withdrawal'
        ).order_by(Transaction.created_at.desc()).limit(50).all()

        withdrawals_data = []
        for w in withdrawals:
            withdrawals_data.append({
                'id': w.id,
                'amount': w.amount,
                'fee': w.fee,
                'status': w.status,
                'pix_key': w.pix_key,
                'created_at': w.created_at.isoformat() if w.created_at else None,
                'description': w.description
            })

        return jsonify({
            'success': True,
            'withdrawals': withdrawals_data,
            'total': len(withdrawals_data)
        }), 200

    except Exception as e:
        print(f"[ERROR] [WITHDRAW] Erro ao buscar histórico: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


print("[OK] Novos endpoints carregados: Perfil, Depósito e Saque")
