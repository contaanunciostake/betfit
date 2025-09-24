import sqlite3
import json
import logging
from typing import Any, Dict, Optional, Union
from datetime import datetime

class SystemSettings:
    def __init__(self, db_path: str = 'betfit.db'):
        self.db_path = db_path
        self._cache = {}
        
        # Configurar logging
        logging.basicConfig(level=logging.INFO)
        
    def _get_connection(self):
        """Criar conexão com o banco de dados"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def get(self, section: str, key: str, default: Any = None) -> Any:
        """Buscar uma configuração específica"""
        cache_key = f"{section}.{key}"
        
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    "SELECT setting_value, data_type FROM system_settings WHERE section = ? AND setting_key = ?",
                    (section, key)
                )
                result = cursor.fetchone()
                
                if not result:
                    logging.warning(f"Configuração {section}.{key} não encontrada, usando valor padrão: {default}")
                    return default
                
                value = self._convert_value(result['setting_value'], result['data_type'])
                self._cache[cache_key] = value
                
                return value
                
        except Exception as e:
            logging.error(f"Erro ao buscar configuração {section}.{key}: {str(e)}")
            return default
    
    def get_section(self, section: str) -> Dict[str, Any]:
        """Buscar todas as configurações de uma seção"""
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    "SELECT setting_key, setting_value, data_type FROM system_settings WHERE section = ?",
                    (section,)
                )
                results = cursor.fetchall()
                
                settings = {}
                for row in results:
                    settings[row['setting_key']] = self._convert_value(
                        row['setting_value'], 
                        row['data_type']
                    )
                
                return settings
                
        except Exception as e:
            logging.error(f"Erro ao buscar configurações da seção {section}: {str(e)}")
            return {}
    
    def get_all(self) -> Dict[str, Dict[str, Any]]:
        """Buscar todas as configurações organizadas por seção"""
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    "SELECT section, setting_key, setting_value, data_type FROM system_settings ORDER BY section, setting_key"
                )
                results = cursor.fetchall()
                
                settings = {}
                for row in results:
                    section = row['section']
                    if section not in settings:
                        settings[section] = {}
                    
                    settings[section][row['setting_key']] = self._convert_value(
                        row['setting_value'], 
                        row['data_type']
                    )
                
                return settings
                
        except Exception as e:
            logging.error(f"Erro ao buscar todas as configurações: {str(e)}")
            return {}
    
    def update_section(self, section: str, data: Dict[str, Any]) -> int:
        """Atualizar múltiplas configurações de uma seção"""
        try:
            with self._get_connection() as conn:
                updated_count = 0
                
                for key, value in data.items():
                    # Converter valor para string
                    if isinstance(value, bool):
                        string_value = 'true' if value else 'false'
                    elif isinstance(value, (dict, list)):
                        string_value = json.dumps(value)
                    else:
                        string_value = str(value)
                    
                    cursor = conn.execute(
                        "UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE section = ? AND setting_key = ?",
                        (string_value, section, key)
                    )
                    
                    if cursor.rowcount > 0:
                        updated_count += 1
                        # Limpar cache
                        cache_key = f"{section}.{key}"
                        if cache_key in self._cache:
                            del self._cache[cache_key]
                        
                        logging.info(f"Configuração {section}.{key} atualizada para: {value}")
                    else:
                        logging.warning(f"Configuração {section}.{key} não foi encontrada para atualização")
                
                conn.commit()
                logging.info(f"Seção {section} atualizada com sucesso. {updated_count} configurações modificadas.")
                return updated_count
                
        except Exception as e:
            logging.error(f"Erro ao atualizar seção {section}: {str(e)}")
            raise e
    
    def update_single(self, section: str, key: str, value: Any) -> bool:
        """Atualizar uma configuração específica"""
        try:
            result = self.update_section(section, {key: value})
            return result > 0
        except Exception as e:
            logging.error(f"Erro ao atualizar {section}.{key}: {str(e)}")
            return False
    
    def _convert_value(self, value: str, data_type: str) -> Any:
        """Converter valor string para o tipo correto"""
        try:
            if data_type == 'boolean':
                return value.lower() == 'true'
            elif data_type == 'number':
                if '.' in value:
                    return float(value)
                else:
                    return int(value)
            elif data_type == 'json':
                return json.loads(value)
            else:  # string
                return value
        except Exception as e:
            logging.error(f"Erro ao converter valor '{value}' do tipo '{data_type}': {str(e)}")
            return value
    
    def clear_cache(self):
        """Limpar todo o cache"""
        self._cache.clear()
        logging.info("Cache de configurações limpo")
    
    def clear_cache_section(self, section: str):
        """Limpar cache de uma seção específica"""
        keys_to_remove = [key for key in self._cache.keys() if key.startswith(f"{section}.")]
        for key in keys_to_remove:
            del self._cache[key]
        logging.info(f"Cache da seção {section} limpo")
    
    def create_default_settings(self):
        """Criar configurações padrão se não existirem (útil para inicialização)"""
        default_settings = {
            'platform': {
                'platform_fee': ('10.0', 'number'),
                'min_bet_amount': ('5.0', 'number'),
                'max_bet_amount': ('1000.0', 'number'),
                'max_participants': ('100', 'number'),
                'challenge_duration_days': ('30', 'number'),
            },
            'general': {
                'site_name': ('BetFit', 'string'),
                'maintenance_mode': ('false', 'boolean'),
                'allow_registrations': ('true', 'boolean'),
            },
            'security': {
                'max_login_attempts': ('5', 'number'),
                'session_timeout_minutes': ('60', 'number'),
                'require_email_verification': ('true', 'boolean'),
            },
            'notifications': {
                'email_enabled': ('true', 'boolean'),
                'sms_enabled': ('false', 'boolean'),
                'push_enabled': ('true', 'boolean'),
            }
        }
        
        try:
            with self._get_connection() as conn:
                for section, settings in default_settings.items():
                    for key, (value, data_type) in settings.items():
                        # Verificar se já existe
                        cursor = conn.execute(
                            "SELECT 1 FROM system_settings WHERE section = ? AND setting_key = ?",
                            (section, key)
                        )
                        
                        if not cursor.fetchone():
                            # Inserir configuração padrão
                            conn.execute(
                                """INSERT INTO system_settings 
                                   (section, setting_key, setting_value, data_type, description, created_at, updated_at)
                                   VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)""",
                                (section, key, value, data_type, f'Configuração padrão para {key}')
                            )
                            logging.info(f"Configuração padrão criada: {section}.{key} = {value}")
                
                conn.commit()
                logging.info("Configurações padrão inicializadas com sucesso")
                
        except Exception as e:
            logging.error(f"Erro ao criar configurações padrão: {str(e)}")
            raise e