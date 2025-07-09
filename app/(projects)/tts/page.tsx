"use client"

import TTS from '@/components/tts'
import { useEffect, useState } from 'react'

export default function TTSPage() {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        return <div>Loading...</div>
    }

    return <TTS />
}

