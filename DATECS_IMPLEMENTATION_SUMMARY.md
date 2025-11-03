# Datecs/BORICA Payment Gateway - Implementation Summary

## 🎉 Пълна имплементация завършена!

Pizza Stop вече е интегриран с Datecs/BORICA платежен шлюз за онлайн плащания с карти.

---

## 📦 Какво беше създадено

### 1. TypeScript Types (`src/types/datecs.ts`)
✅ Пълни TypeScript дефиниции за:
- `DatecsPaymentRequest` - Request към BORICA
- `DatecsPaymentResponse` - Response от BORICA
- `DatecsMInfo` - Cardholder информация
- `DatecsConfig` - Конфигурация
- Signature fields за всички типове транзакции
- Enums за transaction types, action codes, response codes

### 2. Datecs Service (`src/utils/datecsPayment.ts`)
✅ Пълнофункционален service с:
- **Криптографски функции:**
  - RSA-SHA256 подписване с merchant's private key
  - Signature verification с BORICA's public key
  - MAC_GENERAL scheme implementation
  
- **Data generation:**
  - NONCE генериране (32 hex chars, уникален за 24h)
  - ORDER генериране (6 digits, уникален за 24h)
  - TIMESTAMP генериране (UTC YYYYMMDDHHMMSS)
  - M_INFO encoding (Base64 JSON)
  
- **Payment processing:**
  - HTML form generator за redirect към BORICA
  - Complete payment request generation
  - Response validation
  - Error message translation (Bulgarian)

### 3. Payment Initiate Endpoint (`src/app/api/payment/initiate/route.ts`)
✅ Обновен да използва Datecs:
- Създава order в базата данни
- Генерира Datecs payment request
- Подписва request с private key
- Връща HTML form за auto-submit към BORICA
- Изпраща email confirmation

### 4. Payment Callback Endpoint (`src/app/api/payment/callback/route.ts`)
✅ Нов endpoint за обработка на BORICA отговори:
- Получава POST request от BORICA
- Верифицира P_SIGN signature
- Обновява order status в базата данни
- Записва transaction в PaymentTransactions таблица
- Redirect-ва клиента към success/error страница
- Пълно error handling и logging

### 5. Environment Validator (`src/utils/envValidator.ts`)
✅ Обновен да проверява:
- `DATECS_TERMINAL_ID` (required)
- `DATECS_MERCHANT_ID` (required)
- `DATECS_PRIVATE_KEY_PATH` (required)
- `DATECS_BORICA_PUBLIC_KEY_PATH` (required)
- Всички optional Datecs променливи

### 6. Database Migration (`database/migrations/create_payment_transactions_table.sql`)
✅ SQL за PaymentTransactions таблица:
- Записва всички transactions за audit
- Indexes за performance
- Triggers за auto-update timestamps
- Full BORICA response съхранен като JSONB

### 7. Documentation
✅ Три comprehensive documentation файла:
- **DATECS_SETUP_GUIDE.md** - Пълно ръководство за setup (24KB)
  - Генериране на криптографски ключове
  - Получаване на credentials от банката
  - Environment configuration
  - Тестване и troubleshooting
  
- **DATECS_ENV_EXAMPLE.md** - Environment variables пример
  - Всички необходими променливи
  - Тестови карти
  - Production checklist
  
- **DATECS_IMPLEMENTATION_SUMMARY.md** - Този файл
  - Преглед на имплементацията
  - Next steps
  - API flow diagram

---

## 🔄 Payment Flow

```
┌─────────────┐
│   Customer  │
│   Checkout  │
└──────┬──────┘
       │ (1) Submit order with "Online Payment"
       ▼
┌─────────────────────────────────────────┐
│  /api/payment/initiate                  │
│  ├─ Validate order data                 │
│  ├─ Create order in DB                  │
│  ├─ Generate Datecs payment request     │
│  │  ├─ Generate ORDER, NONCE, TIMESTAMP │
│  │  ├─ Encode M_INFO                    │
│  │  └─ Sign with merchant private key   │
│  └─ Return HTML form                    │
└──────┬──────────────────────────────────┘
       │ (2) Auto-submit form
       ▼
┌─────────────────────────────────────────┐
│  BORICA Payment Gateway                 │
│  https://3dsgate.borica.bg              │
│  ├─ Customer enters card details        │
│  ├─ 3D Secure authentication (OTP)      │
│  └─ Process payment                     │
└──────┬──────────────────────────────────┘
       │ (3) POST result
       ▼
┌─────────────────────────────────────────┐
│  /api/payment/callback                  │
│  ├─ Verify BORICA signature             │
│  ├─ Check ACTION and RC codes           │
│  ├─ Update order status                 │
│  ├─ Store transaction record            │
│  └─ Redirect customer                   │
└──────┬──────────────────────────────────┘
       │ (4) Redirect
       ▼
┌─────────────────────┐
│  /order-success or  │
│  /payment-error     │
└─────────────────────┘
```

---

## 🚀 Next Steps (За да пуснете в production)

### Стъпка 1: Получаване на Credentials от банката
- [ ] Договор с банка за приемане на картови плащания
- [ ] Регистрация като Virtual Merchant в BORICA
- [ ] Получен Terminal ID (TID)
- [ ] Получен Merchant ID (MID)

### Стъпка 2: Генериране на Криптографски Ключове
```bash
# TEST environment
openssl genrsa -out privatekeyname_T.key -aes256 2048
openssl req -new -key privatekeyname_T.key -out V1800001_20241101_T.csr

# PRODUCTION environment
openssl genrsa -out privatekeyname_P.key -aes256 2048
openssl req -new -key privatekeyname_P.key -out V1800001_20241101_P.csr
```

### Стъпка 3: Изпращане на CSR към BORICA
- [ ] Upload CSR в BORICA TEST Portal: https://3dsgate-dev.borica.bg/mwp_cert
- [ ] Изчакайте одобрение (1-2 дни)
- [ ] Download certificate (.cer file)
- [ ] Download BORICA public key

### Стъпка 4: Конфигурация
```bash
# Копирайте променливите от DATECS_ENV_EXAMPLE.md
cp DATECS_ENV_EXAMPLE.md .env.local
# Редактирайте .env.local с вашите credentials
nano .env.local
```

### Стъпка 5: Database Migration
```bash
# Изпълнете SQL migration
psql -U postgres -d pizza_stop -f database/migrations/create_payment_transactions_table.sql
```

### Стъпка 6: Тестване
```bash
# Стартирайте dev server
npm run dev

# Тествайте с тестови карти:
# VISA: 4341792000000044
# Expiry: 12/25
# CVV: 123
# OTP: 111111
```

### Стъпка 7: Production Deployment
- [ ] Генерирайте production ключове
- [ ] Upload production CSR
- [ ] Обновете environment variables за production
- [ ] SSL сертификат инсталиран
- [ ] BACKREF URL одобрен от банката
- [ ] File permissions (chmod 400 на private keys)
- [ ] Тествайте с малка сума (0.01 лв)

---

## 📚 Документация

Вижте следните файлове за детайлна информация:

1. **DATECS_SETUP_GUIDE.md** - Пълно ръководство за setup
2. **DATECS_ENV_EXAMPLE.md** - Environment variables
3. **Datecs_pay_documentation_En.md** - Официална BORICA документация

---

## 🔒 Security Notes

**КРИТИЧНО:**
- ✅ НИКОГА не commit-вайте `.env.local` в Git
- ✅ НИКОГА не commit-вайте `.key` files в Git
- ✅ Използвайте силни пароли за private keys
- ✅ Съхранявайте keys с chmod 400
- ✅ Правете backup на keys на сигурно място
- ✅ Rotate-вайте keys периодично (yearly)

Добавете в `.gitignore`:
```
.env.local
.env
*.key
*.pem
*.cer
*.p12
*.pfx
```

---

## 🧪 Testing

### Тестови карти (от Datecs документация):

| Тип | PAN | Expiry | CVV | OTP |
|-----|-----|--------|-----|-----|
| VISA | 4341792000000044 | 12/25 | 123 | 111111 |
| Mastercard | 5100789999999895 | 12/25 | 123 | 111111 |

### Тестови суми:
- Сума завършваща на `.65` (напр. 10.65) → RC 65/1A (Soft Decline)
- Сума `1234.56` с VISA → CARDHOLDERINFO в response

---

## 📞 Support

При проблеми:

1. **BORICA Technical Support**
   - Email: support@borica.bg
   - Phone: +359 2 8169 311

2. **Вашата банка** (Acquiring Institution)

3. **Документация**: Прочетете DATECS_SETUP_GUIDE.md

---

## ✅ Implementation Checklist

- [x] TypeScript types за Datecs
- [x] Datecs payment service с криптографски функции
- [x] Payment initiate endpoint обновен
- [x] Payment callback endpoint създаден
- [x] Environment validator обновен
- [x] Database migration за PaymentTransactions
- [x] HTML form generator
- [x] Signature signing/verification
- [x] Error handling и logging
- [x] Comprehensive documentation

**Всичко е готово за тестване и production deployment!** 🚀

---

**Създадено**: 1 ноември 2024  
**Status**: ✅ COMPLETE  
**Версия**: 1.0  
**Базирано на**: Datecs BORICA APGW Documentation v5.0 (P-OM-41-EN)

