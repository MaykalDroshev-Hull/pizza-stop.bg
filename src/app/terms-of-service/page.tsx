import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Общи условия - Pizza Stop',
  description: 'Общи условия за ползване на услугите на Pizza Stop',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-8">
          Общи условия
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-text-secondary">
          <p className="text-sm text-text-muted mb-8">
            Последна актуализация: {new Date().toLocaleDateString('bg-BG')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Общи положения</h2>
            <p>
              Добре дошли в Pizza Stop. Използвайки нашия уебсайт и услуги, вие приемате настоящите общи условия.
              Моля, прочетете ги внимателно преди да направите поръчка.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Поръчки</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Всички поръчки подлежат на потвърждение от наша страна</li>
              <li>Ние си запазваме правото да откажем поръчка при необичайни обстоятелства</li>
              <li>Цените са в български лева (BGN) и включват ДДС</li>
              <li>Минималната стойност за поръчка за доставка е 10 лв.</li>
              <li>Всички продукти са съобразени с актуалното меню и наличност</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Доставка</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Зона 1 (Център на Ловеч):</strong> Доставка 3 лв., време за доставка 30-45 минути</li>
              <li><strong>Зона 2 (Разширена зона):</strong> Доставка 7 лв., време за доставка 45-60 минути</li>
              <li>Времето за доставка е ориентировъчно и може да варира в зависимост от натовареността</li>
              <li>При лоши метеорологични условия времето за доставка може да се удължи</li>
              <li>Доставяме само в обозначените зони на картата</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Вземане от ресторант</h2>
            <p>
              При избор на опция "Вземане от ресторант", поръчката ви ще бъде готова за вземане след 30 минути
              на адрес: ул. "Ангел Кънчев" 10, 5502 Ловеч, България
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Плащане</h2>
            <p className="mb-4">Приемаме следните методи на плащане:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>В брой на адрес/в ресторант</li>
              <li>С карта на адрес/в ресторант</li>
              <li>Онлайн плащане (скоро)</li>
            </ul>
            <p className="mt-4">
              Плащането се извършва при получаване на поръчката, освен при онлайн плащане.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Отказ от поръчка</h2>
            <p>
              Можете да откажете вашата поръчка без такса, ако я откажете преди да е била приготвена.
              Моля, свържете се с нас възможно най-скоро на телефон +359 88 812 3456.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Рекламации</h2>
            <p>
              Ако не сте доволни от качеството на продуктите или услугата, моля свържете се с нас в рамките на 24 часа
              от получаване на поръчката. Ще направим всичко възможно да разрешим проблема.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Алергени</h2>
            <p>
              Нашите продукти могат да съдържат алергени като глутен, млечни продукти, яйца и други.
              Ако имате алергии, моля уведомете ни при поръчка или се свържете с нас предварително.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Интелектуална собственост</h2>
            <p>
              Всичко съдържание на този уебсайт, включително текст, графики, лога и изображения,
              е собственост на Pizza Stop и е защитено от законите за авторско право.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Отговорност</h2>
            <p>
              Pizza Stop не носи отговорност за непреки или косвени щети, произтичащи от използването на услугите ни,
              освен когато законът изрично изисква това.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Работно време</h2>
            <div className="bg-bg-secondary p-4 rounded-lg">
              <p><strong>Понеделник - Неделя:</strong> 10:00 - 23:00</p>
              <p className="text-sm text-text-muted mt-2">
                * Работното време може да варира по време на празници
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Контакти</h2>
            <div className="bg-bg-secondary p-4 rounded-lg">
              <p><strong>Pizza Stop</strong></p>
              <p>Адрес: ул. "Ангел Кънчев" 10, 5502 Ловеч, България</p>
              <p>Email: info@pizza-stop.bg</p>
              <p>Телефон: +359 88 812 3456</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Промени в условията</h2>
            <p>
              Ние си запазваме правото да променяме тези общи условия по всяко време. Промените влизат в сила
              веднага след публикуването им на тази страница. Препоръчваме да преглеждате условията периодично.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Приложимо право</h2>
            <p>
              Тези общи условия се уреждат от законодателството на Република България.
              Всички спорове ще се решават от компетентните български съдилища.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}



