# Datecs Payment Gateway - Environment Variables Example

Копирайте тези променливи във вашия `.env.local` файл и попълнете с реални стойности.

```bash
# ============================================
# DATECS / BORICA PAYMENT GATEWAY
# ============================================

# Terminal and Merchant IDs (provided by your bank)
DATECS_TERMINAL_ID=V1800001
DATECS_MERCHANT_ID=1600000001

# Merchant Information
DATECS_MERCHANT_NAME="Pizza Stop"
DATECS_MERCHANT_URL=https://pizza-stop.bg

# Gateway URLs
# TEST environment:
DATECS_GATEWAY_URL=https://3dsgate-dev.borica.bg/cgi-bin/cgi_link
# PRODUCTION environment (uncomment for production):
# DATECS_GATEWAY_URL=https://3dsgate.borica.bg/cgi-bin/cgi_link

# Callback URL (where BORICA sends the payment result)
# Must be approved by your bank!
DATECS_BACKREF_URL=https://pizza-stop.bg/api/payment/callback

# Location and Currency Settings
DATECS_COUNTRY=BG
DATECS_TIMEZONE=+03
DATECS_CURRENCY=BGN
DATECS_LANG=BG

# ============================================
# CRYPTOGRAPHIC KEYS (DATECS/BORICA)
# ============================================
# IMPORTANT: Keep these keys secure and NEVER commit them to git!

# Path to your merchant private key (RSA 2048 bits)
# Generated with: openssl genrsa -out privatekeyname_T.key -aes256 2048
DATECS_PRIVATE_KEY_PATH=/opt/pizza-stop/keys/test/privatekeyname_T.key

# Password for your private key (if encrypted with -aes256)
# Leave empty if key is not password-protected
DATECS_PRIVATE_KEY_PASSWORD=your_strong_password_here

# Path to BORICA's public key (for verifying responses)
# Downloaded from: https://3dsgate-dev.borica.bg/ (Public Keys section)
DATECS_BORICA_PUBLIC_KEY_PATH=/opt/pizza-stop/keys/test/MPI_OW_APGW_B-Trust_pubkey.pem
```

## Тестови карти

За тестване използвайте:

| Тип карта | PAN (Номер) |
|-----------|-------------|
| VISA | 4341792000000044 |
| Mastercard | 5100789999999895 |

**Тестови данни:**
- Expiry: Произволна бъдеща дата (MMYY)
- CVV: Произволни 3 цифри (например 123)
- OTP: 111111

## Production Checklist

- [ ] Генерирани production ключове
- [ ] Production Terminal ID получен от банката
- [ ] Production BACKREF URL одобрен от банката
- [ ] SSL сертификат инсталиран
- [ ] File permissions настроени (chmod 400)
- [ ] Тествано с малка сума

Вижте `DATECS_SETUP_GUIDE.md` за пълна документация.

