'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-text">
          PIZZA STOP
        </h1>
        <p className="text-xl text-muted max-w-md">
          Най-вкусните пици, дюнери и бургери в Ловеч
        </p>
        <Link 
          href="/order" 
          className="inline-flex px-8 py-4 bg-gradient-to-r from-red to-orange text-white font-bold rounded-2xl hover:scale-105 transition-transform shadow-lg"
        >
          Поръчай сега!
        </Link>
      </div>
    </div>
  )
}
