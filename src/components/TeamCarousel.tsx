'use client'

import { useEffect, useState } from 'react'
import styles from '../styles/home.module.css'

interface TeamMember {
  name: string
  role: string
  image: string
}

const teamMembers: TeamMember[] = [
  {
    name: "Румен Стойчев",
    role: "Пицамайстор / Дюнер майстор",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=3687&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    name: "Мария Петрова",
    role: "Шеф на кухнята",
    image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    name: "Иван Георгиев",
    role: "Мениджър доставки",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZmVzc2lvbmFsJTIwcGVvcGxlfGVufDB8fDB8fHww"
  },
  {
    name: "Павлина М.",
    role: "Касиер / Бариста",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cHJvZmVzc2lvbmFsJTIwcGVvcGxlfGVufDB8fDB8fHww"
  },
  {
    name: "Екипът",
    role: "Кухненски персонал",
    image: "https://images.unsplash.com/photo-1655249481446-25d575f1c054?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjh8fHByb2Zlc3Npb25hbCUyMHBlb3BsZXxlbnwwfHwwfHx8MA%3D%3D"
  },
  {
    name: "Кухненски екип",
    role: "Професионалисти",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=3687&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  }
]

export default function TeamCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const updateCarousel = (newIndex: number) => {
    if (isAnimating) return
    setIsAnimating(true)

    const index = (newIndex + teamMembers.length) % teamMembers.length
    setCurrentIndex(index)

    setTimeout(() => {
      setIsAnimating(false)
    }, 800)
  }

  const getCardClass = (index: number) => {
    // Calculate the offset from the current index
    let offset = index - currentIndex
    
    // Handle wrapping around the array
    if (offset > teamMembers.length / 2) {
      offset -= teamMembers.length
    } else if (offset < -teamMembers.length / 2) {
      offset += teamMembers.length
    }

    // Assign classes based on offset
    if (offset === 0) return styles.cardCenter
    if (offset === 1) return styles.cardRight1
    if (offset === 2) return styles.cardRight2
    if (offset === -1) return styles.cardLeft1
    if (offset === -2) return styles.cardLeft2
    return styles.cardHidden
  }

  // Debug: Log current state (removed for performance)
  // useEffect(() => {
  //   console.log('Current index:', currentIndex)
  //   teamMembers.forEach((member, index) => {
  //     const className = getCardClass(index)
  //     console.log(`Card ${index} (${member.name}): ${className}`)
  //   })
  // }, [currentIndex])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      updateCarousel(currentIndex - 1)
    } else if (e.key === 'ArrowRight') {
      updateCarousel(currentIndex + 1)
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex])

  // Auto-switch every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % teamMembers.length)
    }, 3000)

    return () => clearInterval(interval)
  }, []) // Remove currentIndex from dependencies to prevent infinite loop

  return (
    <div className={styles.teamCarouselSection}>
      <h2 className={styles.teamCarouselTitle}>Нашият екип</h2>
      
      <div className={styles.carouselContainer}>
        <button 
          className={`${styles.navArrow} ${styles.navArrowLeft}`}
          onClick={() => updateCarousel(currentIndex - 1)}
          aria-label="Предишен член на екипа"
        >
          ‹
        </button>
        
        <div className={styles.carouselTrack}>
          {teamMembers.map((member, index) => (
            <div 
              key={index}
              className={`${styles.card} ${getCardClass(index)}`}
              onClick={() => updateCarousel(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  updateCarousel(index)
                }
              }}
            >
              <img
                src={member.image}
                alt={member.name}
                loading="lazy"
              />
            </div>
          ))}
        </div>
        
        <button 
          className={`${styles.navArrow} ${styles.navArrowRight}`}
          onClick={() => updateCarousel(currentIndex + 1)}
          aria-label="Следващ член на екипа"
        >
          ›
        </button>
      </div>

      <div className={styles.memberInfo}>
        <h3 className={styles.memberName}>{teamMembers[currentIndex].name}</h3>
        <p className={styles.memberRole}>{teamMembers[currentIndex].role}</p>
      </div>

      <div className={styles.dots}>
        {teamMembers.map((_, index) => (
          <div
            key={index}
            className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
            onClick={() => updateCarousel(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                updateCarousel(index)
              }
            }}
            aria-label={`Покажи ${teamMembers[index].name}`}
          />
        ))}
      </div>
    </div>
  )
}
