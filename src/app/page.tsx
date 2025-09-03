'use client'

import { useEffect, useRef } from 'react'
import { Laptop, ChefHat, Pizza } from 'lucide-react'
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
              <h3 className={styles.sectionSubtitle}>История</h3>
              
              <div className={styles.modernTimeline} ref={timelineRef}>
                {/* Vertical line */}
                <div className={styles.timelineLine}></div>

                <div className={styles.timelineMilestones}>
                  <div className={styles.timelineMilestone}>
                    {/* Timeline dot */}
                    <div className={styles.timelineDot}></div>
                    
                    {/* Content */}
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineYear}>2019</div>
                      <h4>Основаване</h4>
                      <p>Pizza Stop е създаден в Ловеч от хора, които обичат простите неща — добро тесто, качествени продукти и честно отношение.</p>
                    </div>
                  </div>

                  <div className={styles.timelineMilestone}>
                    {/* Timeline dot */}
                    <div className={styles.timelineDot}></div>
                    
                    {/* Content */}
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineYear}>2021</div>
                      <h4>Разширяване на менюто</h4>
                      <p>Добавихме дюнери с домашно изпечени питки и сочни бургери за разнообразие.</p>
                    </div>
                  </div>

                  <div className={styles.timelineMilestone}>
                    {/* Timeline dot */}
                    <div className={styles.timelineDot}></div>
                    
                    {/* Content */}
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineYear}>2024</div>
                      <h4>Днес</h4>
                      <p>Предлагаме пици, дюнери и бургери, приготвени с грижа и фокус върху свежи продукти и постоянство.</p>
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
            
            {/* First Row - 10 images */}
            <div className={styles.galleryRow}>
              <div className={styles.galleryScroll} aria-label="Първи ред - Галерия изображения">
                <div className={styles.galleryItem}>
                  <img src="https://scontent-sof1-2.xx.fbcdn.net/v/t39.30808-6/526985220_684709021270944_4200233230927842784_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=uaYTQvb5TvAQ7kNvwHtvQGG&_nc_oc=Adkb9XEPlOZ8w8NNSXk5znCiS2ExTtNWzSohDobfkjd0kWDkvozUNescA2A8yPCo5Tw&_nc_zt=23&_nc_ht=scontent-sof1-2.xx&_nc_gid=pkG79PK18Of4QG0uBybV4Q&oh=00_AfX_yEueC1hTTUj0ewxHb-SerGdechkgkTIgAsMaJK4NGg&oe=68B0FF52" alt="Пица в пещ" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="https://scontent-sof1-2.xx.fbcdn.net/v/t39.30808-6/527893495_684709094604270_2558257343909708339_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=97msyQ5ETZwQ7kNvwHZNEqc&_nc_oc=AdlCnRQRa_8B_gOXChVbIM2ZkGNvbczH8mrmUppUQmhEavvgj0iMsRyuQ0y1-Al7iUE&_nc_zt=23&_nc_ht=scontent-sof1-2.xx&_nc_gid=jeUuG9lqfHvcJLWdvbglFA&oh=00_AfW3Gwf4d8G3Ybn9mmEqSuj0YjFhOidOHpkIWsY4fdFY6A&oe=68B0E35B" alt="Прясно изпечена питка за дюнер" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="https://scontent-sof1-2.xx.fbcdn.net/v/t39.30808-6/520284109_122258189900209471_5973626421948966995_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_ohc=s4feUvPcQNwQ7kNvwHqUIrO&_nc_oc=Adk2qb-pnL-y5IisIMYY0HYT9hT80JsHrjDqDChWlyglRR3wMs-KlTor165mkWlZcEM&_nc_zt=23&_nc_ht=scontent-sof1-2.xx&_nc_gid=4uPcOeqvDhHyn9UQ9kJFig&oh=00_AfWsJixsjMUNaKIte4KtbDbxA1DANJxLf_gq-xYWoitYRw&oe=68B0F48D" alt="Сочен бургер с пържени картофки" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="https://scontent-sof1-2.xx.fbcdn.net/v/t39.30808-6/518241137_122256498722209471_3188355770032574904_n.jpg?stp=dst-jpg_s720x720_tt6&_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_ohc=5YYlueBssAgQ7kNvwEpM-Gq&_nc_oc=AdkDOuyZXio5oBGIOKENvtttx6XNnQWjfY4xZm0d16uC5KyHjtAq_W1DZuBpHr5G218&_nc_zt=23&_nc_ht=scontent-sof1-2.xx&_nc_gid=jOjgin8v6s_wAluIIlydbw&oh=00_AfXLX6yHe5Bv2-jZPiPII_vebvJ0n43TvQME_c3iSmgFtA&oe=68B0E598" alt="Салати и свежи продукти" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="https://scontent-sof1-1.xx.fbcdn.net/v/t39.30808-6/515261854_122254251272209471_2543286723672665656_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=ysiZMHejHO8Q7kNvwHLU57E&_nc_oc=AdkAI3aL7O1CuXdv4tDAECU4aMgsopo9GBgVmAed80Ec6CfChl-NvXnKKz0kJiBBLWg&_nc_zt=23&_nc_ht=scontent-sof1-1.xx&_nc_gid=AvKPh9ibnkq6kOFKndQLDQ&oh=00_AfVbrHNFMvM8c1xYcl6Zs96WgACbgEKjSohLnZFGs8-yPQ&oe=68B0C9A9" alt="Екипът в действие" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="https://scontent-sof1-1.xx.fbcdn.net/v/t39.30808-6/514491567_122254251356209471_7106824869418487445_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=5d5P6dhDMtsQ7kNvwF4YlB6&_nc_oc=AdlMEC-64tKWF5Yio7x8-yYLSGMbwZnA07Vs2JMWciZ51VTYNdqhT-NKSmLcvadstEk&_nc_zt=23&_nc_ht=scontent-sof1-1.xx&_nc_gid=S0g5oXXCXBekG0IHiXwApQ&oh=00_AfV7JI3nVe3HPf59tPWz25hBhmi_evMu9y1XYdNcaVJW2A&oe=68B0F5BF" alt="Кутии за доставка" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="https://scontent-sof1-1.xx.fbcdn.net/v/t39.30808-6/503841471_1131606122336937_7043991344755942665_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_ohc=sT7ISQb13JwQ7kNvwEMRgao&_nc_oc=Adl4LloxKQEu-cksy_1SWjkUyYcGvqrXQ5wGO0T6YeWmf2m_ik5unwb6-zyfKTMprEw&_nc_zt=23&_nc_ht=scontent-sof1-1.xx&_nc_gid=Y_5LPj5mqIUlE-7A0HO_xg&oh=00_AfWO15FZRcGuQBlUkbHchCOfCEQcMPKUdnj4XRWO_bBmKg&oe=68B0FF7B" alt="Паста/калцоне" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="https://scontent-sof1-1.xx.fbcdn.net/v/t39.30808-6/473569501_122204807804209471_7813004766313737611_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=M6iJDmvLQbUQ7kNvwFz3i8c&_nc_oc=Adnr3-LT7htIXKSdjZEpkSA8UkCX9PhDfQm6C3bfg4WZeqy220QckN4OX7ZaewTx7ug&_nc_zt=23&_nc_ht=scontent-sof1-1.xx&_nc_gid=4mcNMlbsKz0NcE5Be42ekQ&oh=00_AfW-rsiAM05dk-CNdYtqaD2PR1up-cZqouhXufKweahXyg&oe=68B0F0E1D6" alt="Кафе/напитки" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="https://images.unsplash.com/photo-1513104890138-7c74966a5a99?w=400&h=300&fit=crop&crop=center" alt="Пица Маргарита" loading="lazy" />
                </div>
                <div className={styles.galleryItem}>
                  <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&crop=center" alt="Пица Пеперони" loading="lazy" />
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
                <h3>Правите ли доставка?</h3>
                <p>Да — доставяме в рамките на гр. Ловеч. Обадете се на <a href="tel:+35968670070">068 670070</a> за подробности.</p>
              </div>
              <div className="card">
                <h3>Какви са работните ви часове?</h3>
                <p>Пон.–Съб.: 11:00–23:00, Нед.: 11:00–21:00. Прием на поръчки: 9:30–22:30.</p>
              </div>
              <div className="card">
                <h3>Имате ли вегетариански опции?</h3>
                <p>Да — предлагаме вегетариански пици и гарнитури. Попитайте екипа при поръчка.</p>
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
