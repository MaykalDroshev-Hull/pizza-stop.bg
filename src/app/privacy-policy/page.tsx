import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Политика за поверителност - Pizza Stop',
  description: 'Политика за поверителност и защита на личните данни на Pizza Stop',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-8">
          Политика за поверителност
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-text-secondary">
          <p className="text-sm text-text-muted mb-8">
            Последна актуализация: {new Date().toLocaleDateString('bg-BG')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Въведение</h2>
            <p>
              Pizza Stop ("ние", "нас", "нашия") зачита вашата поверителност и се ангажира да защитава вашите лични данни.
              Тази политика за поверителност ще ви информира как се грижим за вашите лични данни, когато посещавате нашия уебсайт
              и ще ви разкаже за вашите права относно поверителността.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Данни, които събираме</h2>
            <p className="mb-4">Ние можем да събираме, използваме, съхраняваме и прехвърляме различни видове лични данни за вас:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Данни за идентичност:</strong> име, имейл адрес</li>
              <li><strong>Контактни данни:</strong> телефонен номер, адрес за доставка</li>
              <li><strong>Данни за поръчката:</strong> детайли за поръчаните продукти, предпочитан метод на плащане</li>
              <li><strong>Технически данни:</strong> IP адрес, тип браузър, часова зона, локация</li>
              <li><strong>Данни за използването:</strong> информация как използвате нашия уебсайт</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Как използваме вашите данни</h2>
            <p className="mb-4">Ние използваме вашите лични данни за следните цели:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Обработка и изпълнение на вашите поръчки</li>
              <li>Комуникация с вас относно вашата поръчка</li>
              <li>Подобряване на нашите услуги и уебсайт</li>
              <li>Изпращане на маркетингови съобщения (само с вашето съгласие)</li>
              <li>Спазване на законови задължения</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Споделяне на данни</h2>
            <p>
              Ние не продаваме вашите лични данни. Може да споделим вашите данни с трети страни само когато е необходимо
              за изпълнение на поръчката ви (например, доставчици) или когато е изискано от закона.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Съхранение на данни</h2>
            <p>
              Ние съхраняваме вашите лични данни само толкова дълго, колкото е необходимо за целите, описани в тази политика,
              или докато законът изисква. След това вашите данни се изтриват или анонимизират.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Вашите права</h2>
            <p className="mb-4">Съгласно GDPR, вие имате следните права:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Право на достъп:</strong> можете да поискате копие от вашите лични данни</li>
              <li><strong>Право на коригиране:</strong> можете да коригирате неточни данни</li>
              <li><strong>Право на изтриване:</strong> можете да поискате изтриване на вашите данни</li>
              <li><strong>Право на ограничаване:</strong> можете да ограничите обработката на вашите данни</li>
              <li><strong>Право на преносимост:</strong> можете да получите вашите данни в структуриран формат</li>
              <li><strong>Право на възражение:</strong> можете да възразите срещу обработката на вашите данни</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Бисквитки (Cookies)</h2>
            <p>
              Нашият уебсайт използва бисквитки за подобряване на потребителското изживяване. Вие можете да контролирате
              използването на бисквитки чрез настройките на вашия браузър. Моля, вижте нашата банер за бисквитки за повече информация.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Сигурност</h2>
            <p>
              Ние прилагаме подходящи технически и организационни мерки за защита на вашите лични данни от неоторизиран достъп,
              загуба или разрушаване.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Контакт</h2>
            <p className="mb-4">
              Ако имате въпроси относно тази политика за поверителност или искате да упражните вашите права, моля свържете се с нас:
            </p>
            <div className="bg-bg-secondary p-4 rounded-lg">
              <p><strong>Pizza Stop</strong></p>
              <p>Адрес: ул. "Ангел Кънчев" 10, 5502 Ловеч, България</p>
              <p>Email: privacy@pizza-stop.bg</p>
              <p>Телефон: +359 88 812 3456</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Промени в политиката</h2>
            <p>
              Ние можем да актуализираме тази политика за поверителност от време на време. Всички промени ще бъдат публикувани
              на тази страница с нова дата на актуализация.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}



