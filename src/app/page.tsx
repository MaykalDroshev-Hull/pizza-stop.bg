'use client'

import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, Plus, Minus, X, MapPin, Clock, Check, Search, Star, Truck, Zap } from 'lucide-react'

// Mock data
const menuData = {
  pizza: [
    { id: 1, name: 'Маргарита', price: 18.90, image: '🍕', category: 'pizza', rating: 4.8, time: '15-20 мин' },
    { id: 2, name: 'Пепперони', price: 22.90, image: '🍕', category: 'pizza', rating: 4.9, time: '15-20 мин' },
    { id: 3, name: 'Капричоза', price: 24.90, image: '🍕', category: 'pizza', rating: 4.7, time: '15-20 мин' },
    { id: 4, name: 'Кватро Формаджи', price: 26.90, image: '🍕', category: 'pizza', rating: 4.9, time: '15-20 мин' },
    { id: 5, name: 'Вегетарианска', price: 20.90, image: '🍕', category: 'pizza', rating: 4.6, time: '15-20 мин' }
  ],
  doners: [
    { id: 11, name: 'Класически дюнер', price: 8.50, image: '🥙', category: 'doners', rating: 4.7, time: '8-12 мин' },
    { id: 12, name: 'Пилешки дюнер', price: 9.50, image: '🥙', category: 'doners', rating: 4.8, time: '8-12 мин' },
    { id: 13, name: 'Вегански дюнер', price: 7.50, image: '🥙', category: 'doners', rating: 4.5, time: '8-12 мин' },
    { id: 14, name: 'Дюнер с риба', price: 10.50, image: '🥙', category: 'doners', rating: 4.6, time: '8-12 мин' }
  ],
  burgers: [
    { id: 21, name: 'Класически бургер', price: 12.90, image: '🍔', category: 'burgers', rating: 4.6, time: '10-15 мин' },
    { id: 22, name: 'Чийзбургер', price: 14.90, image: '🍔', category: 'burgers', rating: 4.7, time: '10-15 мин' },
    { id: 23, name: 'Бейкън бургер', price: 16.90, image: '🍔', category: 'burgers', rating: 4.8, time: '10-15 мин' },
    { id: 24, name: 'Вегански бургер', price: 13.90, image: '🍔', category: 'burgers', rating: 4.5, time: '10-15 мин' }
  ],
  drinks: [
    { id: 31, name: 'Кока-кола', price: 3.50, image: '🥤', category: 'drinks', sizes: ['330ml', '500ml'], rating: 4.5, time: '2-5 мин' },
    { id: 32, name: 'Фанта', price: 3.50, image: '🥤', category: 'drinks', sizes: ['330ml', '500ml'], rating: 4.5, time: '2-5 мин' },
    { id: 33, name: 'Вода', price: 2.50, image: '💧', category: 'drinks', sizes: ['500ml', '1.5L'], rating: 4.4, time: '2-5 мин' },
    { id: 34, name: 'Сок портокал', price: 4.50, image: '🧃', category: 'drinks', sizes: ['330ml'], rating: 4.6, time: '2-5 мин' }
  ]
}

function FlyingFoodAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      if (canvas && typeof window !== 'undefined') {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    if (typeof window !== 'undefined') {
      setCanvasDimensions();
      window.addEventListener('resize', setCanvasDimensions);
    }

    // Food items array
    const foodItems = [];
    const numberOfItems = 25;

    // Food emojis and their properties
    const foodTypes = [
      { emoji: '🍕', size: 25, speed: 0.8, rotation: 0.02, color: '#FF6B35' }, // Pizza
      { emoji: '🥙', size: 22, speed: 0.6, rotation: 0.015, color: '#FFD93D' }, // Döner
      { emoji: '🍔', size: 24, speed: 0.7, rotation: 0.018, color: '#FF6B6B' }, // Burger
      { emoji: '🥗', size: 18, speed: 0.5, rotation: 0.01, color: '#4ECDC4' }, // Salad
      { emoji: '🧅', size: 16, speed: 0.4, rotation: 0.008, color: '#FFE66D' }, // Onion
      { emoji: '🍅', size: 15, speed: 0.45, rotation: 0.009, color: '#FF6B6B' }, // Tomato
      { emoji: '🥬', size: 14, speed: 0.35, rotation: 0.007, color: '#95E1D3' }, // Lettuce
      { emoji: '🧀', size: 20, speed: 0.55, rotation: 0.012, color: '#FFD93D' }, // Cheese
      { emoji: '🌶️', size: 12, speed: 0.6, rotation: 0.014, color: '#FF6B35' }, // Chili
      { emoji: '🌿', size: 13, speed: 0.4, rotation: 0.006, color: '#95E1D3' }  // Herbs
    ];

    class FoodItem {
      emoji: string;
      size: number;
      x: number;
      y: number;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      color: string;
      opacity: number;
      canvasWidth: number;
      canvasHeight: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        const foodType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
        this.emoji = foodType.emoji;
        this.size = foodType.size + Math.random() * 8;
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.speedX = (Math.random() - 0.5) * foodType.speed;
        this.speedY = (Math.random() - 0.5) * foodType.speed;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = foodType.rotation;
        this.color = foodType.color;
        this.opacity = Math.random() * 0.6 + 0.4;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        // Wrap around edges
        if (this.x > this.canvasWidth + this.size) this.x = -this.size;
        if (this.x < -this.size) this.x = this.canvasWidth + this.size;
        if (this.y > this.canvasHeight + this.size) this.y = -this.size;
        if (this.y < -this.size) this.y = this.canvasHeight + this.size;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;

        // Draw emoji
        ctx.font = this.size + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);

        ctx.restore();
      }
    }

    // Initialize food items
    function init() {
      if (!canvas) return;
      for (let i = 0; i < numberOfItems; i++) {
        foodItems.push(new FoodItem(canvas.width, canvas.height));
      }
    }

    // Animation loop
    function animate() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background gradient
      const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
      gradient.addColorStop(0, 'rgba(255, 107, 53, 0.1)');
      gradient.addColorStop(0.5, 'rgba(255, 209, 61, 0.05)');
      gradient.addColorStop(1, 'rgba(30, 58, 138, 0.02)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw food items
      for (let i = 0; i < foodItems.length; i++) {
        foodItems[i].update();
        foodItems[i].draw(ctx);
      }

      requestAnimationFrame(animate);
    }

    // Use a timeout to ensure canvas is properly initialized
    const initTimeout = setTimeout(() => {
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        init();
        animate();
      }
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(initTimeout);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', setCanvasDimensions);
      }
    };

  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="food-canvas"
      aria-hidden="true"
      role="presentation"
    />
  );
}

export default function HomePage() {
  // Hide sticky CTA when footer is in view
  useEffect(() => {
    const stickyCta = document.querySelector('.sticky-cta');
    const footer = document.querySelector('footer');
    
    if (!stickyCta || !footer) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stickyCta.classList.add('footer-hidden');
          } else {
            stickyCta.classList.remove('footer-hidden');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    observer.observe(footer);
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Flying Food Animation */}
      <FlyingFoodAnimation />
      
      {/* Sticky mobile ORDER NOW */}
      <div className="sticky-cta" aria-hidden="false">
        <a href="/order" aria-label="Поръчай по телефона">
           <span>ПОРЪЧАЙ СЕГА</span>
        </a>
      </div>

      <main id="home">
        {/* HERO */}
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-grid">
              <div>
                <h2>Гладен ли си? <span style={{background:'linear-gradient(90deg,var(--yellow),var(--orange),var(--red))',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent'}}>Пицa, Дюнер, Бургер</span> — на един клик</h2>
                <p>Домашно изпечени хлебчета за дюнер, пухкаво тесто и сочни бургери. Бърза доставка в Ловеч.</p>
                <div className="cta">
                  <a className="primary" href="/order">ПОРЪЧАЙ СЕГА</a>
                  <a className="secondary" href="/order">🍟 Виж менюто</a>
                </div>
                
              </div>
              <div className="hero-media" aria-label="Снимки на продукти">
                {/* Реални изображения от Facebook */}
                <img src="https://scontent-sof1-1.xx.fbcdn.net/v/t39.30808-6/529622656_122263829654209471_8222953551163377384_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=xp9rK0uwKtsQ7kNvwE_L9V-&_nc_oc=AdlLx37EEe2FuBiefoO5DKOIHZW6BEOqDCmxiQ0BGLocOGh_qKf2OkNheCj14fDzVUs&_nc_zt=23&_nc_ht=scontent-sof1-1.xx&_nc_gid=WFfNEUsNBnS95qOhE4tZuA&oh=00_AfV12ROolAze6Ri9XgN8XTuLQSQXErKbCP_KjcJ7fe4XEw&oe=68B0F26C" alt="Пица от Facebook" loading="lazy" />
                <img src="https://scontent-sof1-1.xx.fbcdn.net/v/t39.30808-6/529475268_122263830092209471_1436610829896190427_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=pJ7YyfipsJgQ7kNvwHdsRrw&_nc_oc=AdldIzlaDjuSmEjMvpy59xzy3mmYl2fPGRL51hNQJ7GZlmRJhqjEeu6LtMZCbFQXwEc&_nc_zt=23&_nc_ht=scontent-sof1-1.xx&_nc_gid=TaBAUMzbahuFDJa8FklZ9A&oh=00_AfVsRAEej9VCRQvUPk4wtXfTS5Iqb3A6MQXGPyeIO3COAQ&oe=68B0E382" alt="Дюнер с хрупкава питка, изпечена на място" loading="lazy" />
                <img src="https://scontent-sof1-1.xx.fbcdn.net/v/t39.30808-6/529823033_122263830230209471_1392674418984212748_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=oWEJt0AcwuQQ7kNvwGuG_iP&_nc_oc=AdltPofJ-EBsDShdQTKZOuGg5FOIt0OsvaJ8Q3Qp2_vh-qgIPfFBcd-UWrjpqVZf9XY&_nc_zt=23&_nc_ht=scontent-sof1-1.xx&_nc_gid=EJaMrWrpl6aiAXZYiVMHIg&oh=00_AfUKJfmMPwp5vP34gLuB325W78lfKbsoN4DYrVbRh7okiQ&oe=68B0DAA8" alt="Бургер от Facebook" loading="lazy" />
                <img src="https://scontent-sof1-2.xx.fbcdn.net/v/t39.30808-6/529385155_122263829960209471_5107459254101783599_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=833d8c&_nc_ohc=KM2kvnsvCdMQ7kNvwEyZQpV&_nc_oc=AdmaqNQwLf_L1_ijKV2fmGk0zS7lAhrGvOWIE47BgY_SL_UMIE3L211HNCEPLrwoYCs&_nc_zt=23&_nc_ht=scontent-sof1-2.xx&_nc_gid=5lc-uWu7jgcKnldNV1YX5g&oh=00_AfWC_mWvFqXn2Y2XdX7bPRFgBsqVA1MOOtMIjd0KeTo68w&oe=68B0CBD6" alt="Кухня от Facebook" loading="lazy" />
              </div>
            </div>
          </div>
        </section>

        {/* ЗА НАС / ИСТОРИЯ / ЕКИП / СЕРТИФИКАТИ (ЛАНДИНГ ПРОСТРАНСТВО) */}
        <section id="about">
          <div className="container">
            <h2 className="section-title">За нас</h2>
            
            {/* ИСТОРИЯ - Timeline Design */}
            <div className="timeline-section">
              <h3 className="section-subtitle">История</h3>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-marker">🍕</div>
                  <div className="timeline-content">
                    <h4>Основаване</h4>
                    <p>Pizza Stop е създаден в Ловеч от хора, които обичат простите неща — добро тесто, качествени продукти и честно отношение.</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker">🥙</div>
                  <div className="timeline-content">
                    <h4>Разширяване на менюто</h4>
                    <p>Добавихме дюнери с домашно изпечени питки и сочни бургери за разнообразие.</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker">⭐</div>
                  <div className="timeline-content">
                    <h4>Днес</h4>
                    <p>Предлагаме пици, дюнери и бургери, приготвени с грижа и фокус върху свежи продукти и постоянство.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ЕКИП - Personal Team Cards */}
            <div className="team-section">
              <h3 className="section-subtitle">Екип</h3>
              <div className="team-grid">
                <div className="team-member">
                  <div className="member-avatar">RS</div>
                  <h4>Румен Стойчев</h4>
                  <p className="member-role">Пицамайстор / Дюнер майстор</p>
                  <p className="member-desc">Майстор на тестото и пещта. Специалист в италианските техники за пица.</p>
                </div>
                <div className="team-member">
                  <div className="member-avatar">PM</div>
                  <h4>Павлина М.</h4>
                  <p className="member-role">Касиер / Бариста</p>
                  <p className="member-desc">Грижи се за гостите и поддържа всичко в движение в ресторанта.</p>
                </div>
                <div className="team-member">
                  <div className="member-avatar">🍕</div>
                  <h4>Екипът</h4>
                  <p className="member-role">Кухненски персонал</p>
                  <p className="member-desc">Професионалисти, които приготвят всяко ястие с внимание към детайла.</p>
                </div>
              </div>
            </div>

            {/* СЕРТИФИКАТИ - Achievement Showcase */}
            <div className="certificates-section">
              <h3 className="section-subtitle">Сертификати и обучения</h3>
              <div className="certificates-grid">
                <div className="certificate-item">
                  <div className="cert-icon">🏅</div>
                  <h4>Италиански майстори</h4>
                  <p>Обучения с Alessandro Scandola и други експерти в пица майсторството</p>
                </div>
                <div className="certificate-item">
                  <div className="cert-icon">🧼</div>
                  <h4>Хигиенни стандарти</h4>
                  <p>Следваме високи хигиенни практики в кухнята и обслужването</p>
                </div>
                <div className="certificate-item">
                  <div className="cert-icon">📚</div>
                  <h4>Постоянно обучение</h4>
                  <p>Екипът редовно участва в майсторски класове и подобрява уменията си</p>
                </div>
                <div className="certificate-item">
                  <div className="cert-icon">📄</div>
                  <h4>Сертификати</h4>
                  <p>HACCP и други сертификати за качество и безопасност на храните</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ГАЛЕРИЯ */}
        <section id="gallery">
          <div className="container">
            <h2 className="section-title">Галерия</h2>
                         <div className="gallery" aria-label="Снимки от кухнята и продуктите">
               {/* Реални изображения от Facebook */}
               <img src="https://scontent-sof1-2.xx.fbcdn.net/v/t39.30808-6/526985220_684709021270944_4200233230927842784_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=uaYTQvb5TvAQ7kNvwHtvQGG&_nc_oc=Adkb9XEPlOZ8w8NNSXk5znCiS2ExTtNWzSohDobfkjd0kWDkvozUNescA2A8yPCo5Tw&_nc_zt=23&_nc_ht=scontent-sof1-2.xx&_nc_gid=pkG79PK18Of4QG0uBybV4Q&oh=00_AfX_yEueC1hTTUj0ewxHb-SerGdechkgkTIgAsMaJK4NGg&oe=68B0FF52" alt="Пица в пещ" loading="lazy" />
               <img src="https://scontent-sof1-2.xx.fbcdn.net/v/t39.30808-6/527893495_684709094604270_2558257343909708339_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=97msyQ5ETZwQ7kNvwHZNEqc&_nc_oc=AdlCnRQRa_8B_gOXChVbIM2ZkGNvbczH8mrmUppUQmhEavvgj0iMsRyuQ0y1-Al7iUE&_nc_zt=23&_nc_ht=scontent-sof1-2.xx&_nc_gid=jeUuG9lqfHvcJLWdvbglFA&oh=00_AfW3Gwf4d8G3Ybn9mmEqSuj0YjFhOidOHpkIWsY4fdFY6A&oe=68B0E35B" alt="Прясно изпечена питка за дюнер" loading="lazy" />
               <img src="https://scontent-sof1-2.xx.fbcdn.net/v/t39.30808-6/520284109_122258189900209471_5973626421948966995_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_ohc=s4feUvPcQNwQ7kNvwHqUIrO&_nc_oc=Adk2qb-pnL-y5IisIMYY0HYT9hT80JsHrjDqDChWlyglRR3wMs-KlTor165mkWlZcEM&_nc_zt=23&_nc_ht=scontent-sof1-2.xx&_nc_gid=4uPcOeqvDhHyn9UQ9kJFig&oh=00_AfWsJixsjMUNaKIte4KtbDbxA1DANJxLf_gq-xYWoitYRw&oe=68B0F48D" alt="Сочен бургер с пържени картофки" loading="lazy" />
               <img src="https://scontent-sof1-2.xx.fbcdn.net/v/t39.30808-6/518241137_122256498722209471_3188355770032574904_n.jpg?stp=dst-jpg_s720x720_tt6&_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_ohc=5YYlueBssAgQ7kNvwEpM-Gq&_nc_oc=AdkDOuyZXio5oBGIOKENvtttx6XNnQWjfY4xZm0d16uC5KyHjtAq_W1DZuBpHr5G218&_nc_zt=23&_nc_ht=scontent-sof1-2.xx&_nc_gid=jOjgin8v6s_wAluIIlydbw&oh=00_AfXLX6yHe5Bv2-jZPiPII_vebvJ0n43TvQME_c3iSmgFtA&oe=68B0E598" alt="Салати и свежи продукти" loading="lazy" />
               <img src="https://scontent-sof1-1.xx.fbcdn.net/v/t39.30808-6/515261854_122254251272209471_2543286723672665656_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=ysiZMHejHO8Q7kNvwHLU57E&_nc_oc=AdkAI3aL7O1CuXdv4tDAECU4aMgsopo9GBgVmAed80Ec6CfChl-NvXnKKz0kJiBBLWg&_nc_zt=23&_nc_ht=scontent-sof1-1.xx&_nc_gid=AvKPh9ibnkq6kOFKndQLDQ&oh=00_AfVbrHNFMvM8c1xYcl6Zs96WgACbgEKjSohLnZFGs8-yPQ&oe=68B0C9A9" alt="Екипът в действие" loading="lazy" />
               <img src="https://scontent-sof1-1.xx.fbcdn.net/v/t39.30808-6/514491567_122254251356209471_7106824869418487445_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=5d5P6dhDMtsQ7kNvwF4YlB6&_nc_oc=AdlMEC-64tKWF5Yio7x8-yYLSGMbwZnA07Vs2JMWciZ51VTYNdqhT-NKSmLcvadstEk&_nc_zt=23&_nc_ht=scontent-sof1-1.xx&_nc_gid=S0g5oXXCXBekG0IHiXwApQ&oh=00_AfV7JI3nVe3HPf59tPWz25hBhmi_evMu9y1XYdNcaVJW2A&oe=68B0F5BF" alt="Кутии за доставка" loading="lazy" />
               <img src="https://scontent-sof1-1.xx.fbcdn.net/v/t39.30808-6/503841471_1131606122336937_7043991344755942665_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_ohc=sT7ISQb13JwQ7kNvwEMRgao&_nc_oc=Adl4LloxKQEu-cksy_1SWjkUyYcGvqrXQ5wGO0T6YeWmf2m_ik5unwb6-zyfKTMprEw&_nc_zt=23&_nc_ht=scontent-sof1-1.xx&_nc_gid=Y_5LPj5mqIUlE-7A0HO_xg&oh=00_AfWO15FZRcGuQBlUkbHchCOfCEQcMPKUdnj4XRWO_bBmKg&oe=68B0FF7B" alt="Паста/калцоне" loading="lazy" />
               <img src="https://scontent-sof1-1.xx.fbcdn.net/v/t39.30808-6/473569501_122204807804209471_7813004766313737611_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=M6iJDmvLQbUQ7kNvwFz3i8c&_nc_oc=Adnr3-LT7htIXKSdjZEpkSA8UkCX9PhDfQm6C3bfg4WZeqy220QckN4OX7ZaewTx7ug&_nc_zt=23&_nc_ht=scontent-sof1-1.xx&_nc_gid=4mcNMlbsKz0NcE5Be42ekQ&oh=00_AfW-rsiAM05dk-CNdYtqaD2PR1up-cZqouhXufKweahXyg&oe=68B0E1D6" alt="Кафе/напитки" loading="lazy" />
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
