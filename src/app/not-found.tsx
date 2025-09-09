'use client'

import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.text}>404</div>
      <div className={styles.scene}>
        {/* Caveman Left */}
        <div className={styles.caveman}>
          <div className={styles.leg}>
            <div className={styles.foot}>
              <div className={styles.fingers}></div>
            </div>
          </div>
          <div className={styles.leg}>
            <div className={styles.foot}>
              <div className={styles.fingers}></div>
            </div>
          </div>
          <div className={styles.shape}>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
          </div>
          <div className={styles.head}>
            <div className={styles.eye}>
              <div className={styles.nose}></div>
            </div>
            <div className={styles.mouth}></div>
          </div>
          <div className={styles.armRight}>
            <div className={styles.pizza}>
              <div className={styles.pizzaCrust}></div>
              <div className={styles.pizzaSauce}></div>
              <div className={styles.pizzaToppings}>
                <div className={`${styles.topping} ${styles.topping1}`}></div>
                <div className={`${styles.topping} ${styles.topping2}`}></div>
                <div className={`${styles.topping} ${styles.topping3}`}></div>
                <div className={`${styles.topping} ${styles.topping4}`}></div>
                <div className={`${styles.topping} ${styles.topping5}`}></div>
                <div className={`${styles.topping} ${styles.topping6}`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Caveman Right */}
        <div className={`${styles.caveman} ${styles.cavemanRight}`}>
          <div className={styles.leg}>
            <div className={styles.foot}>
              <div className={styles.fingers}></div>
            </div>
          </div>
          <div className={styles.leg}>
            <div className={styles.foot}>
              <div className={styles.fingers}></div>
            </div>
          </div>
          <div className={styles.shape}>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
          </div>
          <div className={styles.head}>
            <div className={styles.eye}>
              <div className={styles.nose}></div>
            </div>
            <div className={styles.mouth}></div>
          </div>
          <div className={styles.armRight}>
            <div className={styles.pizza}>
              <div className={styles.pizzaCrust}></div>
              <div className={styles.pizzaSauce}></div>
              <div className={styles.pizzaToppings}>
                <div className={`${styles.topping} ${styles.topping1}`}></div>
                <div className={`${styles.topping} ${styles.topping2}`}></div>
                <div className={`${styles.topping} ${styles.topping3}`}></div>
                <div className={`${styles.topping} ${styles.topping4}`}></div>
                <div className={`${styles.topping} ${styles.topping5}`}></div>
                <div className={`${styles.topping} ${styles.topping6}`}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Error Message */}
      <div className={styles.errorMessage}>
        <h1>Страницата не е намерена!</h1>
        <p>Изглежда, че тази страница е изчезнала в пица-вселената!</p>
        <div className={styles.actions}>
          <a href="/" className={styles.homeButton}>
            Начална страница
          </a>
          <a href="/order" className={styles.orderButton}>
            Поръчай пица
          </a>
        </div>
      </div>
    </div>
  )
}
