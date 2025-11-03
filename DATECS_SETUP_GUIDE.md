# Datecs/BORICA Payment Gateway - Setup Guide

## Ръководство за настройка на Datecs/BORICA платежен шлюз

Това ръководство обяснява стъпка по стъпка как да настроите Pizza Stop за работа с Datecs/BORICA платежния шлюз за онлайн плащания с карти.

---

## 📋 Съдържание

1. [Предварителни изисквания](#предварителни-изисквания)
2. [Генериране на криптографски ключове](#генериране-на-криптографски-ключове)
3. [Получаване на credentials от банката](#получаване-на-credentials-от-банката)
4. [Конфигурация на environment variables](#конфигурация-на-environment-variables)
5. [Тестване на интеграцията](#тестване-на-интеграцията)
6. [Production deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 1. Предварителни изисквания

### Технически изисквания

- OpenSSL инсталиран на системата
- Node.js 18+ (за Next.js проект)
- Достъп до файловата система за съхранение на ключове
- SSL сертификат за production domain

### Бизнес изисквания

- Договор с банка (Acquiring Institution) за приемане на картови плащания
- Регистрация като Virtual Merchant в BORICA
- Получен Terminal ID (TID) и Merchant ID (MID) от банката

---

## 2. Генериране на криптографски ключове

### Стъпка 1: Генериране на Private Key (RSA 2048 bits)

#### За TEST environment:

```bash
openssl genrsa -out privatekeyname_T.key -aes256 2048
```

#### За PRODUCTION environment:

```bash
openssl genrsa -out privatekeyname_P.key -aes256 2048
```

**Важно:**
- Използвайте **силна парола** за криптиране на ключа
- **Съхранявайте ключа на сигурно място** (никога не го споделяйте)
- **Не изпращайте ключа по email**
- Правете backup на ключа

### Стъпка 2: Генериране на Certificate Request (.csr)

#### За TEST environment:

```bash
openssl req -new -key privatekeyname_T.key -out VNNNNNNN_YYYYMMDD_T.csr
```

#### За PRODUCTION environment:

```bash
openssl req -new -key privatekeyname_P.key -out VNNNNNNN_YYYYMMDD_P.csr
```

Замести:
- `VNNNNNNN` с вашия Terminal ID (напр. V1800001)
- `YYYYMMDD` с текуща дата (напр. 20241101)
- `T` или `P` за Test или Production

### Стъпка 3: Попълване на Certificate Information

Когато генерирате CSR, ще бъдете помолени да въведете следната информация:

```
Country Name (C): BG
State or Province Name (ST): Sofia
Locality Name (L): Sofia
Organization Name (O): Pizza Stop Ltd
Organizational Unit Name (OU): V1800001  (вашия Terminal ID)
Common Name (CN): pizza-stop.bg  (вашия domain, БЕЗ https://)
Email Address: admin@pizza-stop.bg
```

**Важно:**
- Използвайте само **латински букви** (без специални символи)
- Common Name (CN) трябва да е **вашия domain БЕЗ https://**
- Organization Unit (OU) трябва да е **вашия Terminal ID**

### Стъпка 4: Архивиране на CSR файла

```bash
zip VNNNNNNN_YYYYMMDD_T.zip VNNNNNNN_YYYYMMDD_T.csr
```

---

## 3. Получаване на credentials от банката

### Стъпка 1: Изпращане на CSR към BORICA

1. **Логнете се в Merchant Portal:**
   - TEST: https://3dsgate-dev.borica.bg/mwp_cert
   - PRODUCTION: https://3dsgate.borica.bg/mwp/static/

2. **Upload на CSR файл:**
   - Отворете секция "Certificate Management"
   - Upload-нете `.zip` файла с вашия CSR
   - Изчакайте одобрение от BORICA (обикновено 1-2 работни дни)

3. **Download на Certificate:**
   - След одобрение, download-нете сертификата (`.cer` файл)
   - Име на файла: `VNNNNNNN_YYYYMMDD_T.cer` (или `_P.cer`)

### Стъпка 2: Download на BORICA Public Key

Download-нете публичния ключ на BORICA за верификация на отговори:

- TEST: https://3dsgate-dev.borica.bg/ (секция "Public Keys")
- PRODUCTION: https://3dsgate.borica.bg/ (секция "Public Keys")

Файлове:
- `MPI_OW_APGW_B-Trust_pubkey.pem` (публичен ключ)
- `MPI_OW_APGW_B-Trust.cer` (сертификат)

### Стъпка 3: Получаване на Terminal ID и Merchant ID

Свържете се с вашата банка (Acquiring Institution) за:

- **Terminal ID (TID)**: 8 символа, например `V1800001`
- **Merchant ID (MID)**: 10 символа, например `1600000001`
- **BACKREF URL approval**: банката трябва да одобри вашия callback URL

**Важно:**
- TID може да е **различен** за TEST и PRODUCTION
- Уведомете банката за вашия BACKREF URL:
  - TEST: `https://your-test-domain.com/api/payment/callback`
  - PRODUCTION: `https://pizza-stop.bg/api/payment/callback`

---

## 4. Конфигурация на environment variables

### Стъпка 1: Създайте `.env.local` файл

```bash
# ============================================
# DATECS / BORICA PAYMENT GATEWAY
# ============================================

# Terminal and Merchant IDs (получени от банката)
DATECS_TERMINAL_ID=V1800001
DATECS_MERCHANT_ID=1600000001

# Merchant Information
DATECS_MERCHANT_NAME="Pizza Stop"
DATECS_MERCHANT_URL=https://pizza-stop.bg

# Gateway URLs
# TEST:
DATECS_GATEWAY_URL=https://3dsgate-dev.borica.bg/cgi-bin/cgi_link
# PRODUCTION:
# DATECS_GATEWAY_URL=https://3dsgate.borica.bg/cgi-bin/cgi_link

# Callback URL (където BORICA изпраща резултата)
DATECS_BACKREF_URL=https://pizza-stop.bg/api/payment/callback

# Location and Currency
DATECS_COUNTRY=BG
DATECS_TIMEZONE=+03
DATECS_CURRENCY=BGN
DATECS_LANG=BG

# Cryptographic Keys
# Path to your private key
DATECS_PRIVATE_KEY_PATH=/path/to/keys/privatekeyname_T.key
# Password for private key (if encrypted)
DATECS_PRIVATE_KEY_PASSWORD=your_strong_password_here

# Path to BORICA's public key (for response verification)
DATECS_BORICA_PUBLIC_KEY_PATH=/path/to/keys/MPI_OW_APGW_B-Trust_pubkey.pem
```

### Стъпка 2: Съхранете ключовете сигурно

#### Препоръчителна структура на директории:

```
/opt/pizza-stop/keys/
├── test/
│   ├── privatekeyname_T.key         (NEVER commit to git!)
│   ├── VNNNNNNN_YYYYMMDD_T.cer
│   └── MPI_OW_APGW_B-Trust_pubkey_test.pem
└── production/
    ├── privatekeyname_P.key         (NEVER commit to git!)
    ├── VNNNNNNN_YYYYMMDD_P.cer
    └── MPI_OW_APGW_B-Trust_pubkey_prod.pem
```

#### Настройка на правата за достъп (Linux/macOS):

```bash
# Създайте директорията за ключове
sudo mkdir -p /opt/pizza-stop/keys/test
sudo mkdir -p /opt/pizza-stop/keys/production

# Копирайте ключовете
sudo cp privatekeyname_T.key /opt/pizza-stop/keys/test/
sudo cp MPI_OW_APGW_B-Trust_pubkey.pem /opt/pizza-stop/keys/test/

# Настройте правата (само owner може да чете)
sudo chmod 400 /opt/pizza-stop/keys/test/privatekeyname_T.key
sudo chown www-data:www-data /opt/pizza-stop/keys/test/*

# Проверете правата
ls -la /opt/pizza-stop/keys/test/
```

### Стъпка 3: Добавете `.env.local` в `.gitignore`

```bash
# .gitignore
.env.local
.env
*.key
*.pem
*.cer
```

**⚠️ НИКОГА НЕ COMMIT-ВАЙТЕ PRIVATE KEYS В GIT!**

---

## 5. Тестване на интеграцията

### Стъпка 1: Проверка на environment variables

```bash
# Стартирайте Next.js в development mode
npm run dev

# Проверете дали променливите се зареждат правилно
# Отворете браузър: http://localhost:3000/api/health
```

### Стъпка 2: Използване на тестови карти

Според Datecs документацията (Раздел 7.6), използвайте следните тестови карти:

| Тип карта | PAN (Номер на карта) |
|-----------|----------------------|
| VISA      | 4341792000000044     |
| Mastercard| 5100789999999895     |

**Тестови данни:**
- **Expiry Date**: Произволна бъдеща дата (формат: MMYY, например 12/25)
- **CVV/CVC**: Произволни 3 цифри (например 123)
- **OTP** (ако се изисква): 111111

**Тестови суми:**
- Сума, завършваща на `.65` (например 10.65) → Връща RC 65/1A (Soft Decline)
- Сума `1234.56` с VISA → Връща CARDHOLDERINFO в отговора

### Стъпка 3: Тестов сценарий

1. **Създайте тестова поръчка:**
   ```
   - Отворете http://localhost:3000
   - Добавете продукти в количката
   - Изберете "Онлайн плащане"
   - Попълнете данните и потвърдете
   ```

2. **Проверете redirect към BORICA:**
   ```
   - Трябва автоматично да ви redirect-не към 3dsgate-dev.borica.bg
   - Виждате формата за картови данни
   ```

3. **Въведете тестова карта:**
   ```
   - PAN: 4341792000000044
   - Expiry: 12/25
   - CVV: 123
   - OTP: 111111
   ```

4. **Проверете резултата:**
   ```
   - След успешно плащане → redirect към /order-success
   - При неуспешно плащане → redirect към /payment-error
   ```

### Стъпка 4: Проверка в Merchant Portal

Логнете се в TEST Merchant Portal:
- URL: https://3dsgate-dev.borica.bg/mwp_cert

Секции:
- **Authentications**: Всички операции с POST request към APGW
- **Transactions**: Всички успешни транзакции
- **Pending**: Транзакции в очакване
- **Rejected**: Отказани транзакции

---

## 6. Production Deployment

### Checklist за Production:

- [ ] **Генерирани Production ключове** (privatekeyname_P.key)
- [ ] **Upload-нат Production CSR** в BORICA Production Portal
- [ ] **Download-нат Production Certificate**
- [ ] **Download-нат BORICA Production Public Key**
- [ ] **Получен Production Terminal ID** от банката
- [ ] **Production BACKREF URL одобрен** от банката
- [ ] **Environment variables обновени** за production
- [ ] **SSL сертификат инсталиран** на production domain
- [ ] **Private keys съхранени сигурно** на production server
- [ ] **File permissions настроени правилно** (chmod 400)
- [ ] **Тествано с малка сума** (например 0.01 лв)
- [ ] **Monitoring и logging активирани**

### Production Environment Variables:

```bash
# Production Gateway
DATECS_GATEWAY_URL=https://3dsgate.borica.bg/cgi-bin/cgi_link

# Production Callback
DATECS_BACKREF_URL=https://pizza-stop.bg/api/payment/callback

# Production Keys
DATECS_PRIVATE_KEY_PATH=/opt/pizza-stop/keys/production/privatekeyname_P.key
DATECS_BORICA_PUBLIC_KEY_PATH=/opt/pizza-stop/keys/production/MPI_OW_APGW_B-Trust_pubkey_prod.pem

# Production Terminal (get from bank)
DATECS_TERMINAL_ID=VXXXXXXX
DATECS_MERCHANT_ID=XXXXXXXXXX
```

### Deployment на Vercel/Netlify:

Ако deploy-вате на cloud платформа, ключовете **НЕ МОГАТ** да бъдат файлове.

**Решение 1**: Използвайте environment variables за съдържанието на ключовете

```bash
# Вместо path, използвайте съдържанието
DATECS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgk...\n-----END PRIVATE KEY-----"
DATECS_BORICA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhki...\n-----END PUBLIC KEY-----"
```

**Решение 2**: Използвайте Secrets Manager (AWS Secrets Manager, GCP Secret Manager)

---

## 7. Troubleshooting

### Грешка: "Invalid signature" (RC -17)

**Причини:**
- Грешен private key
- Грешна signing string (order на полета)
- Грешен signing algorithm
- TIMESTAMP по-стар от 15 минути

**Решение:**
```bash
# Проверете съответствието key/certificate:
openssl rsa -noout -modulus -in privatekeyname_T.key | openssl md5
openssl x509 -noout -modulus -in VNNNNNNN_YYYYMMDD_T.cer | openssl md5
# Двата MD5 трябва да са еднакви!
```

### Грешка: "Transaction expired" (RC -20)

**Причина:**
- TIMESTAMP е повече от 15 минути различен от APGW server time

**Решение:**
- Уверете се, че използвате UTC време
- Синхронизирайте системното време на сървъра

```bash
# Linux
sudo ntpdate -s time.nist.gov

# Проверете UTC времето
date -u
```

### Грешка: "No response received"

**Причини:**
- Грешен BACKREF URL
- BACKREF URL не е одобрен от банката
- Firewall блокира BORICA requests

**Решение:**
- Проверете BACKREF URL в конфигурацията
- Уверете се, че банката е одобрила URL-а
- Whitelist-нете BORICA IP адреси

### Грешка: "Authentication failed" (RC -19)

**Причини:**
- Картата не е регистрирана за 3D Secure
- Грешен OTP код
- Expired/неактивна парола за онлайн плащания

**Решение:**
- В TEST environment: Използвайте тестовите карти от документацията
- В PRODUCTION: Клиентът трябва да регистрира картата за 3D Secure

### Logging и Debugging

```typescript
// Включете детайлно логване във вашия код
console.log('🔐 Signing request:')
console.log('   Signing string:', signingString)
console.log('   P_SIGN:', pSign.substring(0, 64) + '...')
```

Проверете логовете:
```bash
# Next.js logs
npm run dev

# Production logs
pm2 logs pizza-stop
```

---

## 📚 Полезни линкове

- **BORICA TEST Portal**: https://3dsgate-dev.borica.bg/mwp_cert
- **BORICA PROD Portal**: https://3dsgate.borica.bg/mwp/static/
- **Документация**: Datecs_pay_documentation_En.md
- **Public Keys**: https://3dsgate-dev.borica.bg/ (Downloads section)

---

## 🔒 Сигурност

**ВАЖНО:**
1. ✅ НИКОГА не commit-вайте private keys в Git
2. ✅ Използвайте силни пароли за криптиране на ключовете
3. ✅ Съхранявайте ключовете с правилни file permissions (chmod 400)
4. ✅ Правете backup на ключовете на сигурно място
5. ✅ Rotate-вайте ключовете периодично (всяка година)
6. ✅ Използвайте SSL/TLS за production domain
7. ✅ Логвайте всички транзакции за audit
8. ✅ Мониторирайте за подозрителни транзакции

---

## 📞 Поддръжка

При проблеми, свържете се с:

1. **BORICA Technical Support**:
   - Email: support@borica.bg
   - Phone: +359 2 8169 311

2. **Вашата банка** (Acquiring Institution)

3. **Pizza Stop Dev Team**:
   - Email: dev@pizza-stop.bg

---

**Последна актуализация**: 1 ноември 2024  
**Версия**: 1.0  
**Базирано на**: Datecs BORICA APGW Documentation v5.0 (P-OM-41-EN)

