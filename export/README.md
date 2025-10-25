# Export do Banco de Dados - Lovable Cloud

**Data do Export:** 25 de outubro de 2025  
**Database ID:** zmhczrhccztiavddabfi  
**URL do Banco:** https://zmhczrhccztiavddabfi.supabase.co

## 📋 Conteúdo do Export

Este export contém toda a estrutura e dados do seu projeto Lovable Cloud (Supabase).

### Arquivos Incluídos:

1. **database-export.json** - Todos os dados em formato JSON
2. **schema.sql** - Estrutura completa do banco (CREATE TABLE, funções, triggers)
3. **data.sql** - Dados exportados em formato SQL (INSERT statements)
4. **rls-policies.sql** - Políticas de Row Level Security
5. **README.md** - Este arquivo com instruções

## 📊 Estatísticas

### Tabelas e Registros:

| Tabela | Registros |
|--------|-----------|
| profiles | 4 |
| equipment | 1 |
| user_roles | 1 |
| user_permissions | 4 |
| checklist_records | 0 |
| checklist_answers | 0 |
| checklist_photos | 0 |
| checklist_approvals | 0 |
| checklist_rejections | 0 |
| equipment_issues | 0 |

**Total:** 10 tabelas, 10 registros

## 🔧 Como Usar Este Export

### Opção 1: Importar para Novo Projeto Supabase

1. **Crie um novo projeto no Supabase:**
   - Acesse https://supabase.com/dashboard
   - Clique em "New Project"
   - Escolha nome, senha e região

2. **Execute o schema:**
   ```bash
   # No SQL Editor do Supabase, execute:
   # 1. schema.sql (cria tabelas e funções)
   # 2. rls-policies.sql (configura segurança)
   # 3. data.sql (importa dados)
   ```

3. **Configure autenticação:**
   - Vá em Authentication > Settings
   - Habilite "Enable email confirmations" (desabilitar para dev)
   - Configure provedores se necessário

4. **Atualize seu app Lovable:**
   ```typescript
   // Atualize src/integrations/supabase/client.ts com:
   const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co'
   const SUPABASE_ANON_KEY = 'sua_anon_key_aqui'
   ```

### Opção 2: Usar Apenas os Dados (JSON)

Se você precisa apenas dos dados em outro formato:

```javascript
import data from './database-export.json';

// Acessar dados:
const usuarios = data.tables.profiles;
const equipamentos = data.tables.equipment;
```

### Opção 3: Backup Local

Use este export como backup. Para restaurar:

1. Execute `schema.sql` para recriar estrutura
2. Execute `rls-policies.sql` para segurança
3. Execute `data.sql` para restaurar dados

## 🔐 Informações de Conexão Atual

**⚠️ IMPORTANTE:** Seu projeto atual já está usando Supabase através do Lovable Cloud.

- **Project URL:** https://zmhczrhccztiavddabfi.supabase.co
- **Anon Key:** Configurada em `.env`
- **Service Role Key:** Disponível em secrets (não exportada por segurança)

### Para Conectar Aplicação Externa:

```javascript
// Exemplo Node.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zmhczrhccztiavddabfi.supabase.co',
  'SUA_ANON_KEY_AQUI'
);

// Listar equipamentos
const { data, error } = await supabase
  .from('equipment')
  .select('*');
```

```python
# Exemplo Python
from supabase import create_client

supabase = create_client(
    'https://zmhczrhccztiavddabfi.supabase.co',
    'SUA_ANON_KEY_AQUI'
)

# Listar equipamentos
response = supabase.table('equipment').select('*').execute()
```

## 🔒 Segurança (RLS)

Todas as tabelas possuem Row Level Security (RLS) habilitado:

- **profiles:** Admins gerenciam todos, usuários veem apenas o próprio
- **equipment:** Autenticados podem ver/editar, apenas admins deletam
- **checklist_records:** Autenticados podem criar/ver, admins deletam
- **user_roles:** Apenas admins gerenciam
- **user_permissions:** Apenas admins gerenciam

## 📦 Storage Buckets

- **checklist-photos:** Privado, para fotos de checklists
  - Limite: 5MB por arquivo
  - Tipos: image/jpeg, image/png, image/webp

## 🔄 Migrações Disponíveis

Todas as migrações estão em `supabase/migrations/`:
- Estrutura inicial das tabelas
- Funções e triggers
- Políticas RLS
- Storage buckets

## 💡 Dicas

1. **Para desenvolvimento:** Desabilite confirmação de email no Supabase Auth
2. **Para produção:** Habilite RLS em todas as tabelas
3. **Backup regular:** Execute este export periodicamente
4. **Versionamento:** Guarde exports importantes no Git (sem senhas!)

## 📞 Suporte

- Documentação Supabase: https://supabase.com/docs
- Documentação Lovable: https://docs.lovable.dev
- Discord Lovable: https://discord.com/channels/1119885301872070706

## ⚠️ Notas Importantes

1. **Fotos em Base64:** A foto do equipamento está em base64 no JSON
2. **Auth Users:** Tabela `auth.users` não é exportada (gerenciada pelo Supabase)
3. **Secrets:** Chaves sensíveis não estão incluídas neste export
4. **Timestamps:** Todos em formato UTC (ISO 8601)

---

**Gerado automaticamente pelo Lovable Cloud em 25/10/2025**
