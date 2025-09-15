'use client'

import { useEffect, useRef } from 'react'
import { Laptop, ChefHat, Pizza, Sandwich, Utensils } from 'lucide-react'
import styles from '../styles/home.module.css'
import TeamCarousel from '../components/TeamCarousel'
import DeliveryAreaMap from '../components/DeliveryAreaMap'


function FlyingFoodAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  return (
    <canvas
      ref={canvasRef}
      className={styles.foodCanvas}
      aria-hidden="true"
      role="presentation"
    />
  );
}

import { isRestaurantOpen } from '../utils/openingHours'

export default function HomePage() {
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Business status - should match NavBar component
  const isOpen = isRestaurantOpen()
  
  // Hide sticky CTA when footer is in view
  useEffect(() => {
    const stickyCta = document.querySelector(`.${styles.stickyCta}`);
    const footer = document.querySelector('footer');
    
    if (!stickyCta || !footer) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stickyCta.classList.add(styles.footerHidden);
          } else {
            stickyCta.classList.remove(styles.footerHidden);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    observer.observe(footer);
    
    return () => observer.disconnect();
  }, []);

  // Timeline scroll animation
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timeline.classList.add(styles.timelineAnimated);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(timeline);
    return () => observer.disconnect();
  }, []);



  return (
    <>
      {/* Flying Food Animation */}
      <FlyingFoodAnimation />
      

      <main id="home">
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroLayout}>
            {/* Left decorative image */}
            <div className={styles.heroLeftContainer}>
              <img src="/images/home/logo.png" alt="" className={styles.heroLeft} aria-hidden="true" />
            </div>
            
            {/* Centered content */}
            <div className={styles.heroContent}>
              <h2>Гладен ли си? Пица, Дюнер, Бургер — на един клик</h2>
              <p>Домашно изпечени хлебчета за дюнер, пухкаво тесто и сочни бургери. Бърза доставка в Ловеч.</p>
              <div className={styles.cta}>
                <a className={styles.primary} href="/order">
                  {isOpen ? 'ПОРЪЧАЙ СЕГА' : 'ПОРЪЧАЙ ЗА ПО-КЪСНО'}
                </a>
              </div>
            </div>
            
            {/* Right decorative image */}
            <div className={styles.heroRightContainer}>
              <img src="/images/home/right.png" alt="" className={styles.heroRight} aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* КАК ДА ПОРЪЧАМЕ - 3 Steps */}
        <section className={styles.howToOrderSection}>
          <div className="container">
            <h2 className={styles.howToOrderTitle}>Как да поръчаме</h2>
            
            <div className={styles.stepsGrid}>
              <div className={styles.stepItem}>
                <div className={styles.stepIcon}>
                  <Laptop className={styles.lucideIcon} />
                </div>
                <h3>Поръчайте от нашия уебсайт</h3>
                <p>Изберете любимите си ястия от нашето меню онлайн</p>
              </div>
              
              <div className={styles.stepItem}>
                <div className={styles.stepIcon}>
                  <ChefHat className={styles.lucideIcon} />
                </div>
                <h3>Нашият екип готви и доставя</h3>
                <p>Професионални готвачи приготвят поръчката ви с грижа</p>
              </div>
              
              <div className={styles.stepItem}>
                <div className={styles.stepIcon}>
                  <Pizza className={styles.lucideIcon} />
                </div>
                <h3>Наслаждавайте се на най-добрата пица в Ловеч</h3>
                <p>Получете гореща и свежа поръчка директно у дома</p>
              </div>
            </div>
          </div>
        </section>

        {/* ЗА НАС / ЕКИП / ИСТОРИЯ / СЕРТИФИКАТИ (ЛАНДИНГ ПРОСТРАНСТВО) */}
        <section id="about" className={styles.aboutSection}>
          <div className="container">
            
            {/* ЕКИП */}
            <TeamCarousel />

            {/* ИСТОРИЯ - Modern Timeline Design */}
            <div className={styles.modernTimelineSection}>
              <h3 className={styles.sectionSubtitle}>Нашата история</h3>
              
              <div className={styles.modernTimeline} ref={timelineRef}>
                {/* Vertical line */}
                <div className={styles.timelineLine}></div>

                <div className={styles.timelineMilestones}>
                  <div className={styles.timelineMilestone}>
                    {/* Timeline dot */}
                    <div className={styles.timelineDot}></div>
                    
                    {/* Content */}
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineYear}>2023</div>
                      <h4>Началото</h4>
                      <p>Pizza Stop отвори врати на 1 март 2023 г. в Ловеч – с една проста, но силна идея: да предложим пица, направена с внимание, страст и истински вкус.</p>
                    </div>
                  </div>

                  <div className={styles.timelineMilestone}>
                    {/* Timeline dot */}
                    <div className={styles.timelineDot}></div>
                    
                    {/* Content */}
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineYear}>2024</div>
                      <h4>Разширяване</h4>
                      <p>Само година по-късно, през 2024 г., разширихме менюто с още повече пици и бургери и стартирахме доставка до адрес с нашия личен брандиран автомобил, за да стигаме по-бързо и по-удобно до клиентите си.</p>
                    </div>
                  </div>

                  <div className={styles.timelineMilestone}>
                    {/* Timeline dot */}
                    <div className={styles.timelineDot}></div>
                    
                    {/* Content */}
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineYear}>2025</div>
                      <h4>Модернизация</h4>
                      <p>През 2025 г. направихме голяма крачка напред – основен ремонт, ново професионално оборудване и най-добрата пещ за пици. Днес можем да предложим не само повече качество, но и още по-бързо обслужване.</p>
                    </div>
                  </div>

                  <div className={styles.timelineMilestone}>
                    {/* Timeline dot */}
                    <div className={styles.timelineDot}></div>
                    
                    {/* Content */}
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineYear}>Днес</div>
                      <h4>Нашата философия</h4>
                      <p>Pizza Stop е не просто място за храна – това е място, където всеки ден влагаме желание, усмивки и вкус в това, което правим. Всички наши пици се приготвят с жива квас и отлежало тесто, което е напълно безвредно за човешкия организъм. Работим само с подбрани и качествени продукти, за да гарантираме най-добрия вкус.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>



        {/* РАЙОНИ ЗА ДОСТАВКА */}
        <DeliveryAreaMap apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} />

        {/* ГАЛЕРИЯ */}
        <section id="gallery" className={styles.gallerySection}>
          <div className={styles.galleryContainer}>
            
            {/* First Row - Same images as second row but shuffled */}
            <div className={styles.galleryRow}>
              <div className={styles.galleryScroll} aria-label="Първи ред - Галерия изображения">
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-samerdaboul-2233729.jpg" alt="Салата Цезар" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-robinstickel-70497.jpg" alt="Дюнер с месо" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-muffin-1653877.jpg" alt="Пица Хавайска" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-valeriya-1639557.jpg" alt="Бургер класически" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-guto-macedo-72150916-8444548.jpg" alt="Дюнер с пилешко" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-rdne-8523507.jpg" alt="Пържени картофки" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-viniciusbenedit-1082343.jpg" alt="Бургер с сирене" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-andrebeltrame-1878346.jpg" alt="Пица Кватро Формаджи" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-polina-tankilevitch-4109111.jpg" alt="Дюнер вегетариански" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-robinstickel-70497.jpg" alt="Бургер с бекон" loading="lazy" />
                </div>
              </div>
            </div>

            {/* Second Row - 10 images */}
            <div className={styles.galleryRow}>
              <div className={styles.galleryScroll} aria-label="Втори ред - Галерия изображения">
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-robinstickel-70497.jpg" alt="Дюнер с месо" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-valeriya-1639557.jpg" alt="Бургер класически" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-rdne-8523507.jpg" alt="Пържени картофки" loading="lazy" />
                </div>
                                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-samerdaboul-2233729.jpg" alt="Салата Цезар" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-andrebeltrame-1878346.jpg" alt="Пица Кватро Формаджи" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-polina-tankilevitch-4109111.jpg" alt="Дюнер вегетариански" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-viniciusbenedit-1082343.jpg" alt="Бургер с сирене" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-muffin-1653877.jpg" alt="Пица Хавайска" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-guto-macedo-72150916-8444548.jpg" alt="Дюнер с пилешко" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="/images/home/toDelete/pexels-robinstickel-70497.jpg" alt="Бургер с бекон" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ЧЗВ */}
        <section id="faq">
          <div className="container">
            <h2 className="section-title">Често задавани въпроси</h2>
            <div className="grid">
              <div className="card">
                <h3>Мога ли да направя поръчка без телефонен номер?</h3>
                <p>Не – за да бъде доставена поръчката, е нужен телефон за връзка.</p>
              </div>
              <div className="card">
                <h3>Мога ли да комбинирам различни половини пица?</h3>
                <p>Да – това важи за пиците 60 см.</p>
              </div>
              <div className="card">
                <h3>Какви начини на плащане предлагате?</h3>
                <p>Плащане в брой или с карта при доставка / на място.</p>
              </div>
              <div className="card">
                <h3>Мога ли да направя предварителна поръчка за купон или събитие?</h3>
                <p>Да – приемаме поръчки с отложен час до 5 дни предварително.</p>
              </div>
              <div className="card">
                <h3>Доставяте ли извън Ловеч?</h3>
                <p>Да – доставяме и до близките села (в зона 2, с такса 7 лв. и минимална поръчка от 30 лв.).</p>
              </div>
            </div>
          </div>
        </section>

        {/* ДОПЪЛНИТЕЛНА ИНФОРМАЦИЯ */}
        <section id="additional-info" className={styles.additionalInfoSection}>
          <div className="container">
            <h2 className="section-title">Добавки и правила за поръчки</h2>
            
            <div className="grid">
              <div className="card">
                <h3>
                  <Sandwich className={styles.lucideIcon} />
                  Дюнери и бургери
                </h3>
                <div className={styles.rulesContent}>
                  <div className={styles.ruleItem}>
                    <h4>Включени добавки</h4>
                    <p>Всеки дюнер или бургер включва до <strong>3 зеленчука</strong> по избор и <strong>2 соса</strong> (например чеснов и самурай).</p>
                  </div>
                  
                  <div className={styles.ruleItem}>
                    <h4>Допълнителни добавки</h4>
                    <p>Всяка допълнителна добавка над включените се заплаща по <span className={styles.price}>0.50 лв.</span></p>
                  </div>
                  
                  <div className={styles.ruleItem}>
                    <h4>Допълнително месо</h4>
                    <p>При дюнерите може да се добави допълнително месо (100 г) – <span className={styles.price}>2.00 лв.</span></p>
                  </div>
                  
                  <div className={styles.ruleItem}>
                    <h4>Бургери с двойно месо</h4>
                    <p>При бургерите няма нужда да се добавят допълнителни кюфтета, защото в менюто вече се предлагат варианти с двойно месо.</p>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <h3>
                  <Pizza className={styles.lucideIcon} />
                  Пици
                </h3>
                <div className={styles.rulesContent}>
                  <div className={styles.ruleItem}>
                    <h4>Персонализация</h4>
                    <p>Всеки продукт от наличното меню може да бъде добавян или премахван.</p>
                  </div>
                  
                  <div className={styles.ruleItem}>
                    <h4>Пример</h4>
                    <p><strong>Пица Маргарита</strong> може да се направи без маслини и с добавена царевица.</p>
                  </div>
                  
                  <div className={styles.ruleItem}>
                    <h4>Ограничения за замяни</h4>
                    <p>Не е позволена директна замяна на зеленчук за месо или на зеленчук за сирена/моцарела.</p>
                  </div>
                  
                  <div className={styles.ruleItem}>
                    <h4>Замени чрез коментар</h4>
                    <p>Ако клиентът иска да направи замяна, това може да се отбележи като коментар към поръчката, а останалите добавки се таксуват по стандартната цена.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* SEO / Schema.org */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Restaurant",
          "name": "Pizza Stop",
          "servesCuisine": ["Pizza","Doner","Burger"],
          "telephone": "+35968670070",
          "areaServed": "Lovech, Bulgaria",
          "address": {"@type":"PostalAddress","addressLocality":"Lovech","addressCountry":"BG"},
          "openingHours": [
            "Mo-Sa 11:00-23:00",
            "Su 11:00-21:00"
          ],
          "url": "https://example.com",
          "sameAs": ["https://www.facebook.com/profile.php?id=61556284154831"]
        })
      }} />
    </>
  )
}
