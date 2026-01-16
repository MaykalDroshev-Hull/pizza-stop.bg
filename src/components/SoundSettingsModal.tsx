'use client'

import { useState, useEffect } from 'react'
import { X, Volume2, VolumeX } from 'lucide-react'

interface SoundSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  soundEnabled: boolean
  onSoundEnabledChange: (enabled: boolean) => void
  soundDuration: number
  onSoundDurationChange: (duration: number) => void
  volume: number
  onVolumeChange: (volume: number) => void
}

export default function SoundSettingsModal({
  isOpen,
  onClose,
  soundEnabled,
  onSoundEnabledChange,
  soundDuration,
  onSoundDurationChange,
  volume,
  onVolumeChange
}: SoundSettingsModalProps) {
  const [localDuration, setLocalDuration] = useState(soundDuration)
  const [localVolume, setLocalVolume] = useState(volume)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLocalDuration(soundDuration)
      setLocalVolume(volume)
    }
  }, [isOpen, soundDuration, volume])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update duration in database
      const response = await fetch('/api/restaurant-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          NewOrderSoundDuration: localDuration
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Settings saved successfully:', result)
        
        // Update state immediately
        onSoundDurationChange(localDuration)
        onVolumeChange(localVolume)
        
        // Verify the state was updated
        console.log('State updated to duration:', localDuration)
        
        onClose()
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to save settings:', error)
        alert(`Грешка при запазване на настройките: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving sound settings:', error)
      alert('Грешка при запазване на настройките')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestSound = () => {
    if (!soundEnabled) return
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Play sound for the configured duration
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + localDuration * 0.25)
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + localDuration * 0.5)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + localDuration * 0.75)
    
    gainNode.gain.setValueAtTime(0.3 * localVolume, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.4 * localVolume, audioContext.currentTime + localDuration * 0.25)
    gainNode.gain.setValueAtTime(0.3 * localVolume, audioContext.currentTime + localDuration * 0.5)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + localDuration)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + localDuration)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Настройки на звука</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] touch-manipulation flex items-center justify-center"
          >
            <X size={24} />
          </button>
        </div>

        {/* Sound Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-white font-medium">Звук при нови поръчки</label>
            <button
              onClick={() => onSoundEnabledChange(!soundEnabled)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors min-w-[44px] min-h-[44px] touch-manipulation flex items-center justify-center ${
                soundEnabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>

        {/* Duration Settings */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-3">
            Продължителност на звука (секунди): {localDuration}с
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="30"
              value={localDuration}
              onChange={(e) => setLocalDuration(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              disabled={!soundEnabled}
            />
            <input
              type="number"
              min="1"
              max="30"
              value={localDuration}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                if (val >= 1 && val <= 30) {
                  setLocalDuration(val)
                }
              }}
              className="w-20 px-3 py-2 bg-gray-700 text-white rounded-lg text-center"
              disabled={!soundEnabled}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Изберете продължителността на звука при получаване на нова поръчка (1-30 секунди)
          </p>
        </div>

        {/* Volume Settings */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-3">
            Сила на звука: {Math.round(localVolume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={localVolume}
            onChange={(e) => setLocalVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            disabled={!soundEnabled}
          />
        </div>

        {/* Test Sound Button */}
        <div className="mb-6">
          <button
            onClick={handleTestSound}
            disabled={!soundEnabled || isSaving}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors min-h-[44px] touch-manipulation ${
              soundEnabled && !isSaving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Тествай звука
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors min-h-[44px] touch-manipulation ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? 'Запазване...' : 'Запази'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation"
          >
            Отказ
          </button>
        </div>
      </div>
    </div>
  )
}
