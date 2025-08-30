'use client'

import { useRef } from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

interface ImageCarouselProps {
  images: Array<{
    src: string
    alt: string
  }>
}

/**
 * Image carousel component for Pizza Stop homepage using react-slick.
 * @param {ImageCarouselProps} props - Component props containing image data.
 * @returns {JSX.Element} The JSX code for the ImageCarousel component.
 */
const ImageCarousel = ({ images }: ImageCarouselProps) => {
  const sliderRef = useRef<Slider>(null)

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    arrows: false,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          dots: true
        }
      }
    ]
  }

  return (
    <div className="image-carousel">
      <Slider ref={sliderRef} {...settings}>
        {images.map((image, index) => (
          <div key={index} className="carousel-slide">
            <img 
              src={image.src} 
              alt={image.alt} 
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </Slider>
    </div>
  )
}

export default ImageCarousel
